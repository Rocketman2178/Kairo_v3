import {
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
  Download,
  Home,
  Share2,
} from 'lucide-react';
import { downloadICS } from '../../utils/calendarExport';

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
  onGoHome: () => void;
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
  onGoHome,
}: RegistrationConfirmationProps) {
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
                  <span className="text-sm text-gray-500">Amount Paid</span>
                  <span className="font-semibold text-gray-900">
                    ${(amountCents / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}
