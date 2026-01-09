import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, MapPin, Clock, User, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<PendingRegistration | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
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

  useEffect(() => {
    if (!token) {
      setError('No registration token provided. Please start a new chat to register.');
      setLoading(false);
      return;
    }

    loadPendingRegistration();
  }, [token]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: `${formData.parentFirstName} ${formData.parentLastName}`,
          email: formData.email,
          phone: formData.phone,
        })
        .select()
        .single();

      if (familyError) throw familyError;

      const { data: child, error: childError } = await supabase
        .from('children')
        .insert({
          family_id: family.id,
          first_name: registration?.childName || '',
          date_of_birth: formData.childDateOfBirth || null,
          medical_notes: formData.medicalNotes || null,
        })
        .select()
        .single();

      if (childError) throw childError;

      const { data: confirmData, error: confirmError } = await supabase.rpc('confirm_registration', {
        p_registration_token: token,
        p_family_id: family.id,
        p_child_id: child.id,
        p_payment_intent_id: `demo_payment_${Date.now()}`,
      });

      if (confirmError) throw confirmError;

      if (confirmData.error) {
        setError(confirmData.message);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);
    } catch (err) {
      console.error('Registration failed:', err);
      setError('Failed to complete registration. Please try again.');
      setSubmitting(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading registration details...</p>
        </div>
      </div>
    );
  }

  if (error && !registration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Registration Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Start New Registration
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h1>
          <p className="text-gray-600 mb-6">
            {registration?.childName} has been successfully registered for {registration?.session.programName}.
            You will receive a confirmation email shortly.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-2">Next Steps:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Check your email for confirmation details</li>
              <li>Mark your calendar for {DAY_NAMES[registration?.session.dayOfWeek || 0]}s at {formatTime(registration?.session.startTime || '')}</li>
              <li>Arrive 10 minutes early for the first session</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const timeRemaining = registration?.expiresAt
    ? Math.max(0, Math.floor((new Date(registration.expiresAt).getTime() - Date.now()) / 1000 / 60))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold">Complete Registration</h1>
            <p className="text-blue-100 mt-1">
              Finish signing up {registration?.childName} for {registration?.session.programName}
            </p>
            {timeRemaining > 0 && (
              <p className="text-sm text-blue-200 mt-2">
                This reservation expires in {timeRemaining} minutes
              </p>
            )}
          </div>

          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900 mb-4">Session Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Child</p>
                  <p className="font-medium text-gray-900">
                    {registration?.childName} ({registration?.childAge} years old)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Schedule</p>
                  <p className="font-medium text-gray-900">
                    {DAY_NAMES[registration?.session.dayOfWeek || 0]}s at {formatTime(registration?.session.startTime || '')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{registration?.session.locationName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-medium text-gray-900">{formatPrice(registration?.amountCents || 0)}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Parent/Guardian Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="parentFirstName"
                    value={formData.parentFirstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="parentLastName"
                    value={formData.parentLastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Child Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Child's Name</label>
                  <input
                    type="text"
                    value={registration?.childName || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="childDateOfBirth"
                    value={formData.childDateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any medical conditions or allergies we should know about"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Payment Summary</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">{registration?.session.programName}</span>
                <span className="font-semibold text-gray-900">{formatPrice(registration?.amountCents || 0)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Payment processing will be available soon. For now, this is a demo registration.
              </p>
            </div>

            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-600 hover:underline">
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Complete Registration
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
