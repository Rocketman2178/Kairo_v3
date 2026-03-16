import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';
import { getStripe, isStripeConfigured } from '../lib/stripe';
import { useCartAbandonment } from '../hooks/useCartAbandonment';
import PaymentForm from '../components/registration/PaymentForm';
import RegistrationSteps from '../components/registration/RegistrationSteps';
import RegistrationConfirmation from '../components/registration/RegistrationConfirmation';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  User,
  Loader2,
  AlertCircle,
  Timer,
  Shield,
  Star,
  Users,
} from 'lucide-react';

interface PendingRegistration {
  registrationId: string;
  childName: string;
  childAge: number;
  session: {
    id: string;
    programName: string;
    programDescription: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    startDate: string;
    locationName: string;
    locationAddress: string;
    capacity: number;
    enrolledCount: number;
  };
  amountCents: number;
  expiresAt: string;
}

interface FormData {
  parentFirstName: string;
  parentLastName: string;
  email: string;
  phone: string;
  childDateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes: string;
  agreedToTerms: boolean;
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

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const STEPS = [
  { label: 'Session', shortLabel: 'Session' },
  { label: 'Your Info', shortLabel: 'Info' },
  { label: 'Payment', shortLabel: 'Pay' },
  { label: 'Done', shortLabel: 'Done' },
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const paymentStatus = searchParams.get('payment_status');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<PendingRegistration | null>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(!isStripeConfigured());
  const [, setPaymentPlan] = useState<'full' | 'monthly' | 'biweekly'>('full');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasOtherRegistrations, setHasOtherRegistrations] = useState(false);
  const [isReturningFamily, setIsReturningFamily] = useState(false);
  const [existingFamilyId, setExistingFamilyId] = useState<string | null>(null);
  const emailLookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formData, setFormData] = useState<FormData>({
    parentFirstName: '',
    parentLastName: '',
    email: '',
    phone: '',
    childDateOfBirth: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalNotes: '',
    agreedToTerms: false,
  });

  const { markRecovered } = useCartAbandonment(
    {
      registrationToken: token,
      sessionId: registration?.session.id,
      childName: registration?.childName,
      programName: registration?.session.programName,
      amountCents: registration?.amountCents,
      currentStep: step,
      email: formData.email,
    },
    step === 3
  );

  useEffect(() => {
    if (!token) {
      setError('No registration token provided. Please start a new chat to register.');
      setLoading(false);
      return;
    }

    if (paymentStatus === 'success') {
      setStep(3);
    }

    loadPendingRegistration();
  }, [token]);

  useEffect(() => {
    if (!registration?.expiresAt) return;

    function updateTime() {
      const remaining = Math.max(
        0,
        Math.floor((new Date(registration!.expiresAt).getTime() - Date.now()) / 1000)
      );
      setTimeRemaining(remaining);
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [registration?.expiresAt]);

  async function loadPendingRegistration() {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_pending_registration', {
        p_registration_token: token,
      });

      if (rpcError) throw rpcError;

      if (data.error) {
        setError(data.message || 'Registration not found or expired');
        setLoading(false);
        return;
      }

      setRegistration({
        registrationId: data.registration_id,
        childName: data.child_name,
        childAge: data.child_age,
        session: {
          id: data.session.id,
          programName: data.session.program_name,
          programDescription: data.session.program_description || '',
          dayOfWeek: data.session.day_of_week,
          startTime: data.session.start_time,
          endTime: data.session.end_time || '',
          startDate: data.session.start_date || '',
          locationName: data.session.location_name || 'TBD',
          locationAddress: data.session.location_address || '',
          capacity: data.session.capacity,
          enrolledCount: data.session.enrolled_count,
        },
        amountCents: data.amount_cents,
        expiresAt: data.expires_at,
      });
      setLoading(false);
    } catch (err) {
      console.error('Failed to load registration:', err);
      setError('Failed to load registration details. Please try again.');
      setLoading(false);
    }
  }

  async function lookupFamilyByEmail(email: string) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setIsReturningFamily(false);
      setHasOtherRegistrations(false);
      setExistingFamilyId(null);
      return;
    }

    try {
      const { data: family } = await supabase
        .from('families')
        .select('id, primary_contact_name, phone')
        .eq('email', email)
        .maybeSingle();

      if (!family) {
        setIsReturningFamily(false);
        setHasOtherRegistrations(false);
        setExistingFamilyId(null);
        return;
      }

      setExistingFamilyId(family.id);

      // Pre-fill name and phone if empty
      const nameParts = ((family.primary_contact_name as string) || '').split(' ');
      setFormData((prev) => ({
        ...prev,
        parentFirstName: prev.parentFirstName || nameParts[0] || '',
        parentLastName: prev.parentLastName || nameParts.slice(1).join(' ') || '',
        phone: prev.phone || (family.phone as string) || '',
      }));

      // Check for active registrations (sibling discount trigger)
      const { data: registrations } = await supabase
        .from('registrations')
        .select('id')
        .eq('family_id', family.id)
        .in('status', ['confirmed', 'pending_registration', 'awaiting_payment'])
        .limit(1);

      const hasSiblings = !!(registrations && registrations.length > 0);
      setHasOtherRegistrations(hasSiblings);
      setIsReturningFamily(true);
    } catch {
      // Silent failure — don't block registration on lookup errors
    }
  }

  const createPaymentIntent = useCallback(async () => {
    if (isDemo || !token) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'Apikey': anonKey,
        },
        body: JSON.stringify({
          registrationToken: token,
          paymentPlanType: 'full',
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (data.demo) {
        setIsDemo(true);
        return;
      }

      if (data.error) {
        setError(data.message || 'Failed to initialize payment');
        return;
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Payment intent creation failed:', err);
      setIsDemo(true);
    }
  }, [token, formData.email, isDemo]);

  function validateStep2(): boolean {
    if (!formData.parentFirstName.trim() || !formData.parentLastName.trim()) {
      setError('Please enter your first and last name.');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Please enter your phone number.');
      return false;
    }
    if (!formData.emergencyContactName.trim() || !formData.emergencyContactPhone.trim()) {
      setError('Please provide emergency contact information.');
      return false;
    }
    if (!formData.agreedToTerms) {
      setError('Please agree to the terms and conditions.');
      return false;
    }
    setError(null);
    return true;
  }

  async function handleNextStep() {
    if (step === 0) {
      setStep(1);
    } else if (step === 1 && validateStep2()) {
      setSubmitting(true);
      await createFamilyAndChild();
      await createPaymentIntent();
      setSubmitting(false);
      setStep(2);
    }
  }

  async function createFamilyAndChild() {
    try {
      let currentFamilyId = existingFamilyId;

      if (!currentFamilyId) {
        // New family — create record
        const { data: family, error: familyError } = await supabase
          .from('families')
          .insert({
            primary_contact_name: `${formData.parentFirstName} ${formData.parentLastName}`,
            email: formData.email,
            phone: formData.phone,
          })
          .select()
          .single();

        if (familyError) throw familyError;
        currentFamilyId = family.id;
      }

      setFamilyId(currentFamilyId);

      const { data: child, error: childError } = await supabase
        .from('children')
        .insert({
          family_id: currentFamilyId,
          first_name: registration?.childName || '',
          date_of_birth: formData.childDateOfBirth || new Date().toISOString().split('T')[0],
          medical_info: formData.medicalNotes ? { notes: formData.medicalNotes } : {},
        })
        .select()
        .single();

      if (childError) throw childError;
      setChildId(child.id);
    } catch (err) {
      console.error('Failed to create family/child:', err);
      setError('Failed to save your information. Please try again.');
    }
  }

  async function handleDemoPayment() {
    setSubmitting(true);
    setError(null);

    try {
      let currentFamilyId = familyId;
      let currentChildId = childId;

      if (!currentFamilyId) {
        // Use existing family if returning, otherwise create new
        const resolvedFamilyId = existingFamilyId;
        if (resolvedFamilyId) {
          currentFamilyId = resolvedFamilyId;
          setFamilyId(resolvedFamilyId);
        } else {
          const { data: family, error: familyError } = await supabase
            .from('families')
            .insert({
              primary_contact_name: `${formData.parentFirstName} ${formData.parentLastName}`,
              email: formData.email,
              phone: formData.phone,
            })
            .select()
            .single();

          if (familyError) throw familyError;
          currentFamilyId = family.id;
          setFamilyId(family.id);
        }
      }

      if (!currentChildId) {
        const { data: child, error: childError } = await supabase
          .from('children')
          .insert({
            family_id: currentFamilyId!,
            first_name: registration?.childName || '',
            date_of_birth: formData.childDateOfBirth || new Date().toISOString().split('T')[0],
            medical_info: formData.medicalNotes ? { notes: formData.medicalNotes } : {},
          })
          .select()
          .single();

        if (childError) throw childError;
        currentChildId = child.id;
        setChildId(child.id);
      }

      const { data: confirmData, error: confirmError } = await supabase.rpc(
        'confirm_registration',
        {
          p_registration_token: token,
          p_family_id: currentFamilyId,
          p_child_id: currentChildId,
          p_payment_intent_id: `demo_payment_${Date.now()}`,
        }
      );

      if (confirmError) throw confirmError;

      if (confirmData.error) {
        setError(confirmData.message);
        setSubmitting(false);
        return;
      }

      markRecovered();
      setStep(3);
      setSubmitting(false);
    } catch (err) {
      console.error('Demo registration failed:', err);
      setError('Failed to complete registration. Please try again.');
      setSubmitting(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (error) setError(null);

    // Debounced email lookup for returning family / sibling detection
    if (name === 'email' && typeof newValue === 'string') {
      if (emailLookupTimeout.current) clearTimeout(emailLookupTimeout.current);
      emailLookupTimeout.current = setTimeout(() => {
        lookupFamilyByEmail(newValue);
      }, 600);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-gray-600">Loading registration details...</p>
        </div>
      </div>
    );
  }

  if (error && !registration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Registration Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Start New Registration
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <RegistrationConfirmation
        childName={registration?.childName || ''}
        programName={registration?.session.programName || ''}
        dayOfWeek={registration?.session.dayOfWeek || 0}
        startTime={registration?.session.startTime || ''}
        endTime={registration?.session.endTime || ''}
        startDate={registration?.session.startDate || ''}
        locationName={registration?.session.locationName || ''}
        locationAddress={registration?.session.locationAddress || ''}
        amountCents={registration?.amountCents || 0}
        isDemo={isDemo}
        onGoHome={() => navigate('/')}
        onAddAnotherChild={() => navigate('/')}
      />
    );
  }

  const minutesLeft = Math.floor(timeRemaining / 60);
  const secondsLeft = timeRemaining % 60;

  const mainContent = (
    <>
      <button
        onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {step > 0 ? 'Back' : 'Cancel'}
      </button>

      <RegistrationSteps currentStep={step} steps={STEPS} />

      {timeRemaining > 0 && timeRemaining < 600 && (
        <div className="mt-4 flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-2.5 rounded-xl text-sm border border-amber-200">
          <Timer className="h-4 w-4 flex-shrink-0" />
          <span>
            Spot reserved for {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}
          </span>
        </div>
      )}

      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {step === 0 && (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
              <h1 className="text-xl font-bold">Confirm Session</h1>
              <p className="text-blue-100 text-sm mt-1">
                Review the details for {registration?.childName}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <User className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Child</p>
                    <p className="font-medium text-gray-900">
                      {registration?.childName}, {registration?.childAge} yrs
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Schedule</p>
                    <p className="font-medium text-gray-900">
                      {DAY_NAMES[registration?.session.dayOfWeek || 0]}s at{' '}
                      {formatTime(registration?.session.startTime || '')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                    <p className="font-medium text-gray-900">
                      {registration?.session.locationName}
                    </p>
                    {registration?.session.locationAddress && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {registration.session.locationAddress}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Program</p>
                    <p className="font-medium text-gray-900">
                      {registration?.session.programName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatPrice(registration?.amountCents || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-xl">
                <Shield className="h-4 w-4" />
                <span>
                  {(registration?.session.capacity || 0) -
                    (registration?.session.enrolledCount || 0)}{' '}
                  spots remaining
                </span>
              </div>

              <button
                onClick={handleNextStep}
                className="w-full py-3.5 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
              <h1 className="text-xl font-bold">Your Information</h1>
              <p className="text-blue-100 text-sm mt-1">
                We need a few details to complete the registration
              </p>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {isReturningFamily && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <Star className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900 text-sm">Welcome back!</p>
                    <p className="text-amber-700 text-sm mt-0.5">
                      We found your account and pre-filled your details. A 5% returning family discount has been applied.
                    </p>
                  </div>
                </div>
              )}

              {hasOtherRegistrations && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900 text-sm">Sibling discount applied!</p>
                    <p className="text-green-700 text-sm mt-0.5">
                      25% off for registering another child from your family. Your savings will appear at checkout.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Parent / Guardian</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="parentFirstName"
                      value={formData.parentFirstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="parentLastName"
                      value={formData.parentLastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Child Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Child's Name
                    </label>
                    <input
                      type="text"
                      value={registration?.childName || ''}
                      disabled
                      className="w-full px-3.5 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="childDateOfBirth"
                      value={formData.childDateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Notes / Allergies (Optional)
                  </label>
                  <textarea
                    name="medicalNotes"
                    value={formData.medicalNotes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Any medical conditions or allergies we should know about"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleInputChange}
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>

              <button
                onClick={handleNextStep}
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
              <h1 className="text-xl font-bold">Payment</h1>
              <p className="text-blue-100 text-sm mt-1">
                Choose a plan and complete your payment
              </p>
            </div>

            <div className="p-6">
              <PaymentForm
                amountCents={registration?.amountCents || 0}
                programName={registration?.session.programName || ''}
                sessionStartDate={registration?.session.startDate}
                sessionWeeks={9}
                hasOtherRegistrations={hasOtherRegistrations}
                isReturningFamily={isReturningFamily}
                clientSecret={clientSecret}
                isDemo={isDemo}
                onPaymentPlanChange={setPaymentPlan}
                onDemoSubmit={handleDemoPayment}
                registrationToken={token || ''}
              />
            </div>
          </>
        )}
      </div>
    </>
  );

  if (!isDemo && clientSecret) {
    return (
      <Elements
        stripe={getStripe()}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: { colorPrimary: '#2563eb', borderRadius: '12px' },
          },
        }}
      >
        <div className="min-h-screen bg-gray-50 py-6 px-4 pb-24 sm:pb-6">
          <div className="max-w-2xl mx-auto">{mainContent}</div>
        </div>
      </Elements>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 pb-24 sm:pb-6">
      <div className="max-w-2xl mx-auto">{mainContent}</div>
    </div>
  );
}
