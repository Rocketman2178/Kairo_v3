import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  Users,
  Star,
  Share2,
  ChevronDown,
  X,
  Loader2,
  Zap,
  CheckCheck,
  ArrowLeft,
  LayoutGrid,
  EyeOff,
  Bell,
  CheckCircle2,
  Hash,
  ExternalLink,
  ListOrdered,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionRow {
  id: string;
  day_of_week: number;
  start_time: string;
  start_date: string;
  end_date: string | null;
  capacity: number;
  enrolled_count: number;
  status: string;
  is_hidden: boolean;
  external_registration_url: string | null;
  required_skill_level: string | null;
  programs: {
    id: string;
    name: string;
    description: string | null;
    price_cents: number;
    age_range: string | null;
    duration_weeks: number | null;
    organization_id: string;
  } | null;
  locations: {
    id: string;
    name: string;
    address: string | null;
    zip_code: string | null;
  } | null;
}

interface FilterState {
  query: string;
  day: string;
  ageMin: string;
  ageMax: string;
  zip: string;
  location: string;
  program: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORG_ID = '00000000-0000-0000-0000-000000000001';

// Half-year precision age options (1, 1.5, 2, 2.5, … 18)
const AGE_OPTIONS: { value: string; label: string }[] = [];
for (let age = 1; age <= 18; age += 0.5) {
  const label = age % 1 === 0
    ? `${age} yr${age !== 1 ? 's' : ''}`
    : `${Math.floor(age)} yrs 6 mo`;
  AGE_OPTIONS.push({ value: String(age), label });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(time24: string): string {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function parseAgeRange(ageRange: string | null): { min: number; max: number } | null {
  if (!ageRange) return null;
  const match = ageRange.match(/\[(\d+),(\d+)\)/);
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) - 1 };
  return null;
}

function formatAgeLabel(ageRange: string | null): string | null {
  const parsed = parseAgeRange(ageRange);
  if (!parsed) return null;
  return `Ages ${parsed.min}–${parsed.max}`;
}

function spotsColor(enrolled: number, capacity: number): string {
  const pct = (enrolled / capacity) * 100;
  if (pct >= 90) return 'text-red-400 bg-red-950/30 border-red-800/50';
  if (pct >= 70) return 'text-orange-400 bg-orange-950/30 border-orange-800/50';
  return 'text-green-400 bg-green-950/30 border-green-800/50';
}

/** Compute total class meetings from duration_weeks or start/end date + day_of_week */
function computeClassCount(session: SessionRow): number | null {
  // Prefer duration_weeks from the program
  if (session.programs?.duration_weeks) {
    return session.programs.duration_weeks;
  }
  // Fall back to counting occurrences of day_of_week between start_date and end_date
  if (session.start_date && session.end_date && session.day_of_week !== null) {
    const start = new Date(session.start_date);
    const end = new Date(session.end_date);
    let count = 0;
    const cursor = new Date(start);
    // Advance to the first occurrence of the target day of week
    while (cursor.getUTCDay() !== session.day_of_week) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    while (cursor <= end) {
      count++;
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
    return count > 0 ? count : null;
  }
  return null;
}

/**
 * Determine zip proximity label.
 * Returns 'exact' for matching zip, 'nearby' for same first-3-digit prefix,
 * or null for no match.
 */
function zipProximityLabel(sessionZip: string | null | undefined, filterZip: string): 'exact' | 'nearby' | null {
  if (!sessionZip || !filterZip) return null;
  const sZip = sessionZip.replace(/\s/g, '').toUpperCase();
  const fZip = filterZip.replace(/\s/g, '').toUpperCase();
  if (sZip === fZip) return 'exact';
  // Same first 3 chars = same metro area (works for US 5-digit and CA postal codes)
  if (sZip.slice(0, 3) === fZip.slice(0, 3)) return 'nearby';
  return null;
}

// ─── NotifyMeModal ────────────────────────────────────────────────────────────

interface NotifyMeModalProps {
  session: SessionRow;
  onClose: () => void;
}

function NotifyMeModal({ session, onClose }: NotifyMeModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Focus email input on open
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const prog = session.programs;
  const loc = session.locations;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { error: dbErr } = await supabase
        .from('session_interest')
        .insert({
          session_id: session.id,
          organization_id: prog?.organization_id ?? ORG_ID,
          email: trimmedEmail,
          name: name.trim() || null,
          notify_on: 'spot_opens',
        });
      // Unique constraint violation (23505) means they already registered interest — treat as success
      if (dbErr && dbErr.code !== '23505') {
        throw dbErr;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notify-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-[#1a2332] border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#6366f1]" />
            <h2 id="notify-modal-title" className="text-base font-semibold text-white">
              Notify Me
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {submitted ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">You're on the list!</h3>
              <p className="text-sm text-gray-400 mb-5">
                We'll email you at <span className="text-white font-medium">{email.trim().toLowerCase()}</span> as
                soon as a spot opens up.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#06b6d4] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Class info */}
              <div className="bg-[#0f1419] rounded-xl p-3 mb-4">
                <p className="text-sm font-semibold text-white mb-0.5">
                  {prog?.name ?? 'This class'}
                </p>
                <p className="text-xs text-gray-400">
                  {DAY_NAMES[session.day_of_week]}s at {formatTime(session.start_time)}
                  {loc ? ` · ${loc.name}` : ''}
                </p>
                <p className="text-xs text-red-400 mt-1 font-medium">Class is currently full</p>
              </div>

              <p className="text-sm text-gray-300 mb-4">
                Enter your email and we'll notify you the moment a spot opens up.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="notify-name" className="block text-xs text-gray-500 mb-1">
                    First Name <span className="text-gray-600">(optional)</span>
                  </label>
                  <input
                    id="notify-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Sarah"
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]/60 focus:ring-1 focus:ring-[#6366f1]/30"
                  />
                </div>
                <div>
                  <label htmlFor="notify-email" className="block text-xs text-gray-500 mb-1">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="notify-email"
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]/60 focus:ring-1 focus:ring-[#6366f1]/30"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#06b6d4] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  ) : (
                    <><Bell className="w-4 h-4" /> Notify Me When a Spot Opens</>
                  )}
                </button>

                <p className="text-center text-xs text-gray-600">
                  You can also <button type="button" onClick={onClose} className="text-[#06b6d4] hover:underline">join the waitlist</button> to secure your position.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── WaitlistJoinModal ────────────────────────────────────────────────────────

interface WaitlistJoinModalProps {
  session: SessionRow;
  onClose: () => void;
}

function WaitlistJoinModal({ session, onClose }: WaitlistJoinModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const prog = session.programs;
  const loc = session.locations;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => { emailRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        'add_to_waitlist_with_position',
        {
          p_session_id:    session.id,
          p_contact_email: trimmedEmail,
          p_contact_name:  name.trim() || null,
        }
      );

      if (rpcErr) throw rpcErr;

      const result = rpcData as {
        success: boolean;
        waitlistId?: string;
        position?: number;
        error?: string;
        message?: string;
      };

      if (!result.success) {
        if (result.error === 'already_waitlisted') {
          setError('This email is already on the waitlist for this class.');
        } else {
          setError(result.message || 'Failed to join waitlist. Please try again.');
        }
        return;
      }

      setPosition(result.position ?? null);
      setSubmitted(true);

      // Fire waitlist confirmation email in background — non-blocking
      if (result.waitlistId) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
        fetch(`${supabaseUrl}/functions/v1/trigger-waitlist-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
            Apikey: anonKey,
          },
          body: JSON.stringify({ waitlistId: result.waitlistId }),
        }).catch(() => { /* Non-critical — confirmation email send fails silently */ });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-[#1a2332] border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-amber-400" />
            <h2 id="waitlist-modal-title" className="text-base font-semibold text-white">
              Join Waitlist
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {submitted ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">You're on the waitlist!</h3>
              {position != null && (
                <p className="text-sm text-amber-300 font-medium mb-1">
                  You're #{position} in line
                </p>
              )}
              <p className="text-sm text-gray-400 mb-2">
                We'll email <span className="text-white font-medium">{email.trim().toLowerCase()}</span> when a spot opens.
              </p>
              <p className="text-xs text-gray-500 mb-5">
                A confirmation email is on its way with your waitlist details and next steps.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Class info */}
              <div className="bg-[#0f1419] rounded-xl p-3 mb-4">
                <p className="text-sm font-semibold text-white mb-0.5">
                  {prog?.name ?? 'This class'}
                </p>
                <p className="text-xs text-gray-400">
                  {DAY_NAMES[session.day_of_week]}s at {formatTime(session.start_time)}
                  {loc ? ` · ${loc.name}` : ''}
                </p>
                <p className="text-xs text-red-400 mt-1 font-medium">Class is currently full</p>
              </div>

              <p className="text-sm text-gray-300 mb-4">
                Join the waitlist to secure your position. You'll receive a{' '}
                <span className="text-amber-300 font-medium">Waitlist Confirmation</span> email
                with your queue number and clear next steps.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="waitlist-name" className="block text-xs text-gray-500 mb-1">
                    Child's First Name <span className="text-gray-600">(optional)</span>
                  </label>
                  <input
                    id="waitlist-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Emma"
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label htmlFor="waitlist-email" className="block text-xs text-gray-500 mb-1">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="waitlist-email"
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
                  ) : (
                    <><ListOrdered className="w-4 h-4" /> Join Waitlist</>
                  )}
                </button>

                <p className="text-center text-xs text-gray-600">
                  We'll notify you immediately when a spot opens — no spam.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SessionBrowseCard ────────────────────────────────────────────────────────

interface SessionBrowseCardProps {
  session: SessionRow;
  onCopyLink: (sessionId: string) => void;
  copiedId: string | null;
  filterZip: string;
  onNotifyMe: (session: SessionRow) => void;
  onJoinWaitlist: (session: SessionRow) => void;
}

function SessionBrowseCard({ session, onCopyLink, copiedId, filterZip, onNotifyMe, onJoinWaitlist }: SessionBrowseCardProps) {
  const navigate = useNavigate();
  const prog = session.programs;
  const loc = session.locations;
  const spotsRemaining = Math.max(0, session.capacity - session.enrolled_count);
  const fillRate = (session.enrolled_count / session.capacity) * 100;
  const isFull = session.status === 'full' || spotsRemaining <= 0;
  const isFillingFast = !isFull && fillRate >= 75;

  const fillBarColor =
    fillRate >= 90 ? 'bg-red-500' :
    fillRate >= 75 ? 'bg-orange-500' :
    fillRate >= 50 ? 'bg-yellow-500' : 'bg-green-500';

  const ageLabel = formatAgeLabel(prog?.age_range ?? null);
  const classCount = computeClassCount(session);
  const proximity = filterZip ? zipProximityLabel(loc?.zip_code, filterZip) : null;

  const isExternal = Boolean(session.external_registration_url);

  function handleRegister() {
    if (isExternal) {
      window.open(session.external_registration_url!, '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/?session=${session.id}`);
    }
  }

  return (
    <div className="bg-[#1a2332] border border-gray-800 rounded-xl p-4 hover:border-[#6366f1]/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-white leading-tight">
              {prog?.name ?? 'Untitled Program'}
            </h3>
            {ageLabel && (
              <span className="px-2 py-0.5 bg-[#0f1419] text-[#06b6d4] text-xs rounded-full border border-[#06b6d4]/30 whitespace-nowrap">
                {ageLabel}
              </span>
            )}
            {session.required_skill_level && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-950/40 text-violet-300 text-xs rounded-full border border-violet-700/40 whitespace-nowrap">
                <GraduationCap className="w-3 h-3" />
                {session.required_skill_level}
              </span>
            )}
            {session.is_hidden && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full border border-gray-700 whitespace-nowrap">
                <EyeOff className="w-3 h-3" />
                Private
              </span>
            )}
            {isFillingFast && !isFull && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-semibold animate-pulse">
                <Zap className="w-3 h-3" />
                Filling Fast
              </span>
            )}
            {isFull && (
              <span className="px-2 py-0.5 bg-red-950/40 text-red-400 text-xs rounded-full border border-red-800/50">
                Full
              </span>
            )}
            {proximity === 'exact' && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-950/40 text-green-400 text-xs rounded-full border border-green-800/50 whitespace-nowrap">
                <MapPin className="w-3 h-3" />
                In your area
              </span>
            )}
            {proximity === 'nearby' && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-950/40 text-blue-400 text-xs rounded-full border border-blue-800/50 whitespace-nowrap">
                <MapPin className="w-3 h-3" />
                Nearby
              </span>
            )}
          </div>
          {prog?.description && (
            <p className="text-xs text-gray-400 line-clamp-2">{prog.description}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold bg-gradient-to-r from-[#6366f1] to-[#06b6d4] bg-clip-text text-transparent">
            {prog ? formatPrice(prog.price_cents) : '—'}
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            {classCount !== null && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Hash className="w-3 h-3" />
                {classCount} classes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Calendar className="w-4 h-4 text-[#6366f1] flex-shrink-0" />
          <span>{DAY_NAMES[session.day_of_week]}s at {formatTime(session.start_time)}</span>
        </div>
        {loc && (
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <MapPin className="w-4 h-4 text-[#06b6d4] flex-shrink-0 mt-0.5" />
            <span className="break-words">
              {loc.name}
              {loc.address && (
                <span className="text-gray-500 ml-1 text-xs">· {loc.address}</span>
              )}
              {loc.zip_code && !loc.address?.includes(loc.zip_code) && (
                <span className="text-gray-600 ml-1 text-xs">{loc.zip_code}</span>
              )}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Clock className="w-4 h-4 text-[#8b5cf6] flex-shrink-0" />
          <span>
            Starts {new Date(session.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Fill rate bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Enrolled</span>
          <span>{session.enrolled_count}/{session.capacity}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${fillBarColor}`}
            style={{ width: `${Math.min(fillRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-800">
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${spotsColor(session.enrolled_count, session.capacity)}`}>
          <Users className="w-3.5 h-3.5" />
          {isFull ? 'Class Full' : `${spotsRemaining} spot${spotsRemaining !== 1 ? 's' : ''} left`}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCopyLink(session.id)}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:text-[#06b6d4] transition-colors rounded-lg hover:bg-gray-800"
            title="Copy share link"
          >
            {copiedId === session.id ? (
              <><CheckCheck className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
            ) : (
              <><Share2 className="w-3.5 h-3.5" /><span>Share</span></>
            )}
          </button>
          {isFull ? (
            <div className="flex items-center gap-1.5">
              {!isExternal && (
                <button
                  onClick={() => onNotifyMe(session)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#a5b4fc] hover:bg-[#6366f1]/30 transition-colors"
                  title="Notify me when a spot opens"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Notify Me
                </button>
              )}
              {!isExternal ? (
                <button
                  onClick={() => onJoinWaitlist(session)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white hover:opacity-90 transition-opacity"
                  title="Join the waitlist and receive a confirmation email"
                >
                  <ListOrdered className="w-3 h-3" />
                  Waitlist
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-3 h-3" /> Register Externally
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleRegister}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#6366f1] to-[#06b6d4] text-white hover:opacity-90 transition-opacity"
            >
              {isExternal ? (
                <><ExternalLink className="w-3 h-3" /> Register Externally</>
              ) : 'Register Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sessions Page ─────────────────────────────────────────────────────────────

export function Sessions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notifySession, setNotifySession] = useState<SessionRow | null>(null);
  const [waitlistSession, setWaitlistSession] = useState<SessionRow | null>(null);
  const [orgEnrollmentType, setOrgEnrollmentType] = useState<'term_based' | 'perpetual' | 'hybrid'>('term_based');

  // Fetch org enrollment type (lightweight, non-blocking)
  useEffect(() => {
    supabase
      .from('organizations')
      .select('enrollment_type')
      .eq('id', ORG_ID)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.enrollment_type) {
          setOrgEnrollmentType(data.enrollment_type as 'term_based' | 'perpetual' | 'hybrid');
        }
      });
  }, []);

  // Derive filter state from URL params
  const filters: FilterState = {
    query: searchParams.get('query') ?? '',
    day: searchParams.get('day') ?? '',
    ageMin: searchParams.get('ageMin') ?? '',
    ageMax: searchParams.get('ageMax') ?? '',
    zip: searchParams.get('zip') ?? '',
    location: searchParams.get('location') ?? '',
    program: searchParams.get('program') ?? '',
  };

  function setFilter(key: keyof FilterState, value: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }

  function clearAllFilters() {
    setSearchParams({}, { replace: true });
  }

  const activeFilterCount = [filters.query, filters.day, filters.ageMin, filters.ageMax, filters.zip, filters.location, filters.program]
    .filter(Boolean).length;

  // Load sessions from Supabase
  useEffect(() => {
    let cancelled = false;

    async function fetchSessions() {
      setLoading(true);
      setError(null);
      try {
        const directSessionId = new URLSearchParams(window.location.search).get('session');

        const baseQuery = supabase
          .from('sessions')
          .select(`
            id,
            day_of_week,
            start_time,
            start_date,
            end_date,
            capacity,
            enrolled_count,
            status,
            is_hidden,
            external_registration_url,
            required_skill_level,
            programs!inner (
              id,
              name,
              description,
              price_cents,
              age_range,
              duration_weeks,
              organization_id
            ),
            locations (
              id,
              name,
              address,
              zip_code
            )
          `)
          .in('status', ['active', 'full'])
          .eq('programs.organization_id', ORG_ID)
          .order('day_of_week')
          .order('start_time');

        const { data, error: err } = await baseQuery.eq('is_hidden', false);

        // Fetch the directly-linked hidden session if provided
        let extraSession: SessionRow | null = null;
        if (directSessionId) {
          const { data: directData } = await supabase
            .from('sessions')
            .select(`
              id,
              day_of_week,
              start_time,
              start_date,
              end_date,
              capacity,
              enrolled_count,
              status,
              is_hidden,
              required_skill_level,
              programs!inner (
                id,
                name,
                description,
                price_cents,
                age_range,
                duration_weeks,
                organization_id
              ),
              locations (
                id,
                name,
                address,
                zip_code
              )
            `)
            .eq('id', directSessionId)
            .eq('programs.organization_id', ORG_ID)
            .in('status', ['active', 'full'])
            .maybeSingle();

          if (directData) {
            const alreadyIncluded = (data ?? []).some((s: SessionRow) => s.id === directSessionId);
            if (!alreadyIncluded) {
              extraSession = directData as unknown as SessionRow;
            }
          }
        }

        if (cancelled) return;
        if (err) throw err;
        const allSessions = [...((data as unknown as SessionRow[]) ?? [])];
        if (extraSession) allSessions.push(extraSession);
        setSessions(allSessions);
      } catch {
        if (!cancelled) setError('Failed to load sessions. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchSessions();

    // Re-fetch enrollment counts when the user returns to this tab/page
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        cancelled = false;
        void fetchSessions();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Client-side filtering + zip-proximity sorting
  const filtered = useMemo(() => {
    const results = sessions.filter(s => {
      const prog = s.programs;
      const loc = s.locations;

      // Keyword search
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const searchable = [
          prog?.name ?? '',
          prog?.description ?? '',
          loc?.name ?? '',
          loc?.address ?? '',
          loc?.zip_code ?? '',
          DAY_NAMES[s.day_of_week],
        ].join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      // Day of week filter
      if (filters.day) {
        const dayIdx = DAY_NAMES.indexOf(filters.day);
        if (dayIdx !== -1 && s.day_of_week !== dayIdx) return false;
      }

      // Age filter — supports half-year precision (parseFloat)
      if (filters.ageMin || filters.ageMax) {
        const parsed = parseAgeRange(prog?.age_range ?? null);
        if (parsed) {
          const ageMin = filters.ageMin ? parseFloat(filters.ageMin) : null;
          const ageMax = filters.ageMax ? parseFloat(filters.ageMax) : null;
          if (ageMin !== null && parsed.max < ageMin) return false;
          if (ageMax !== null && parsed.min > ageMax) return false;
        }
      }

      // Zip filter: include sessions where location zip matches or is nearby;
      // if no location has a zip, still include (don't exclude unknown)
      if (filters.zip) {
        const locZip = s.locations?.zip_code;
        if (locZip) {
          const prox = zipProximityLabel(locZip, filters.zip);
          if (!prox) return false;
        }
        // Sessions with no zip data pass through (rather than being hidden)
      }

      // Location filter (exact match on location name)
      if (filters.location && loc?.name !== filters.location) return false;

      // Program type filter (exact match on program name)
      if (filters.program && prog?.name !== filters.program) return false;

      return true;
    });

    // If a zip filter is active, sort: exact → nearby → rest, within each day group
    if (filters.zip) {
      results.sort((a, b) => {
        const proxA = zipProximityLabel(a.locations?.zip_code, filters.zip);
        const proxB = zipProximityLabel(b.locations?.zip_code, filters.zip);
        const score = (p: 'exact' | 'nearby' | null) => (p === 'exact' ? 0 : p === 'nearby' ? 1 : 2);
        const diff = score(proxA) - score(proxB);
        if (diff !== 0) return diff;
        // Secondary: day of week then time
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        return a.start_time.localeCompare(b.start_time);
      });
    }

    return results;
  }, [sessions, filters]);

  // Group by day for display (only when not zip-sorted, to avoid reshuffling)
  const grouped = useMemo(() => {
    const map = new Map<string, SessionRow[]>();
    for (const s of filtered) {
      const dayName = DAY_NAMES[s.day_of_week];
      if (!map.has(dayName)) map.set(dayName, []);
      map.get(dayName)!.push(s);
    }
    return map;
  }, [filtered]);

  // Unique location names and program names derived from ALL loaded sessions (not filtered)
  const uniqueLocations = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const s of sessions) {
      const name = s.locations?.name;
      if (name && !seen.has(name)) { seen.add(name); names.push(name); }
    }
    return names.sort();
  }, [sessions]);

  const uniquePrograms = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const s of sessions) {
      const name = s.programs?.name;
      if (name && !seen.has(name)) { seen.add(name); names.push(name); }
    }
    return names.sort();
  }, [sessions]);

  const handleCopyLink = useCallback((sessionId: string) => {
    const url = `${window.location.origin}/sessions?session=${sessionId}`;
    void navigator.clipboard.writeText(url);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleNotifyMe = useCallback((session: SessionRow) => {
    setNotifySession(session);
  }, []);

  const handleJoinWaitlist = useCallback((session: SessionRow) => {
    setWaitlistSession(session);
  }, []);

  const handleCloseWaitlistModal = useCallback(() => setWaitlistSession(null), []);

  // Highlight a specific session from ?session= param (direct link)
  const highlightedSessionId = searchParams.get('session');

  // Detect if the zip looks like a Canadian postal code to label the field appropriately
  const zipLabel = filters.zip && /^[A-Za-z]/.test(filters.zip.trim())
    ? 'Postal Code'
    : 'Zip / Postal Code';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a2332] to-[#0f1419]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f1419]/95 border-b border-gray-800 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="h-5 w-px bg-gray-700" />
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[#6366f1]" />
                <h1 className="text-base font-semibold text-white">Browse Classes</h1>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {loading ? '' : `${filtered.length} class${filtered.length !== 1 ? 'es' : ''}`}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Search + Filter bar */}
        <div className="flex gap-2 mb-4">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search classes, locations..."
              value={filters.query}
              onChange={e => setFilter('query', e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#1a2332] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1]/60 focus:ring-1 focus:ring-[#6366f1]/30"
            />
            {filters.query && (
              <button
                onClick={() => setFilter('query', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-[#6366f1]/20 border-[#6366f1]/50 text-[#a5b4fc]'
                : 'bg-[#1a2332] border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 flex items-center justify-center bg-[#6366f1] text-white text-xs rounded-full font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="bg-[#1a2332] border border-gray-700 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Filter Classes</span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[#06b6d4] hover:text-[#22d3ee] transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Location */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Location</label>
                <div className="relative">
                  <select
                    value={filters.location}
                    onChange={e => setFilter('location', e.target.value)}
                    className="w-full appearance-none bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]/60"
                  >
                    <option value="">Any location</option>
                    {uniqueLocations.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Sport / Program */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sport / Program</label>
                <div className="relative">
                  <select
                    value={filters.program}
                    onChange={e => setFilter('program', e.target.value)}
                    className="w-full appearance-none bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]/60"
                  >
                    <option value="">Any program</option>
                    {uniquePrograms.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Zip / Postal Code */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Zip / Postal Code</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. 92618"
                    value={filters.zip}
                    onChange={e => setFilter('zip', e.target.value)}
                    maxLength={10}
                    className="w-full pl-8 bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]/60"
                  />
                  {filters.zip && (
                    <button
                      onClick={() => setFilter('zip', '')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {filters.zip && (
                  <p className="text-xs text-gray-600 mt-1">
                    Showing classes near <span className="text-gray-400">{filters.zip}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Day of week */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Day of Week</label>
                <div className="relative">
                  <select
                    value={filters.day}
                    onChange={e => setFilter('day', e.target.value)}
                    className="w-full appearance-none bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]/60"
                  >
                    <option value="">Any day</option>
                    {DAY_NAMES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Min age — half-year precision */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Age</label>
                <div className="relative">
                  <select
                    value={filters.ageMin}
                    onChange={e => setFilter('ageMin', e.target.value)}
                    className="w-full appearance-none bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]/60"
                  >
                    <option value="">Any</option>
                    {AGE_OPTIONS.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Max age — half-year precision */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Age</label>
                <div className="relative">
                  <select
                    value={filters.ageMax}
                    onChange={e => setFilter('ageMax', e.target.value)}
                    className="w-full appearance-none bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]/60"
                  >
                    <option value="">Any</option>
                    {AGE_OPTIONS.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Quick day pills */}
            <div className="flex flex-wrap gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                <button
                  key={d}
                  onClick={() => setFilter('day', filters.day === d ? '' : d)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    filters.day === d
                      ? 'bg-[#6366f1] border-[#6366f1] text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
            <p className="text-gray-400 text-sm">Loading classes…</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-xs text-[#06b6d4] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-2">No classes match your filters</p>
            {filters.zip && (
              <p className="text-xs text-gray-600 mb-3">
                No classes found near <span className="text-gray-400">{filters.zip}</span>. Try a nearby zip code or clear the location filter.
              </p>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#06b6d4] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Perpetual / hybrid enrollment banner */}
            {orgEnrollmentType !== 'term_based' && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-violet-950/40 border border-violet-800/50 rounded-xl text-xs text-violet-300">
                <RefreshCw className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                <span>
                  {orgEnrollmentType === 'perpetual'
                    ? <><span className="text-white font-semibold">Ongoing enrollment</span> — enroll once and your child stays in class automatically each month. No seasonal re-registration required.</>
                    : <><span className="text-white font-semibold">Flexible enrollment</span> — this organization offers both term-based and ongoing enrollment options.</>
                  }
                </span>
              </div>
            )}

            {/* Zip proximity banner */}
            {filters.zip && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#1a2332] border border-gray-700 rounded-xl text-xs text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-[#06b6d4] flex-shrink-0" />
                <span>
                  Showing classes near <span className="text-white font-medium">{zipLabel === 'Postal Code' ? filters.zip.toUpperCase() : filters.zip}</span> · sorted by proximity
                </span>
                <button onClick={() => setFilter('zip', '')} className="ml-auto text-gray-600 hover:text-gray-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {[...grouped.entries()].map(([day, daySessions]) => (
              <section key={day}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-[#6366f1]" />
                  <h2 className="text-sm font-semibold text-gray-300">{day}s</h2>
                  <span className="text-xs text-gray-600">· {daySessions.length} class{daySessions.length !== 1 ? 'es' : ''}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {daySessions.map(s => (
                    <div
                      key={s.id}
                      id={`session-${s.id}`}
                      className={`transition-all duration-500 ${
                        highlightedSessionId === s.id
                          ? 'ring-2 ring-[#6366f1] rounded-xl'
                          : ''
                      }`}
                    >
                      <SessionBrowseCard
                        session={s}
                        onCopyLink={handleCopyLink}
                        copiedId={copiedId}
                        filterZip={filters.zip}
                        onNotifyMe={handleNotifyMe}
                        onJoinWaitlist={handleJoinWaitlist}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500 mb-3">
              Not sure which class to pick? Let Kai help you find the perfect fit.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#06b6d4] rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Star className="w-4 h-4" />
              Chat with Kai
            </Link>
          </div>
        )}
      </div>

      {/* Notify Me Modal */}
      {notifySession && (
        <NotifyMeModal
          session={notifySession}
          onClose={() => setNotifySession(null)}
        />
      )}

      {/* Waitlist Join Modal — rendered via portal to avoid stacking context issues */}
      {waitlistSession && createPortal(
        <WaitlistJoinModal
          session={waitlistSession}
          onClose={handleCloseWaitlistModal}
        />,
        document.body
      )}
    </div>
  );
}
