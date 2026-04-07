import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
  Download,
  Home,
  Share2,
  PlusCircle,
  CreditCard,
  AlertCircle,
  UserCircle,
} from 'lucide-react';
import { downloadICS } from '../../utils/calendarExport';
import { BiometricSetupPrompt } from './BiometricAuthPrompt';
import { BiometricSettings } from './BiometricSettings';
import { calculatePaymentPlans, type PlanType } from '../../utils/paymentPlans';

interface RegistrationConfirmationProps {
  childName: string;
  programName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  locationName: string;
  locationAddress: string;
  amountCents: number;
  isDemo: boolean;
  /** Payment plan chosen at checkout. When not 'full', a billing schedule notice is shown. */
  paymentPlanType?: PlanType;
  /** Season length in weeks — used to compute installment schedule. Defaults to 9. */
  sessionWeeks?: number;
  /** Parent email — used for biometric setup. If provided, biometric opt-in is shown. */
  parentEmail?: string;
  /** Parent name — used for biometric setup display name. */
  parentName?: string;
  onGoHome: () => void;
  onAddAnotherChild?: () => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(time24: string): string {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

export default function RegistrationConfirmation({
  childName,
  programName,
  dayOfWeek,
  startTime,
  endTime,
  startDate,
  locationName,
  locationAddress,
  amountCents,
  isDemo,
  paymentPlanType = 'full',
  sessionWeeks = 9,
  parentEmail,
  parentName,
  onGoHome,
  onAddAnotherChild,
}: RegistrationConfirmationProps) {
  const [biometricSetupDone, setBiometricSetupDone] = useState(false);

  function handleAddToCalendar() {
    downloadICS(
      {
        title: `${programName} - ${childName}`,
        startDate,
        startTime,
        endTime,
        dayOfWeek,
        durationWeeks: 9,
        location: locationAddress || locationName,
        description: `${childName} is registered for ${programName} at ${locationName}.`,
      },
      `${childName}-${programName}`.toLowerCase().replace(/\s+/g, '-')
    );
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: 'Registration Confirmed!',
        text: `${childName} is registered for ${programName} on ${DAY_NAMES[dayOfWeek]}s at ${formatTime(startTime)}!`,
      });
    }
  }

  const confirmationNumber = `KAI-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  // Billing schedule — only computed when an installment plan was selected
  const isInstallmentPlan = paymentPlanType !== 'full';
  const billingSchedule = isInstallmentPlan
    ? (() => {
        const sessionStart = startDate ? new Date(startDate + 'T00:00:00') : undefined;
        const plans = calculatePaymentPlans(amountCents, sessionWeeks, sessionStart);
        return plans.find((p) => p.id === paymentPlanType)?.billingSchedule ?? [];
      })()
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Registration Complete!</h1>
            <p className="text-green-100 mt-1">
              {childName} is all set for {programName}
            </p>
            {isDemo && (
              <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs">
                Demo Registration
              </span>
            )}
          </div>

          <div className="p-6 space-y-5">
            <div className="text-center text-xs text-gray-400 uppercase tracking-wider">
              Confirmation #{confirmationNumber}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {DAY_NAMES[dayOfWeek]}s at {formatTime(startTime)}
                    {endTime && ` - ${formatTime(endTime)}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{locationName}</span>
                  {locationAddress && (
                    <p className="text-xs text-gray-500">{locationAddress}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900">
                  Starting{' '}
                  {startDate
                    ? new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'soon'}
                </span>
              </div>
              {amountCents > 0 && (
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {isInstallmentPlan ? 'First Payment' : 'Amount Paid'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${(amountCents / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Recurring payment notice — shown when an installment plan was selected */}
            {isInstallmentPlan && billingSchedule.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-900 text-sm">Recurring charges will apply</h3>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Your remaining payments will be charged automatically on the dates below.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {billingSchedule.map((installment, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700">{installment.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">
                        ${(installment.amountCents / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  You'll receive an email reminder before each charge.
                </p>
              </div>
            )}

            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 text-sm mb-2">Before Your First Session</h3>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Check your email for confirmation details
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Arrive 10 minutes early for the first session
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Bring water, sunscreen, and comfortable clothes
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Soccer cleats optional but recommended
                </li>
              </ul>
            </div>

            {/* Biometric auth — first-time setup prompt, then settings management */}
            {!isDemo && parentEmail && !biometricSetupDone && (
              <BiometricSetupPrompt
                userEmail={parentEmail}
                userName={parentName || parentEmail}
                onSetupComplete={() => setBiometricSetupDone(true)}
                onSkip={() => setBiometricSetupDone(true)}
              />
            )}
            {!isDemo && biometricSetupDone && (
              <BiometricSettings
                userEmail={parentEmail}
                userName={parentName || parentEmail}
              />
            )}

            {onAddAnotherChild && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <PlusCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900 text-sm">Register another child?</p>
                    <p className="text-green-700 text-sm mt-0.5">
                      Save 25% on your next registration with our sibling discount — automatically applied.
                    </p>
                    <button
                      onClick={onAddAnotherChild}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors text-sm"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Another Child — Save 25%
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleAddToCalendar}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Add to Calendar
              </button>
              {'share' in navigator && (
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              )}
            </div>

            <button
              onClick={onGoHome}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </button>

            {/* View account link — takes parent straight to portal, pre-filled with their email */}
            {parentEmail && (
              <Link
                to={`/portal?email=${encodeURIComponent(parentEmail)}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UserCircle className="h-4 w-4" />
                View My Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
