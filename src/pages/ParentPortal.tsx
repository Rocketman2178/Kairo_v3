import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Baby,
  Star,
  Shield,
  Home,
  Edit2,
  Save,
  X,
  Ticket,
  Timer,
  Info,
  ListOrdered,
  BellRing,
  XCircle,
  ArrowRightLeft,
  CreditCard,
  Send,
  Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FamilyProfile {
  id: string;
  primaryContactName: string;
  email: string;
  phone: string | null;
}

interface ChildRecord {
  id: string;
  firstName: string;
  lastName: string | null;
  dateOfBirth: string;
  skillLevel: string | null;
}

interface RegistrationRecord {
  id: string;
  status: string;
  paymentStatus: string;
  amountCents: number | null;
  enrolledAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  childName: string;
  childAge: number | null;
  registrationToken: string | null;
  child: ChildRecord | null;
  session: {
    id: string;
    dayOfWeek: number | null;
    startTime: string;
    startDate: string;
    endDate: string | null;
    capacity: number;
    enrolledCount: number;
    programName: string;
    programDescription: string | null;
    locationName: string | null;
    locationAddress: string | null;
  };
}

interface TransferSessionOption {
  id: string;
  dayOfWeek: number | null;
  startTime: string;
  startDate: string;
  endDate: string | null;
  spotsRemaining: number;
  programName: string;
  priceCents: number;
  locationName: string | null;
}

interface TransferRecord {
  id: string;
  status: string;
  reason: string | null;
  billingAdjustmentCents: number;
  billingDirection: 'credit' | 'charge' | 'none';
  requestedAt: string;
  processedAt: string | null;
  // Destination session
  toSessionProgram: string | null;
  toSessionDay: number | null;
  toSessionTime: string | null;
  toSessionLocation: string | null;
  // Source session (full audit trail)
  fromSessionProgram: string | null;
  fromSessionDay: number | null;
  fromSessionTime: string | null;
  fromSessionLocation: string | null;
}

interface MakeupToken {
  id: string;
  skillLevel: string | null;
  expiresAt: string;
  issuedAt: string;
  makeupFeeCents: number;
  childFirstName: string;
  childLastName: string | null;
  sourceProgramName: string | null;
  expiryUrgency: 'urgent' | 'warning' | 'ok';
}

interface TokenSummary {
  activeCount: number;
  usedCount: number;
  expiredCount: number;
  activeTokens: MakeupToken[];
}

interface WaitlistRecord {
  id: string;
  position: number | null;
  status: string;
  createdAt: string;
  notifiedAt: string | null;
  declinedAt: string | null;
  childFirstName: string;
  childLastName: string | null;
  session: {
    id: string;
    dayOfWeek: number | null;
    startTime: string;
    startDate: string;
    programName: string;
    locationName: string | null;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(time24: string): string {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed': return 'bg-emerald-100 text-emerald-700';
    case 'pending_registration':
    case 'awaiting_payment': return 'bg-amber-100 text-amber-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
    case 'completed': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'confirmed': return 'Enrolled';
    case 'pending_registration': return 'Pending';
    case 'awaiting_payment': return 'Payment Pending';
    case 'cancelled': return 'Cancelled';
    case 'completed': return 'Completed';
    default: return status;
  }
}

function isUpcoming(session: RegistrationRecord['session']): boolean {
  if (!session.endDate) return true;
  return new Date(session.endDate + 'T23:59:59') >= new Date();
}

// ─────────────────────────────────────────────────────────────────────────────
// Email Lookup Gate
// ─────────────────────────────────────────────────────────────────────────────

interface EmailGateProps {
  onFound: (family: FamilyProfile) => void;
  /** If set, navigate here after successful login instead of staying on /portal */
  returnTo?: string | null;
}

const LOCKOUT_KEY = 'portal_lookup_lockout';
const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;

function getStoredLockout(): { attempts: number; lockedUntil: number | null } {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return { attempts: 0, lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

function setStoredLockout(attempts: number, lockedUntil: number | null) {
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ attempts, lockedUntil }));
}

function clearStoredLockout() {
  localStorage.removeItem(LOCKOUT_KEY);
}

function EmailGate({ onFound, returnTo }: EmailGateProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Attempt tracking — initialise from localStorage so lockout survives refresh
  const stored = getStoredLockout();
  const [failedAttempts, setFailedAttempts] = useState(stored.attempts);
  const [lockedUntil, setLockedUntil] = useState<number | null>(() => {
    if (stored.lockedUntil && stored.lockedUntil > Date.now()) return stored.lockedUntil;
    if (stored.lockedUntil) clearStoredLockout(); // expired — clear
    return null;
  });
  const [, forceUpdate] = useState(0);

  // Countdown ticker — re-render every second while locked
  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      if (Date.now() >= lockedUntil) {
        setLockedUntil(null);
        setFailedAttempts(0);
        clearStoredLockout();
        setError(null);
      } else {
        forceUpdate((n) => n + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const secondsLeft = isLocked ? Math.ceil((lockedUntil! - Date.now()) / 1000) : 0;
  const minutesLeft = Math.floor(secondsLeft / 60);
  const secsLeft = secondsLeft % 60;
  const countdownLabel = minutesLeft > 0
    ? `${minutesLeft}m ${secsLeft}s`
    : `${secsLeft}s`;

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || isLocked) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('families')
        .select('id, primary_contact_name, email, phone')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
          setLockedUntil(until);
          setStoredLockout(newAttempts, until);
          setError(
            `Too many failed attempts. Access is temporarily locked for ${LOCKOUT_MINUTES} minutes. ` +
            `If you registered under a different email address, try that instead.`
          );
        } else {
          setStoredLockout(newAttempts, null);
          const remaining = MAX_ATTEMPTS - newAttempts;
          setError(
            newAttempts === MAX_ATTEMPTS - 1
              ? `No account found with that email. Double-check your spelling — 1 attempt remaining before a temporary lockout.`
              : `No account found with that email. Make sure you use the address you registered with (${remaining} attempt${remaining !== 1 ? 's' : ''} left).`
          );
        }
        return;
      }

      // Success — clear lockout state
      clearStoredLockout();
      setFailedAttempts(0);

      const profile: FamilyProfile = {
        id: data.id,
        primaryContactName: data.primary_contact_name,
        email: data.email,
        phone: data.phone,
      };
      onFound(profile);

      // After login, navigate to returnTo URL if provided (e.g., from a deep link)
      if (returnTo) {
        try {
          const decoded = decodeURIComponent(returnTo);
          if (decoded.startsWith('/') && !decoded.startsWith('//')) {
            navigate(decoded, { replace: true });
          }
        } catch {
          // Invalid returnTo — stay on /portal
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Family lookup error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4 shadow-lg">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Family Portal</h1>
          <p className="text-slate-500 mt-1 text-sm">View your registrations and account details</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {isLocked ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium">Access temporarily locked</p>
                  <p className="mt-0.5 text-amber-700">
                    Too many failed attempts. Try again in{' '}
                    <span className="font-semibold tabular-nums">{countdownLabel}</span>.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">
                If you haven't registered yet,{' '}
                <a href="/" className="text-indigo-600 underline">start a new registration</a>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors min-h-[48px]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    View My Account
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Enter the email you used during registration
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Registration Card
// ─────────────────────────────────────────────────────────────────────────────

interface RegistrationCardProps {
  reg: RegistrationRecord;
  familyId: string;
  familyEmail: string;
  onTransferRequest?: (reg: RegistrationRecord) => void;
}

function RegistrationCard({ reg, familyId, familyEmail, onTransferRequest }: RegistrationCardProps) {
  const upcoming = isUpcoming(reg.session);
  const childDisplayName = reg.child
    ? `${reg.child.firstName}${reg.child.lastName ? ' ' + reg.child.lastName : ''}`
    : reg.childName || 'Child';
  const isAwaitingPayment = reg.status === 'awaiting_payment' || reg.paymentStatus === 'unpaid';
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  async function handleSendPaymentLink() {
    setSendingLink(true);
    setLinkError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/send-payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
          Apikey: anonKey,
        },
        body: JSON.stringify({ registrationId: reg.id, familyEmail }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setLinkError(data.reason ?? 'Please wait before requesting another link.');
      } else if (data.success) {
        setLinkSent(true);
      } else if (data.error) {
        setLinkError(data.message ?? 'Could not send link. Try again.');
      } else {
        setLinkSent(true);
      }
    } catch {
      setLinkError('Network error. Please try again.');
    } finally {
      setSendingLink(false);
    }
  }

  // Suppress unused variable warning — familyId will be used when transfer API integration expands
  void familyId;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${upcoming ? 'border-indigo-100' : 'border-slate-200'}`}>
      {/* Top accent bar */}
      {upcoming && reg.status === 'confirmed' && (
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-emerald-500" />
      )}
      {isAwaitingPayment && (
        <div className="h-1 bg-amber-400" />
      )}

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-900 text-sm">{reg.session.programName}</p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Baby className="w-3.5 h-3.5" />
              {childDisplayName}
              {reg.childAge ? `, age ${reg.childAge}` : ''}
            </p>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(reg.status)}`}>
            {getStatusLabel(reg.status)}
          </span>
        </div>

        {/* Session details */}
        <div className="space-y-1.5">
          {reg.session.dayOfWeek !== null && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{DAY_NAMES_FULL[reg.session.dayOfWeek]}s · Starting {formatDate(reg.session.startDate)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{formatTime(reg.session.startTime)}</span>
          </div>
          {reg.session.locationName && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{reg.session.locationName}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Enrolled {reg.enrolledAt ? formatDate(reg.enrolledAt) : formatDate(reg.createdAt)}
          </span>
          {reg.amountCents !== null && (
            <span className="text-sm font-semibold text-slate-700">
              {formatCurrency(reg.amountCents)}
            </span>
          )}
        </div>

        {/* Awaiting payment CTA */}
        {isAwaitingPayment && (
          <div className="mt-3 pt-3 border-t border-amber-100 space-y-2">
            {reg.registrationToken ? (
              <a
                href={`/register?token=${reg.registrationToken}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors min-h-[44px]"
              >
                <CreditCard className="w-4 h-4" />
                Complete Your Payment
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <a
                href={`/?session=${reg.session.id}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors min-h-[44px]"
              >
                <CreditCard className="w-4 h-4" />
                Complete Registration
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            )}
            {linkSent ? (
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 py-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Payment link sent to {familyEmail}
              </div>
            ) : (
              <button
                onClick={handleSendPaymentLink}
                disabled={sendingLink}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-xl transition-colors min-h-[40px] disabled:opacity-60"
              >
                {sendingLink ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Resend payment link to email
              </button>
            )}
            {linkError && (
              <p className="text-xs text-red-500 text-center">{linkError}</p>
            )}
          </div>
        )}

        {/* Transfer button for confirmed upcoming registrations */}
        {reg.status === 'confirmed' && upcoming && onTransferRequest && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => onTransferRequest(reg)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors min-h-[40px]"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Request Class Transfer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact Info Editor
// ─────────────────────────────────────────────────────────────────────────────

interface ContactEditorProps {
  family: FamilyProfile;
  onUpdated: (updated: FamilyProfile) => void;
}

function ContactEditor({ family, onUpdated }: ContactEditorProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(family.primaryContactName);
  const [phone, setPhone] = useState(family.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const { error } = await supabase
        .from('families')
        .update({ primary_contact_name: name.trim(), phone: phone.trim() || null })
        .eq('id', family.id);

      if (error) throw error;

      onUpdated({ ...family, primaryContactName: name.trim(), phone: phone.trim() || null });
      setEditing(false);
    } catch {
      setSaveError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setName(family.primaryContactName);
    setPhone(family.phone ?? '');
    setSaveError(null);
    setEditing(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-500" />
          Contact Information
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium py-1.5 px-2.5 rounded-lg hover:bg-indigo-50 transition-colors min-h-[36px]"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <span>{family.primaryContactName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>{family.email}</span>
          </div>
          {family.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{family.phone}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 000-0000"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span>Email cannot be changed here. Contact support if needed.</span>
          </div>
          {saveError && (
            <p className="text-xs text-red-600">{saveError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition-colors min-h-[40px]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors min-h-[40px]"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Waitlist Panel
// ─────────────────────────────────────────────────────────────────────────────

interface WaitlistPanelProps {
  familyId: string;
}

function WaitlistPanel({ familyId }: WaitlistPanelProps) {
  const [entries, setEntries] = useState<WaitlistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: dbErr } = await supabase
          .from('waitlist')
          .select(`
            id,
            position,
            status,
            created_at,
            notified_at,
            declined_at,
            children (
              first_name,
              last_name
            ),
            sessions!inner (
              id,
              day_of_week,
              start_time,
              start_date,
              programs!inner (
                name
              ),
              locations (
                name
              )
            )
          `)
          .eq('family_id', familyId)
          .in('status', ['pending', 'notified', 'declined'])
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (dbErr) throw dbErr;

        const mapped: WaitlistRecord[] = (data ?? []).map((row) => {
          const child = row.children as unknown as { first_name: string; last_name: string | null } | null;
          const sess = row.sessions as unknown as {
            id: string;
            day_of_week: number | null;
            start_time: string;
            start_date: string;
            programs: { name: string };
            locations: { name: string } | null;
          };
          return {
            id: row.id,
            position: row.position,
            status: row.status,
            createdAt: row.created_at,
            notifiedAt: row.notified_at,
            declinedAt: (row as unknown as { declined_at: string | null }).declined_at,
            childFirstName: child?.first_name ?? 'Child',
            childLastName: child?.last_name ?? null,
            session: {
              id: sess.id,
              dayOfWeek: sess.day_of_week,
              startTime: sess.start_time,
              startDate: sess.start_date,
              programName: sess.programs.name,
              locationName: sess.locations?.name ?? null,
            },
          };
        });

        setEntries(mapped);
      } catch {
        if (!cancelled) setError('Failed to load waitlist entries.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [familyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading waitlist…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const activeEntries = entries.filter((e) => e.status !== 'declined');
  const declinedEntries = entries.filter((e) => e.status === 'declined');

  if (activeEntries.length === 0 && declinedEntries.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <ListOrdered className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium text-slate-600">No active waitlist entries</p>
        <p className="text-xs text-slate-400 mt-1">
          When a class is full, you can join the waitlist and we'll notify you when a spot opens.
        </p>
      </div>
    );
  }

  function WaitlistEntryCard({ entry }: { entry: WaitlistRecord }) {
    const dayName = entry.session.dayOfWeek !== null ? DAY_NAMES_FULL[entry.session.dayOfWeek] : '';
    const time = formatTime(entry.session.startTime);
    const isNotified = entry.status === 'notified';
    const isDeclined = entry.status === 'declined';

    return (
      <div
        className={`bg-white rounded-xl border p-4 ${
          isDeclined
            ? 'border-slate-200 bg-slate-50 opacity-70'
            : isNotified
              ? 'border-amber-300 bg-amber-50'
              : 'border-slate-200'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isDeclined ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
                  <XCircle className="w-3 h-3" />
                  Spot Declined
                </span>
              ) : isNotified ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
                  <BellRing className="w-3 h-3" />
                  Spot Available
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
                  <ListOrdered className="w-3 h-3" />
                  {entry.position !== null ? `#${entry.position} in line` : 'Waitlisted'}
                </span>
              )}
            </div>
            <p className={`font-semibold text-sm truncate ${isDeclined ? 'text-slate-500' : 'text-slate-900'}`}>
              {entry.session.programName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {entry.childFirstName}{entry.childLastName ? ` ${entry.childLastName}` : ''}
              {' · '}{dayName} at {time}
            </p>
            {entry.session.locationName && (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {entry.session.locationName}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-slate-400">Added</p>
            <p className="text-xs font-medium text-slate-600">
              {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        {isNotified && entry.notifiedAt && (
          <div className="mt-3 pt-3 border-t border-amber-200 space-y-2">
            <p className="text-xs text-amber-700">
              A spot opened up on{' '}
              {new Date(entry.notifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
              {' '}Act quickly — spots are held for a limited time.
            </p>
            <a
              href={`/?session=${entry.session.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-2 rounded-lg transition-colors min-h-[36px]"
            >
              <BellRing className="w-3.5 h-3.5" />
              Claim Your Spot
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
        {isDeclined && entry.declinedAt && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Spot declined on{' '}
              {new Date(entry.declinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeEntries.length > 0 && (
        <div className="space-y-3">
          {activeEntries.map((entry) => (
            <WaitlistEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {activeEntries.length === 0 && (
        <div className="text-center py-6 text-slate-400">
          <ListOrdered className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium text-slate-600">No active waitlist entries</p>
          <p className="text-xs text-slate-400 mt-1">
            We'll notify you when a spot opens up.
          </p>
        </div>
      )}

      {declinedEntries.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-0.5">
            Declined
          </p>
          <div className="space-y-3">
            {declinedEntries.map((entry) => (
              <WaitlistEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Makeup Tokens Panel
// ─────────────────────────────────────────────────────────────────────────────

interface MakeupTokensPanelProps {
  familyId: string;
}

function MakeupTokensPanel({ familyId }: MakeupTokensPanelProps) {
  const [summary, setSummary] = useState<TokenSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingToken, setBookingToken] = useState<MakeupToken | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_family_tokens', {
        p_family_id: familyId,
      });
      if (rpcErr) throw rpcErr;

      const tokens: MakeupToken[] = ((data?.active_tokens as unknown[]) ?? []).map((t: unknown) => {
        const tok = t as Record<string, unknown>;
        return {
          id: tok.id as string,
          skillLevel: (tok.skill_level as string | null) ?? null,
          expiresAt: tok.expires_at as string,
          issuedAt: tok.issued_at as string,
          makeupFeeCents: (tok.makeup_fee_cents as number) ?? 0,
          childFirstName: tok.child_first_name as string,
          childLastName: (tok.child_last_name as string | null) ?? null,
          sourceProgramName: (tok.source_program_name as string | null) ?? null,
          expiryUrgency: (tok.expiry_urgency as 'urgent' | 'warning' | 'ok') ?? 'ok',
        };
      });

      setSummary({
        activeCount: (data?.active_count as number) ?? 0,
        usedCount: (data?.used_count as number) ?? 0,
        expiredCount: (data?.expired_count as number) ?? 0,
        activeTokens: tokens,
      });
    } catch {
      setError('Failed to load makeup tokens.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [familyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading tokens…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!summary || summary.activeCount === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium text-slate-600">No makeup tokens</p>
        <p className="text-xs text-slate-400 mt-1">
          When you cancel a class in advance, you'll receive a makeup token here.
        </p>
        {(summary?.usedCount ?? 0) > 0 || (summary?.expiredCount ?? 0) > 0 ? (
          <p className="text-xs text-slate-400 mt-3">
            {summary!.usedCount > 0 && `${summary!.usedCount} used`}
            {summary!.usedCount > 0 && summary!.expiredCount > 0 && ' · '}
            {summary!.expiredCount > 0 && `${summary!.expiredCount} expired`}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-indigo-600">{summary.activeCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Available</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{summary.usedCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Used</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-slate-400">{summary.expiredCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Expired</p>
        </div>
      </div>

      {/* How tokens work info card */}
      <div className="flex gap-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
        <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-700">
          Use a makeup token to book an open spot in an equivalent class.
          Tokens are locked to the same program level and expire after 12 months.
        </p>
      </div>

      {/* Active token list */}
      <div className="space-y-3">
        {summary.activeTokens.map(tok => {
          const childName = tok.childLastName
            ? `${tok.childFirstName} ${tok.childLastName}`
            : tok.childFirstName;
          const expiresDate = new Date(tok.expiresAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          });
          const daysLeft = Math.max(
            0,
            Math.ceil((new Date(tok.expiresAt).getTime() - Date.now()) / 86_400_000)
          );

          return (
            <div
              key={tok.id}
              className={`bg-white rounded-xl border p-4 ${
                tok.expiryUrgency === 'urgent'
                  ? 'border-red-200 bg-red-50/40'
                  : tok.expiryUrgency === 'warning'
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{childName}</p>
                    {tok.sourceProgramName && (
                      <p className="text-xs text-slate-500">{tok.sourceProgramName}</p>
                    )}
                  </div>
                </div>
                {tok.makeupFeeCents > 0 && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    ${(tok.makeupFeeCents / 100).toFixed(0)} fee
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {tok.skillLevel && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-indigo-400" />
                    Level: {tok.skillLevel}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Timer className={`w-3.5 h-3.5 ${
                    tok.expiryUrgency === 'urgent' ? 'text-red-400' :
                    tok.expiryUrgency === 'warning' ? 'text-amber-400' : 'text-slate-400'
                  }`} />
                  <span className={
                    tok.expiryUrgency === 'urgent' ? 'text-red-600 font-medium' :
                    tok.expiryUrgency === 'warning' ? 'text-amber-600' : ''
                  }>
                    {daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`} ({expiresDate})
                  </span>
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setBookingToken(tok)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 min-h-[44px] px-1"
                >
                  Book Makeup Class
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Makeup Booking Modal */}
      {bookingToken && (
        <MakeupBookingModal
          token={bookingToken}
          familyId={familyId}
          onClose={() => setBookingToken(null)}
          onBooked={() => {
            setBookingToken(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Makeup Booking Modal
// ─────────────────────────────────────────────────────────────────────────────

interface MakeupSessionOption {
  id: string;
  dayOfWeek: number | null;
  startTime: string;
  startDate: string;
  endDate: string | null;
  spotsRemaining: number;
  programName: string;
  priceCents: number;
  durationWeeks: number | null;
  requiredSkillLevel: string | null;
  locationName: string | null;
  locationAddress: string | null;
}

interface MakeupBookingModalProps {
  token: MakeupToken;
  familyId: string;
  onClose: () => void;
  onBooked: () => void;
}

function MakeupBookingModal({ token, familyId, onClose, onBooked }: MakeupBookingModalProps) {
  const [sessions, setSessions] = useState<MakeupSessionOption[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  // Load eligible sessions for this token
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingSessions(true);
      setSessionsError(null);
      try {
        const { data, error: rpcErr } = await supabase.rpc('get_makeup_sessions_for_token', {
          p_token_id:  token.id,
          p_family_id: familyId,
        });
        if (cancelled) return;
        if (rpcErr) throw rpcErr;
        if (data?.error) {
          setSessionsError(data.message ?? 'Failed to load available sessions.');
          return;
        }
        const rawSessions: MakeupSessionOption[] = ((data?.sessions as unknown[]) ?? []).map((s: unknown) => {
          const row = s as Record<string, unknown>;
          return {
            id:                row.id as string,
            dayOfWeek:         row.day_of_week as number | null,
            startTime:         row.start_time as string,
            startDate:         row.start_date as string,
            endDate:           row.end_date as string | null,
            spotsRemaining:    row.spots_remaining as number,
            programName:       row.program_name as string,
            priceCents:        row.price_cents as number,
            durationWeeks:     row.duration_weeks as number | null,
            requiredSkillLevel: row.required_skill_level as string | null,
            locationName:      row.location_name as string | null,
            locationAddress:   row.location_address as string | null,
          };
        });
        setSessions(rawSessions);
      } catch {
        if (!cancelled) setSessionsError('Failed to load available sessions.');
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [token.id, familyId]);

  // Lookup the child for this token (we need childId to book)
  const [childId, setChildId] = useState<string | null>(null);
  useEffect(() => {
    async function getChild() {
      const { data } = await supabase
        .from('makeup_tokens')
        .select('child_id')
        .eq('id', token.id)
        .single();
      if (data?.child_id) setChildId(data.child_id as string);
    }
    void getChild();
  }, [token.id]);

  async function handleBook() {
    if (!selectedSessionId || !childId) return;

    setBooking(true);
    setBookError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/redeem-makeup-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
          Apikey: anonKey,
        },
        body: JSON.stringify({
          tokenId:   token.id,
          familyId,
          childId,
          sessionId: selectedSessionId,
        }),
      });

      const data: { success?: boolean; error?: boolean; message?: string; registrationId?: string } = await res.json();

      if (data.error) {
        setBookError(data.message ?? 'Booking failed. Please try again.');
        return;
      }

      setBooked(true);
      setTimeout(() => onBooked(), 2000);
    } catch {
      setBookError('Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  }

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function formatTime(t: string): string {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${m} ${ampm}`;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Book Makeup Class</p>
              {token.skillLevel && (
                <p className="text-xs text-slate-500">Level: {token.skillLevel}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {booked ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-slate-900">Makeup class booked!</p>
              <p className="text-sm text-slate-500 mt-1">Your registration has been confirmed.</p>
            </div>
          ) : loadingSessions ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading available classes…</span>
            </div>
          ) : sessionsError ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600">{sessionsError}</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">No available classes right now</p>
              <p className="text-xs text-slate-400 mt-1">
                Check back soon — new spots open as schedules update.
                {token.skillLevel && ` Only classes at level "${token.skillLevel}" are eligible.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-3">
                Select an available class to redeem your makeup token
                {token.makeupFeeCents > 0 && ` (${(token.makeupFeeCents / 100).toFixed(0)} fee applies)`}.
              </p>
              {sessions.map(s => {
                const isSelected = selectedSessionId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all min-h-[44px] ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{s.programName}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500">
                          {s.dayOfWeek !== null && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {DAY_NAMES[s.dayOfWeek]}s {formatTime(s.startTime)}
                            </span>
                          )}
                          {s.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {s.locationName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {s.spotsRemaining} spot{s.spotsRemaining !== 1 ? 's' : ''} left
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {bookError && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {bookError}
            </div>
          )}
        </div>

        {/* Footer */}
        {!booked && !loadingSessions && sessions.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0">
            <button
              onClick={handleBook}
              disabled={!selectedSessionId || booking}
              className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              {booking ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Booking…</>
              ) : token.makeupFeeCents > 0 ? (
                `Book — $${(token.makeupFeeCents / 100).toFixed(0)} fee`
              ) : (
                'Book for Free'
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Children Panel
// ─────────────────────────────────────────────────────────────────────────────

interface ChildProfile {
  id: string;
  firstName: string;
  lastName: string | null;
  dateOfBirth: string;
  skillLevel: string | null;
}

interface ChildrenPanelProps {
  familyId: string;
  familyEmail: string;
}

function ChildCard({
  child,
  familyId,
  familyEmail,
  onUpdated,
}: {
  child: ChildProfile;
  familyId: string;
  familyEmail: string;
  onUpdated: (updated: ChildProfile) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(child.firstName);
  const [lastName, setLastName] = useState(child.lastName ?? '');
  const [skillLevel, setSkillLevel] = useState(child.skillLevel ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const ageYears = (() => {
    if (!child.dateOfBirth) return null;
    const dob = new Date(child.dateOfBirth + 'T00:00:00');
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  })();

  async function handleSave() {
    if (!firstName.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { data, error } = await supabase.functions.invoke('portal-children', {
        body: {
          action: 'update',
          familyId,
          email: familyEmail,
          childId: child.id,
          firstName: firstName.trim(),
          lastName: lastName.trim() || null,
          skillLevel: skillLevel.trim() || null,
        },
      });
      if (error) throw error;
      if (!data?.data) throw new Error('No data returned');
      onUpdated({
        ...child,
        firstName: data.data.first_name,
        lastName: data.data.last_name,
        skillLevel: data.data.skill_level,
      });
      setEditing(false);
    } catch {
      setSaveError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setFirstName(child.firstName);
    setLastName(child.lastName ?? '');
    setSkillLevel(child.skillLevel ?? '');
    setSaveError(null);
    setEditing(false);
  }

  const displayName = child.lastName
    ? `${child.firstName} ${child.lastName}`
    : child.firstName;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
      {!editing ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Baby className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{displayName}</p>
                {ageYears !== null && (
                  <p className="text-xs text-slate-500">Age {ageYears}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium py-1.5 px-2.5 rounded-lg hover:bg-indigo-50 transition-colors min-h-[36px]"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              <Calendar className="w-3 h-3" />
              {new Date(child.dateOfBirth + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </span>
            {child.skillLevel && (
              <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                <Star className="w-3 h-3" />
                {child.skillLevel}
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Edit Child Profile</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Skill level <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              placeholder="e.g., Beginner, Level 2, Goldfish"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-400 mt-1">Used by your organization to match you with the right class</p>
          </div>
          {saveError && <p className="text-xs text-red-600">{saveError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !firstName.trim()}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition-colors min-h-[40px]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors min-h-[40px]"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddChildForm({
  familyId,
  familyEmail,
  onAdded,
  onCancel,
}: {
  familyId: string;
  familyEmail: string;
  onAdded: (child: ChildProfile) => void;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleAdd() {
    if (!firstName.trim() || !dateOfBirth) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { data, error } = await supabase.functions.invoke('portal-children', {
        body: {
          action: 'add',
          familyId,
          email: familyEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim() || null,
          dateOfBirth,
          skillLevel: skillLevel.trim() || null,
        },
      });
      if (error) throw error;
      if (!data?.data) throw new Error('No data returned');
      onAdded({
        id: data.data.id,
        firstName: data.data.first_name,
        lastName: data.data.last_name,
        dateOfBirth: data.data.date_of_birth,
        skillLevel: data.data.skill_level,
      });
    } catch {
      setSaveError('Could not add child. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
      <p className="text-sm font-semibold text-indigo-800">Add a Child</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">First name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Last name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Optional"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Date of birth <span className="text-red-500">*</span></label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Skill level <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value)}
          placeholder="e.g., Beginner, Level 2"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
      {saveError && <p className="text-xs text-red-600">{saveError}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={saving || !firstName.trim() || !dateOfBirth}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition-colors min-h-[40px]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Add Child
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors min-h-[40px]"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}

function ChildrenPanel({ familyId, familyEmail }: ChildrenPanelProps) {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: result, error: fnErr } = await supabase.functions.invoke('portal-children', {
          body: { action: 'list', familyId, email: familyEmail },
        });

        if (cancelled) return;
        if (fnErr) throw fnErr;

        setChildren(
          (result?.data ?? []).map((c: { id: string; first_name: string; last_name: string | null; date_of_birth: string; skill_level: string | null }) => ({
            id: c.id,
            firstName: c.first_name,
            lastName: c.last_name,
            dateOfBirth: c.date_of_birth,
            skillLevel: c.skill_level,
          }))
        );
      } catch {
        if (!cancelled) setError('Could not load children profiles.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [familyId, familyEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading profiles…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {children.map((child) => (
        <ChildCard
          key={child.id}
          child={child}
          familyId={familyId}
          familyEmail={familyEmail}
          onUpdated={(updated) =>
            setChildren((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
          }
        />
      ))}

      {children.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-slate-400">
          <Baby className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-slate-600">No children on file</p>
          <p className="text-xs text-slate-400 mt-1">Add a child to manage their profile and skill level</p>
        </div>
      )}

      {showAddForm ? (
        <AddChildForm
          familyId={familyId}
          familyEmail={familyEmail}
          onAdded={(child) => {
            setChildren((prev) => [...prev, child]);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-2xl text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[48px]"
        >
          <User className="w-4 h-4" />
          {children.length === 0 ? 'Add a child' : 'Add another child'}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Transfer Request Modal
// ─────────────────────────────────────────────────────────────────────────────

interface TransferRequestModalProps {
  registration: RegistrationRecord;
  onClose: () => void;
  onSubmitted: () => void;
}

const TRANSFER_REASONS = [
  'Schedule conflict',
  'Skill progression / level change',
  'Location preference',
  'Coach preference',
  'Family schedule change',
  'Other',
];

function TransferRequestModal({ registration, onClose, onSubmitted }: TransferRequestModalProps) {
  const [sessions, setSessions] = useState<TransferSessionOption[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TransferSessionOption | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadSessions() {
      setLoadingSessions(true);
      try {
        const { data, error: rpcErr } = await supabase.rpc('get_available_transfer_sessions', {
          p_registration_id: registration.id,
        });
        if (rpcErr) throw rpcErr;
        const mapped: TransferSessionOption[] = (data ?? []).map((s: {
          id: string;
          day_of_week: number | null;
          start_time: string;
          start_date: string;
          end_date: string | null;
          spots_remaining: number;
          program_name: string;
          price_cents: number;
          location_name: string | null;
        }) => ({
          id: s.id,
          dayOfWeek: s.day_of_week,
          startTime: s.start_time,
          startDate: s.start_date,
          endDate: s.end_date,
          spotsRemaining: s.spots_remaining,
          programName: s.program_name,
          priceCents: s.price_cents,
          locationName: s.location_name,
        }));
        setSessions(mapped);
      } catch {
        setError('Could not load available sessions. Please try again.');
      } finally {
        setLoadingSessions(false);
      }
    }
    loadSessions();
  }, [registration.id]);

  async function handleSubmit() {
    if (!selectedSession) {
      setError('Please select a class to transfer to.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('request_class_transfer', {
        p_registration_id: registration.id,
        p_to_session_id: selectedSession.id,
        p_reason: reason || null,
      });
      if (rpcErr) throw rpcErr;
      if (data?.error) {
        setError(data.message ?? 'Transfer request failed. Please try again.');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Transfer request failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Billing adjustment for the selected session
  const currentPrice = registration.amountCents ?? 0;
  const selectedPrice = selectedSession?.priceCents ?? 0;
  const adjustment = selectedPrice - currentPrice;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl z-10">
          <div className="flex items-center gap-2.5">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Request Class Transfer</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Transfer Request Submitted</p>
                <p className="text-sm text-slate-500 mt-1">
                  We'll review your request and reach out within 1-2 business days.
                </p>
              </div>
              {adjustment !== 0 && (
                <div className={`text-sm px-4 py-3 rounded-xl ${adjustment > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                  {adjustment > 0
                    ? `A charge of ${formatCurrency(adjustment)} may apply for the price difference.`
                    : `A credit of ${formatCurrency(Math.abs(adjustment))} will be applied.`}
                </div>
              )}
              <button
                onClick={onSubmitted}
                className="inline-flex items-center gap-2 py-2.5 px-6 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors min-h-[44px]"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Current class info */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Currently enrolled in</p>
                <p className="text-sm font-semibold text-slate-900">{registration.session.programName}</p>
                <p className="text-xs text-slate-500">
                  {registration.session.dayOfWeek !== null ? `${DAY_NAMES_FULL[registration.session.dayOfWeek]}s` : ''}
                  {' · '}{formatTime(registration.session.startTime)}
                  {registration.session.locationName ? ` · ${registration.session.locationName}` : ''}
                </p>
              </div>

              {/* Available sessions */}
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-2.5">Choose a new class</p>
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No other classes are currently available for transfer.</p>
                    <p className="text-xs mt-1">Check back soon or contact us directly.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                    {sessions.map((s) => {
                      const priceChange = s.priceCents - currentPrice;
                      const selected = selectedSession?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSession(s)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            selected
                              ? 'border-indigo-400 bg-indigo-50'
                              : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{s.programName}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {s.dayOfWeek !== null ? `${DAY_NAMES[s.dayOfWeek]}s` : ''}
                                {' · '}{formatTime(s.startTime)}
                                {s.locationName ? ` · ${s.locationName}` : ''}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-emerald-600 font-medium">{s.spotsRemaining} spots</p>
                              {priceChange !== 0 && (
                                <p className={`text-xs font-medium mt-0.5 ${priceChange > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  {priceChange > 0 ? `+${formatCurrency(priceChange)}` : `-${formatCurrency(Math.abs(priceChange))}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Billing adjustment notice */}
              {selectedSession && adjustment !== 0 && (
                <div className={`flex items-start gap-2 text-sm px-3 py-2.5 rounded-xl ${adjustment > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {adjustment > 0
                      ? `This class costs ${formatCurrency(adjustment)} more. Our team will contact you about the balance.`
                      : `This class costs ${formatCurrency(Math.abs(adjustment))} less. A credit will be applied to your account.`}
                  </span>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for transfer <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a reason…</option>
                  {TRANSFER_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedSession || loadingSessions}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-sm rounded-xl transition-colors min-h-[48px]"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4" />
                    Submit Transfer Request
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Transfer History Panel
// ─────────────────────────────────────────────────────────────────────────────

function TransferHistoryPanel({ familyId }: { familyId: string }) {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('class_transfers')
          .select(`
            id,
            status,
            reason,
            billing_adjustment_cents,
            billing_direction,
            requested_at,
            processed_at,
            to_session:sessions!to_session_id (
              day_of_week,
              start_time,
              programs ( name ),
              locations ( name )
            ),
            from_session:sessions!from_session_id (
              day_of_week,
              start_time,
              programs ( name ),
              locations ( name )
            )
          `)
          .eq('family_id', familyId)
          .order('requested_at', { ascending: false }) as { data: {
            id: string;
            status: string;
            reason: string | null;
            billing_adjustment_cents: number;
            billing_direction: 'credit' | 'charge' | 'none';
            requested_at: string;
            processed_at: string | null;
            to_session: { day_of_week: number | null; start_time: string; programs: { name: string } | null; locations: { name: string } | null } | null;
            from_session: { day_of_week: number | null; start_time: string; programs: { name: string } | null; locations: { name: string } | null } | null;
          }[] | null };

        if (cancelled) return;

        const mapped: TransferRecord[] = (data ?? []).map((t) => ({
          id: t.id,
          status: t.status,
          reason: t.reason,
          billingAdjustmentCents: t.billing_adjustment_cents,
          billingDirection: t.billing_direction,
          requestedAt: t.requested_at,
          processedAt: t.processed_at,
          toSessionProgram: t.to_session?.programs?.name ?? null,
          toSessionDay: t.to_session?.day_of_week ?? null,
          toSessionTime: t.to_session?.start_time ?? null,
          toSessionLocation: t.to_session?.locations?.name ?? null,
          fromSessionProgram: t.from_session?.programs?.name ?? null,
          fromSessionDay: t.from_session?.day_of_week ?? null,
          fromSessionTime: t.from_session?.start_time ?? null,
          fromSessionLocation: t.from_session?.locations?.name ?? null,
        }));

        setTransfers(mapped);
      } catch {
        // Silently fail — transfers are supplementary info
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [familyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">No transfer requests yet</p>
        <p className="text-xs mt-1">Use "Request Class Transfer" on any active enrollment</p>
      </div>
    );
  }

  function getTransferStatusColor(status: string) {
    switch (status) {
      case 'approved': case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  function getTransferStatusLabel(status: string) {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  return (
    <div className="space-y-3">
      {transfers.map((t) => (
        <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* From → To audit trail */}
              {t.fromSessionProgram ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {t.fromSessionProgram}
                    {t.fromSessionDay !== null && t.fromSessionTime
                      ? ` · ${DAY_NAMES_FULL[t.fromSessionDay]}s ${formatTime(t.fromSessionTime)}`
                      : ''}
                  </span>
                  <ArrowRightLeft className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                    {t.toSessionProgram ?? '—'}
                    {t.toSessionDay !== null && t.toSessionTime
                      ? ` · ${DAY_NAMES_FULL[t.toSessionDay]}s ${formatTime(t.toSessionTime)}`
                      : ''}
                  </span>
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-900">
                  {t.toSessionProgram ?? 'Transfer Request'}
                </p>
              )}
              {!t.fromSessionProgram && t.toSessionDay !== null && t.toSessionTime && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {DAY_NAMES_FULL[t.toSessionDay]}s · {formatTime(t.toSessionTime)}
                  {t.toSessionLocation ? ` · ${t.toSessionLocation}` : ''}
                </p>
              )}
            </div>
            <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${getTransferStatusColor(t.status)}`}>
              {getTransferStatusLabel(t.status)}
            </span>
          </div>

          {t.reason && (
            <p className="text-xs text-slate-500">Reason: {t.reason}</p>
          )}

          {t.billingDirection !== 'none' && t.billingAdjustmentCents > 0 && (
            <div className={`text-xs px-2.5 py-1.5 rounded-lg ${t.billingDirection === 'charge' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {t.billingDirection === 'charge'
                ? `Pending charge: ${formatCurrency(t.billingAdjustmentCents)}`
                : `Credit to apply: ${formatCurrency(t.billingAdjustmentCents)}`}
            </div>
          )}

          <p className="text-xs text-slate-400">
            Requested {formatDate(t.requestedAt)}
            {t.processedAt ? ` · Processed ${formatDate(t.processedAt)}` : ''}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Portal Dashboard
// ─────────────────────────────────────────────────────────────────────────────

interface PortalDashboardProps {
  family: FamilyProfile;
  onSignOut: () => void;
}

function PortalDashboard({ family, onSignOut }: PortalDashboardProps) {
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [familyProfile, setFamilyProfile] = useState(family);
  const [tab, setTab] = useState<'upcoming' | 'history' | 'waitlist' | 'tokens' | 'children' | 'transfers'>('upcoming');
  const [transferTarget, setTransferTarget] = useState<RegistrationRecord | null>(null);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const response = await fetch(`${supabaseUrl}/functions/v1/portal-registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'Apikey': anonKey,
        },
        body: JSON.stringify({ familyId: family.id, email: family.email }),
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      const data = json.data ?? [];

      type RawRegistrationRow = {
        id: string;
        status: string;
        payment_status: string;
        amount_cents: number | null;
        enrolled_at: string | null;
        confirmed_at: string | null;
        created_at: string;
        child_name: string | null;
        child_age: number | null;
        registration_token: string | null;
        sessions: unknown;
        children: unknown;
      };

      const mapped: RegistrationRecord[] = (data as RawRegistrationRow[]).map((r) => {
        const sess = r.sessions as unknown as {
          id: string;
          day_of_week: number | null;
          start_time: string;
          start_date: string;
          end_date: string | null;
          capacity: number;
          enrolled_count: number;
          programs: { name: string; description: string | null };
          locations: { name: string; address: string | null } | null;
        };
        const child = r.children as unknown as {
          id: string;
          first_name: string;
          last_name: string | null;
          date_of_birth: string;
          skill_level: string | null;
        } | null;

        return {
          id: r.id,
          status: r.status,
          paymentStatus: r.payment_status,
          amountCents: r.amount_cents,
          enrolledAt: r.enrolled_at,
          confirmedAt: r.confirmed_at,
          createdAt: r.created_at,
          childName: r.child_name ?? '',
          childAge: r.child_age,
          registrationToken: r.registration_token ?? null,
          child: child
            ? {
                id: child.id,
                firstName: child.first_name,
                lastName: child.last_name,
                dateOfBirth: child.date_of_birth,
                skillLevel: child.skill_level,
              }
            : null,
          session: {
            id: sess.id,
            dayOfWeek: sess.day_of_week,
            startTime: sess.start_time,
            startDate: sess.start_date,
            endDate: sess.end_date,
            capacity: sess.capacity,
            enrolledCount: sess.enrolled_count,
            programName: sess.programs.name,
            programDescription: sess.programs.description,
            locationName: sess.locations?.name ?? null,
            locationAddress: sess.locations?.address ?? null,
          },
        };
      });

      setRegistrations(mapped);
    } catch (err) {
      setError('Could not load your registrations. Please refresh.');
      console.error('Portal load error:', err);
    } finally {
      setLoading(false);
    }
  }, [family.id, family.email]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const upcoming = registrations.filter(
    (r) =>
      (r.status === 'confirmed' || r.status === 'awaiting_payment') && isUpcoming(r.session)
  );
  const history = registrations.filter(
    (r) =>
      !(r.status === 'confirmed' || r.status === 'awaiting_payment') || !isUpcoming(r.session)
  );

  const totalPaid = registrations
    .filter((r) => r.paymentStatus === 'paid')
    .reduce((sum, r) => sum + (r.amountCents ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Family Portal</h1>
            <p className="text-sm text-slate-500">{familyProfile.primaryContactName}</p>
          </div>
          <button
            onClick={onSignOut}
            className="text-sm text-slate-500 hover:text-slate-700 py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors min-h-[40px]"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{upcoming.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Active</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <p className="text-2xl font-bold text-slate-700">{registrations.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <p className="text-lg font-bold text-emerald-600">{totalPaid > 0 ? `$${(totalPaid / 100).toFixed(0)}` : '—'}</p>
            <p className="text-xs text-slate-500 mt-0.5">Paid</p>
          </div>
        </div>

        {/* Contact info */}
        <ContactEditor family={familyProfile} onUpdated={setFamilyProfile} />

        {/* Registrations */}
        <div>
          {/* Tab bar — 2-row layout */}
          <div className="space-y-1 mb-4">
            <div className="flex gap-1 bg-slate-200 rounded-xl p-1">
              <button
                onClick={() => setTab('upcoming')}
                className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors min-h-[40px] ${
                  tab === 'upcoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Current ({upcoming.length})
              </button>
              <button
                onClick={() => setTab('history')}
                className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors min-h-[40px] ${
                  tab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                History ({history.length})
              </button>
              <button
                onClick={() => setTab('waitlist')}
                className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-lg transition-colors min-h-[40px] ${
                  tab === 'waitlist' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <ListOrdered className="w-3 h-3" />
                Waitlist
              </button>
            </div>
            <div className="flex gap-1 bg-slate-200 rounded-xl p-1">
              <button
                onClick={() => setTab('tokens')}
                className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-lg transition-colors min-h-[40px] ${
                  tab === 'tokens' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Ticket className="w-3 h-3" />
                Tokens
              </button>
              <button
                onClick={() => setTab('children')}
                className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-lg transition-colors min-h-[40px] ${
                  tab === 'children' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Baby className="w-3 h-3" />
                Children
              </button>
              <button
                onClick={() => setTab('transfers')}
                className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-lg transition-colors min-h-[40px] ${
                  tab === 'transfers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                Transfers
              </button>
            </div>
          </div>

          {tab === 'waitlist' ? (
            <WaitlistPanel familyId={family.id} />
          ) : tab === 'tokens' ? (
            <MakeupTokensPanel familyId={family.id} />
          ) : tab === 'children' ? (
            <ChildrenPanel familyId={family.id} familyEmail={family.email} />
          ) : tab === 'transfers' ? (
            <TransferHistoryPanel familyId={family.id} />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Loading registrations…</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 space-y-3">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={loadRegistrations}
                className="flex items-center gap-2 mx-auto text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2 px-3 rounded-lg hover:bg-indigo-50 transition-colors min-h-[40px]"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tab === 'upcoming' && (
                upcoming.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Star className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No active enrollments</p>
                    <p className="text-xs mt-1">Register a child to get started</p>
                  </div>
                ) : (
                  upcoming.map((reg) => (
                    <RegistrationCard
                      key={reg.id}
                      reg={reg}
                      familyId={family.id}
                      familyEmail={family.email}
                      onTransferRequest={setTransferTarget}
                    />
                  ))
                )
              )}
              {tab === 'history' && (
                history.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No registration history yet</p>
                  </div>
                ) : (
                  history.map((reg) => (
                    <RegistrationCard
                      key={reg.id}
                      reg={reg}
                      familyId={family.id}
                      familyEmail={family.email}
                    />
                  ))
                )
              )}
            </div>
          )}
        </div>

        {/* Register CTA */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white">
          <p className="font-semibold text-sm">Ready to register again?</p>
          <p className="text-xs text-indigo-100 mt-0.5 mb-3">
            Chat with Kai to find the perfect class for your child.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 bg-white text-indigo-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors min-h-[40px]"
          >
            Start registration
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Transfer Request Modal */}
      {transferTarget && (
        <TransferRequestModal
          registration={transferTarget}
          onClose={() => setTransferTarget(null)}
          onSubmitted={() => {
            setTransferTarget(null);
            setTab('transfers');
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

export function ParentPortal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [family, setFamily] = useState<FamilyProfile | null>(null);

  // Support pre-filling email from URL (e.g., from confirmation email link)
  const emailParam = searchParams.get('email');
  // returnTo: after successful email lookup, navigate here instead of staying on /portal
  const returnTo = searchParams.get('returnTo');

  // Auto-lookup if email is in URL and we can find the family
  useEffect(() => {
    if (!emailParam || family) return;
    (async () => {
      const { data } = await supabase
        .from('families')
        .select('id, primary_contact_name, email, phone')
        .eq('email', emailParam.toLowerCase())
        .maybeSingle();

      if (data) {
        setFamily({
          id: data.id,
          primaryContactName: data.primary_contact_name,
          email: data.email,
          phone: data.phone,
        });
      }
    })();
  }, [emailParam, family]);

  if (!family) {
    return <EmailGate onFound={setFamily} returnTo={returnTo} />;
  }

  return (
    <PortalDashboard
      family={family}
      onSignOut={() => {
        setFamily(null);
        navigate('/portal');
      }}
    />
  );
}
