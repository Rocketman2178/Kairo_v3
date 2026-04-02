import { useState, useEffect, useCallback } from 'react';
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
  childFirstName: string;
  childLastName: string | null;
  session: {
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
}

function EmailGate({ onFound }: EmailGateProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
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
        setError('No account found with that email. Complete a registration first.');
        return;
      }

      onFound({
        id: data.id,
        primaryContactName: data.primary_contact_name,
        email: data.email,
        phone: data.phone,
      });
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

function RegistrationCard({ reg }: { reg: RegistrationRecord }) {
  const upcoming = isUpcoming(reg.session);
  const childDisplayName = reg.child
    ? `${reg.child.firstName}${reg.child.lastName ? ' ' + reg.child.lastName : ''}`
    : reg.childName || 'Child';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${upcoming ? 'border-indigo-100' : 'border-slate-200'}`}>
      {/* Top accent bar */}
      {upcoming && reg.status === 'confirmed' && (
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-emerald-500" />
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
            children (
              first_name,
              last_name
            ),
            sessions!inner (
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
          .in('status', ['pending', 'notified'])
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (dbErr) throw dbErr;

        const mapped: WaitlistRecord[] = (data ?? []).map((row) => {
          const child = row.children as unknown as { first_name: string; last_name: string | null } | null;
          const sess = row.sessions as unknown as {
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
            childFirstName: child?.first_name ?? 'Child',
            childLastName: child?.last_name ?? null,
            session: {
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

  if (entries.length === 0) {
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

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const dayName = entry.session.dayOfWeek !== null ? DAY_NAMES_FULL[entry.session.dayOfWeek] : '';
        const time = formatTime(entry.session.startTime);
        const isNotified = entry.status === 'notified';

        return (
          <div
            key={entry.id}
            className={`bg-white rounded-xl border p-4 ${isNotified ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isNotified ? (
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
                <p className="font-semibold text-slate-900 text-sm truncate">
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
              <div className="mt-3 pt-3 border-t border-amber-200">
                <p className="text-xs text-amber-700">
                  A spot opened up on{' '}
                  {new Date(entry.notifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
                  {' '}Contact the organization to confirm your enrollment.
                </p>
              </div>
            )}
          </div>
        );
      })}
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: rpcErr } = await supabase.rpc('get_family_tokens', {
          p_family_id: familyId,
        });
        if (cancelled) return;
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
        if (!cancelled) setError('Failed to load makeup tokens.');
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
                <a
                  href="/sessions"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 min-h-[36px]"
                >
                  Browse available makeup slots
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
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
  const [tab, setTab] = useState<'upcoming' | 'history' | 'waitlist' | 'tokens'>('upcoming');

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('registrations')
        .select(`
          id,
          status,
          payment_status,
          amount_cents,
          enrolled_at,
          confirmed_at,
          created_at,
          child_name,
          child_age,
          children (
            id,
            first_name,
            last_name,
            date_of_birth,
            skill_level
          ),
          sessions!inner (
            id,
            day_of_week,
            start_time,
            start_date,
            end_date,
            capacity,
            enrolled_count,
            programs!inner (
              name,
              description
            ),
            locations (
              name,
              address
            )
          )
        `)
        .eq('family_id', family.id)
        .neq('status', 'pending_registration')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      const mapped: RegistrationRecord[] = (data ?? []).map((r) => {
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
  }, [family.id]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const upcoming = registrations.filter(
    (r) => r.status === 'confirmed' && isUpcoming(r.session)
  );
  const history = registrations.filter(
    (r) => r.status !== 'confirmed' || !isUpcoming(r.session)
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
          {/* Tab bar */}
          <div className="flex gap-1 bg-slate-200 rounded-xl p-1 mb-4">
            <button
              onClick={() => setTab('upcoming')}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors min-h-[40px] ${
                tab === 'upcoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Current ({upcoming.length})
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors min-h-[40px] ${
                tab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              History ({history.length})
            </button>
            <button
              onClick={() => setTab('waitlist')}
              className={`flex-1 flex items-center justify-center gap-1 text-sm font-medium py-2 rounded-lg transition-colors min-h-[40px] ${
                tab === 'waitlist' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              Waitlist
            </button>
            <button
              onClick={() => setTab('tokens')}
              className={`flex-1 flex items-center justify-center gap-1 text-sm font-medium py-2 rounded-lg transition-colors min-h-[40px] ${
                tab === 'tokens' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              Tokens
            </button>
          </div>

          {tab === 'waitlist' ? (
            <WaitlistPanel familyId={family.id} />
          ) : tab === 'tokens' ? (
            <MakeupTokensPanel familyId={family.id} />
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
                  upcoming.map((reg) => <RegistrationCard key={reg.id} reg={reg} />)
                )
              )}
              {tab === 'history' && (
                history.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No registration history yet</p>
                  </div>
                ) : (
                  history.map((reg) => <RegistrationCard key={reg.id} reg={reg} />)
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
    return <EmailGate onFound={setFamily} />;
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
