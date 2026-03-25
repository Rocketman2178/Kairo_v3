import { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string | null;
  start_date: string;
  end_date: string | null;
  capacity: number;
  enrolled_count: number;
  is_active: boolean;
  programs: {
    id: string;
    name: string;
    description: string | null;
    price_cents: number;
    age_range: string | null;
    duration_weeks: number | null;
  } | null;
  locations: {
    id: string;
    name: string;
    address: string | null;
  } | null;
}

interface FilterState {
  query: string;
  day: string;
  ageMin: string;
  ageMax: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

// ─── SessionBrowseCard ────────────────────────────────────────────────────────

interface SessionBrowseCardProps {
  session: SessionRow;
  onCopyLink: (sessionId: string) => void;
  copiedId: string | null;
}

function SessionBrowseCard({ session, onCopyLink, copiedId }: SessionBrowseCardProps) {
  const navigate = useNavigate();
  const prog = session.programs;
  const loc = session.locations;
  const spotsRemaining = session.capacity - session.enrolled_count;
  const fillRate = (session.enrolled_count / session.capacity) * 100;
  const isFull = spotsRemaining <= 0;
  const isFillingFast = !isFull && fillRate >= 75;

  const fillBarColor =
    fillRate >= 90 ? 'bg-red-500' :
    fillRate >= 75 ? 'bg-orange-500' :
    fillRate >= 50 ? 'bg-yellow-500' : 'bg-green-500';

  const ageLabel = formatAgeLabel(prog?.age_range ?? null);

  function handleRegister() {
    // Navigate to home chat; the pre-filled suggestion starts the conversation for this session
    navigate(`/?session=${session.id}`);
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
            {isFillingFast && (
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
          </div>
          {prog?.description && (
            <p className="text-xs text-gray-400 line-clamp-2">{prog.description}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold bg-gradient-to-r from-[#6366f1] to-[#06b6d4] bg-clip-text text-transparent">
            {prog ? formatPrice(prog.price_cents) : '—'}
          </div>
          {prog?.duration_weeks && (
            <div className="text-xs text-gray-500">{prog.duration_weeks} weeks</div>
          )}
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
            <button
              onClick={handleRegister}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white hover:opacity-90 transition-opacity"
            >
              Join Waitlist
            </button>
          ) : (
            <button
              onClick={handleRegister}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#6366f1] to-[#06b6d4] text-white hover:opacity-90 transition-opacity"
            >
              Register Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sessions Page ─────────────────────────────────────────────────────────────

const ORG_ID = '00000000-0000-0000-0000-000000000001';

export function Sessions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Derive filter state from URL params
  const filters: FilterState = {
    query: searchParams.get('q') ?? '',
    day: searchParams.get('day') ?? '',
    ageMin: searchParams.get('ageMin') ?? '',
    ageMax: searchParams.get('ageMax') ?? '',
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

  const activeFilterCount = [filters.query, filters.day, filters.ageMin, filters.ageMax]
    .filter(Boolean).length;

  // Load sessions from Supabase
  useEffect(() => {
    let cancelled = false;

    async function fetchSessions() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('sessions')
          .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            start_date,
            end_date,
            capacity,
            enrolled_count,
            is_active,
            programs (
              id,
              name,
              description,
              price_cents,
              age_range,
              duration_weeks
            ),
            locations (
              id,
              name,
              address
            )
          `)
          .eq('organization_id', ORG_ID)
          .eq('is_active', true)
          .order('day_of_week')
          .order('start_time');

        if (cancelled) return;
        if (err) throw err;
        setSessions((data as unknown as SessionRow[]) ?? []);
      } catch (e) {
        if (!cancelled) setError('Failed to load sessions. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchSessions();
    return () => { cancelled = true; };
  }, []);

  // Client-side filtering
  const filtered = useMemo(() => {
    return sessions.filter(s => {
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
          DAY_NAMES[s.day_of_week],
        ].join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      // Day of week filter
      if (filters.day) {
        const dayIdx = DAY_NAMES.indexOf(filters.day);
        if (dayIdx !== -1 && s.day_of_week !== dayIdx) return false;
      }

      // Age filter
      if (filters.ageMin || filters.ageMax) {
        const parsed = parseAgeRange(prog?.age_range ?? null);
        if (parsed) {
          const ageMin = filters.ageMin ? parseInt(filters.ageMin) : null;
          const ageMax = filters.ageMax ? parseInt(filters.ageMax) : null;
          if (ageMin !== null && parsed.max < ageMin) return false;
          if (ageMax !== null && parsed.min > ageMax) return false;
        }
      }

      return true;
    });
  }, [sessions, filters]);

  // Group by day for display
  const grouped = useMemo(() => {
    const map = new Map<string, SessionRow[]>();
    for (const s of filtered) {
      const dayName = DAY_NAMES[s.day_of_week];
      if (!map.has(dayName)) map.set(dayName, []);
      map.get(dayName)!.push(s);
    }
    return map;
  }, [filtered]);

  function handleCopyLink(sessionId: string) {
    const url = `${window.location.origin}/sessions?session=${sessionId}`;
    void navigator.clipboard.writeText(url);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Highlight a specific session from ?session= param (direct link)
  const highlightedSessionId = searchParams.get('session');

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

              {/* Min age */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Age</label>
                <input
                  type="number"
                  min="1"
                  max="18"
                  placeholder="e.g. 4"
                  value={filters.ageMin}
                  onChange={e => setFilter('ageMin', e.target.value)}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]/60"
                />
              </div>

              {/* Max age */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Age</label>
                <input
                  type="number"
                  min="1"
                  max="18"
                  placeholder="e.g. 10"
                  value={filters.ageMax}
                  onChange={e => setFilter('ageMax', e.target.value)}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]/60"
                />
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
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#06b6d4] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
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
    </div>
  );
}
