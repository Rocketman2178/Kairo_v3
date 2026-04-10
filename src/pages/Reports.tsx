import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  Search,
  Filter,
  CheckCircle,
  Clock,
  MapPin,
  User,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EnrollmentRow {
  registrationId: string;
  childName: string;
  childAge: number | null;
  parentName: string;
  parentEmail: string;
  programName: string;
  locationName: string | null;
  dayOfWeek: number | null;
  startTime: string;
  startDate: string;
  status: string;
  paymentStatus: string;
  amountCents: number | null;
  enrolledAt: string | null;
  channel: string | null;
}

interface RevenueRow {
  programName: string;
  confirmedCount: number;
  revenueCents: number;
  avgAmountCents: number;
}

interface ScheduleClass {
  sessionId: string;
  programName: string;
  locationName: string | null;
  dayOfWeek: number;
  startTime: string;
  endDate: string | null;
  coachName: string | null;
  capacity: number;
  enrolledCount: number;
  students: { name: string; age: number | null }[];
  customFields: Record<string, string>;
}

type ReportTab = 'enrollment' | 'revenue' | 'schedule';
type DateRange = '7d' | '30d' | '90d' | 'all';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function sinceDate(range: DateRange): string | null {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function getStatusBadge(status: string) {
  const map: Record<string, { color: string; label: string }> = {
    confirmed: { color: 'bg-emerald-100 text-emerald-700', label: 'Confirmed' },
    awaiting_payment: { color: 'bg-amber-100 text-amber-700', label: 'Awaiting Payment' },
    cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' },
    completed: { color: 'bg-blue-100 text-blue-700', label: 'Completed' },
  };
  return map[status] ?? { color: 'bg-gray-100 text-gray-600', label: status };
}

function exportCsv(rows: Record<string, string | number | null>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const v = row[h];
          if (v === null || v === undefined) return '';
          const s = String(v);
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(',')
    ),
  ];
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Enrollment Report
// ─────────────────────────────────────────────────────────────────────────────

function EnrollmentReport({ dateRange }: { dateRange: DateRange }) {
  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since = sinceDate(dateRange);
      let query = supabase
        .from('registrations')
        .select(`
          id,
          status,
          payment_status,
          amount_cents,
          enrolled_at,
          registration_channel,
          child_name,
          child_age,
          children (
            first_name,
            last_name
          ),
          families (
            primary_contact_name,
            email
          ),
          sessions!inner (
            day_of_week,
            start_time,
            start_date,
            programs!inner ( name ),
            locations ( name )
          )
        `)
        .neq('status', 'pending_registration')
        .order('created_at', { ascending: false })
        .limit(500);

      if (since) {
        query = query.gte('created_at', since);
      }

      const { data, error: dbErr } = await query;
      if (dbErr) throw dbErr;

      const mapped: EnrollmentRow[] = (data ?? []).map((r) => {
        const sess = r.sessions as unknown as {
          day_of_week: number | null;
          start_time: string;
          start_date: string;
          programs: { name: string };
          locations: { name: string } | null;
        };
        const child = r.children as unknown as { first_name: string; last_name: string | null } | null;
        const fam = r.families as unknown as { primary_contact_name: string; email: string } | null;
        const childName = child
          ? `${child.first_name}${child.last_name ? ' ' + child.last_name : ''}`
          : r.child_name ?? '';

        return {
          registrationId: r.id,
          childName,
          childAge: r.child_age,
          parentName: fam?.primary_contact_name ?? '',
          parentEmail: fam?.email ?? '',
          programName: sess.programs.name,
          locationName: sess.locations?.name ?? null,
          dayOfWeek: sess.day_of_week,
          startTime: sess.start_time,
          startDate: sess.start_date,
          status: r.status,
          paymentStatus: r.payment_status,
          amountCents: r.amount_cents,
          enrolledAt: r.enrolled_at,
          channel: r.registration_channel,
        };
      });

      setRows(mapped);
    } catch (err) {
      setError('Failed to load enrollment data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => {
    const matchSearch = !search || [r.childName, r.parentName, r.parentEmail, r.programName]
      .some((v) => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleExport() {
    exportCsv(
      filtered.map((r) => ({
        'Child Name': r.childName,
        'Age': r.childAge ?? '',
        'Parent Name': r.parentName,
        'Parent Email': r.parentEmail,
        'Program': r.programName,
        'Location': r.locationName ?? '',
        'Day': r.dayOfWeek !== null ? DAY_NAMES[r.dayOfWeek] : '',
        'Start Time': formatTime(r.startTime),
        'Session Start': r.startDate,
        'Status': r.status,
        'Payment Status': r.paymentStatus,
        'Amount': r.amountCents !== null ? (r.amountCents / 100).toFixed(2) : '',
        'Enrolled At': r.enrolledAt ? new Date(r.enrolledAt).toLocaleDateString() : '',
        'Channel': r.channel ?? '',
      })),
      `enrollment-report-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  const confirmedCount = filtered.filter((r) => r.status === 'confirmed').length;
  const totalRevenue = filtered
    .filter((r) => r.paymentStatus === 'paid')
    .reduce((s, r) => s + (r.amountCents ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-indigo-600">{filtered.length}</p>
          <p className="text-xs text-indigo-500 mt-0.5">Total</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{confirmedCount}</p>
          <p className="text-xs text-emerald-500 mt-0.5">Confirmed</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-amber-600">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-amber-500 mt-0.5">Revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search child, parent, program…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All status</option>
          <option value="confirmed">Confirmed</option>
          <option value="awaiting_payment">Awaiting Payment</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{filtered.length} records</p>
        <button
          onClick={handleExport}
          disabled={loading || filtered.length === 0}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors min-h-[40px] disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No registrations found</p>
        </div>
      ) : (
        /* Table — responsive cards on mobile, table on md+ */
        <div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((row) => {
              const badge = getStatusBadge(row.status);
              return (
                <div key={row.registrationId} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{row.childName || '—'}</p>
                      <p className="text-xs text-slate-500">{row.parentName} · {row.parentEmail}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p>{row.programName} {row.dayOfWeek !== null ? `· ${DAY_SHORT[row.dayOfWeek]}` : ''} {formatTime(row.startTime)}</p>
                    {row.locationName && <p className="text-slate-400">{row.locationName}</p>}
                  </div>
                  {row.amountCents !== null && (
                    <p className="text-sm font-semibold text-slate-700">{formatCurrency(row.amountCents)}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Child', 'Parent', 'Program', 'Day / Time', 'Location', 'Status', 'Amount', 'Enrolled'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => {
                  const badge = getStatusBadge(row.status);
                  return (
                    <tr key={row.registrationId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{row.childName || '—'}</p>
                        {row.childAge && <p className="text-xs text-slate-400">Age {row.childAge}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">{row.parentName}</p>
                        <p className="text-xs text-slate-400">{row.parentEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.programName}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {row.dayOfWeek !== null ? DAY_SHORT[row.dayOfWeek] : '—'}{' · '}{formatTime(row.startTime)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{row.locationName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {row.amountCents !== null ? formatCurrency(row.amountCents) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {row.enrolledAt ? formatDate(row.enrolledAt) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Revenue Report
// ─────────────────────────────────────────────────────────────────────────────

function RevenueReport({ dateRange }: { dateRange: DateRange }) {
  const [rows, setRows] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalRegistrations, setTotalRegistrations] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since = sinceDate(dateRange);
      let query = supabase
        .from('registrations')
        .select(`
          amount_cents,
          payment_status,
          sessions!inner (
            programs!inner ( name )
          )
        `)
        .eq('status', 'confirmed')
        .eq('payment_status', 'paid');

      if (since) query = query.gte('created_at', since);

      const { data, error: dbErr } = await query;
      if (dbErr) throw dbErr;

      const programMap = new Map<string, { count: number; revenue: number }>();
      let total = 0;
      let count = 0;

      (data ?? []).forEach((r) => {
        const sess = r.sessions as unknown as { programs: { name: string } };
        const name = sess.programs.name;
        const cents = r.amount_cents ?? 0;
        const existing = programMap.get(name) ?? { count: 0, revenue: 0 };
        programMap.set(name, { count: existing.count + 1, revenue: existing.revenue + cents });
        total += cents;
        count++;
      });

      const sorted: RevenueRow[] = Array.from(programMap.entries())
        .map(([programName, { count: c, revenue }]) => ({
          programName,
          confirmedCount: c,
          revenueCents: revenue,
          avgAmountCents: c > 0 ? Math.round(revenue / c) : 0,
        }))
        .sort((a, b) => b.revenueCents - a.revenueCents);

      setRows(sorted);
      setTotalRevenue(total);
      setTotalRegistrations(count);
    } catch (err) {
      setError('Failed to load revenue data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { load(); }, [load]);

  const maxRevenue = rows[0]?.revenueCents ?? 1;

  function handleExport() {
    exportCsv(
      rows.map((r) => ({
        'Program': r.programName,
        'Registrations': r.confirmedCount,
        'Total Revenue': (r.revenueCents / 100).toFixed(2),
        'Avg Amount': (r.avgAmountCents / 100).toFixed(2),
      })),
      `revenue-report-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  return (
    <div className="space-y-4">
      {/* Top metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl p-3 text-center col-span-2">
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-emerald-500 mt-0.5">Total Revenue</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-indigo-600">{totalRegistrations}</p>
          <p className="text-xs text-indigo-500 mt-0.5">Paid</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={loading || rows.length === 0}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors min-h-[40px] disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No paid registrations in this period</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Revenue by Program</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <div key={row.programName} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-900 text-sm">{row.programName}</p>
                  <p className="font-bold text-emerald-600 text-sm shrink-0">{formatCurrency(row.revenueCents)}</p>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(row.revenueCents / maxRevenue) * 100}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>{row.confirmedCount} registrations</span>
                  <span>Avg {formatCurrency(row.avgAmountCents)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Printable Schedule Report
// ─────────────────────────────────────────────────────────────────────────────

function ScheduleReport() {
  const [classes, setClasses] = useState<ScheduleClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all');
  const printRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load active sessions with enrolled students
      const { data: sessions, error: sessErr } = await supabase
        .from('sessions')
        .select(`
          id,
          day_of_week,
          start_time,
          end_date,
          capacity,
          enrolled_count,
          custom_fields,
          programs!inner ( name ),
          locations ( name ),
          staff ( name )
        `)
        .eq('status', 'active')
        .order('day_of_week')
        .order('start_time');

      if (sessErr) throw sessErr;

      // Load confirmed registrations with student names
      const sessionIds = (sessions ?? []).map((s) => s.id);
      if (!sessionIds.length) {
        setClasses([]);
        return;
      }

      const { data: regs, error: regErr } = await supabase
        .from('registrations')
        .select(`
          session_id,
          child_name,
          child_age,
          children ( first_name, last_name )
        `)
        .in('session_id', sessionIds)
        .eq('status', 'confirmed');

      if (regErr) throw regErr;

      // Build map of sessionId → students
      const studentMap = new Map<string, { name: string; age: number | null }[]>();
      (regs ?? []).forEach((r) => {
        const child = r.children as unknown as { first_name: string; last_name: string | null } | null;
        const name = child
          ? `${child.first_name}${child.last_name ? ' ' + child.last_name : ''}`
          : r.child_name ?? 'Unknown';
        const existing = studentMap.get(r.session_id) ?? [];
        existing.push({ name, age: r.child_age });
        studentMap.set(r.session_id, existing);
      });

      const mapped: ScheduleClass[] = (sessions ?? [])
        .filter((s) => s.day_of_week !== null)
        .map((s) => {
          const sess = s as typeof s & {
            programs: { name: string };
            locations: { name: string } | null;
            staff: { name: string } | null;
          };
          return {
            sessionId: s.id,
            programName: sess.programs.name,
            locationName: sess.locations?.name ?? null,
            dayOfWeek: s.day_of_week as number,
            startTime: s.start_time,
            endDate: s.end_date,
            coachName: sess.staff?.name ?? null,
            capacity: s.capacity,
            enrolledCount: s.enrolled_count,
            students: studentMap.get(s.id) ?? [],
            customFields: (s.custom_fields ?? {}) as Record<string, string>,
          };
        });

      setClasses(mapped);
    } catch (err) {
      setError('Failed to load schedule data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handlePrint() {
    window.print();
  }

  function handleExport() {
    const rows: Record<string, string | number | null>[] = [];
    classes.forEach((cls) => {
      if (cls.students.length === 0) {
        rows.push({
          'Day': DAY_NAMES[cls.dayOfWeek],
          'Time': formatTime(cls.startTime),
          'Program': cls.programName,
          'Location': cls.locationName ?? '',
          'Coach': cls.coachName ?? '',
          'Enrolled': cls.enrolledCount,
          'Capacity': cls.capacity,
          'Child Name': '',
          'Child Age': '',
        });
      } else {
        cls.students.forEach((s) => {
          rows.push({
            'Day': DAY_NAMES[cls.dayOfWeek],
            'Time': formatTime(cls.startTime),
            'Program': cls.programName,
            'Location': cls.locationName ?? '',
            'Coach': cls.coachName ?? '',
            'Enrolled': cls.enrolledCount,
            'Capacity': cls.capacity,
            'Child Name': s.name,
            'Child Age': s.age ?? '',
          });
        });
      }
    });
    exportCsv(rows, `schedule-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const days = [...new Set(classes.map((c) => c.dayOfWeek))].sort();
  const filtered = dayFilter === 'all' ? classes : classes.filter((c) => c.dayOfWeek === dayFilter);
  const grouped = filtered.reduce<Record<number, ScheduleClass[]>>((acc, c) => {
    (acc[c.dayOfWeek] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setDayFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${dayFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All Days
          </button>
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setDayFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${dayFilter === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {DAY_SHORT[d]}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleExport}
            disabled={loading || filtered.length === 0}
            className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors min-h-[40px] disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={loading || filtered.length === 0}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors min-h-[40px] disabled:opacity-40"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No active sessions</p>
        </div>
      ) : (
        <div ref={printRef} className="space-y-6 print:space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([dayStr, daySessions]) => (
              <div key={dayStr}>
                <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  {DAY_NAMES[parseInt(dayStr)]}
                  <span className="font-normal text-slate-400 lowercase tracking-normal">
                    · {daySessions.length} {daySessions.length === 1 ? 'class' : 'classes'}
                  </span>
                </h3>
                <div className="space-y-3">
                  {daySessions.map((cls) => {
                    const fillPct = cls.capacity > 0 ? (cls.enrolledCount / cls.capacity) * 100 : 0;
                    const fillColor = fillPct >= 90 ? 'bg-red-500' : fillPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
                    return (
                      <div key={cls.sessionId} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 flex items-start justify-between gap-2 border-b border-slate-100">
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{cls.programName}</p>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatTime(cls.startTime)}
                              </span>
                              {cls.locationName && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {cls.locationName}
                                </span>
                              )}
                              {cls.coachName && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" />
                                  {cls.coachName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-slate-700">{cls.enrolledCount}/{cls.capacity}</p>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1">
                              <div className={`h-full rounded-full ${fillColor}`} style={{ width: `${fillPct}%` }} />
                            </div>
                          </div>
                        </div>
                        {cls.students.length > 0 && (
                          <div className="px-4 py-2">
                            <div className="flex flex-wrap gap-1.5">
                              {cls.students.sort((a, b) => a.name.localeCompare(b.name)).map((s, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full"
                                >
                                  {s.name}{s.age ? ` (${s.age})` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {Object.keys(cls.customFields).length > 0 && (
                          <div className="px-4 pb-3">
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                              {Object.entries(cls.customFields).map(([key, value]) => (
                                <span key={key} className="text-xs text-slate-500">
                                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                                  {String(value)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  'all': 'All time',
};

export function Reports() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ReportTab>('enrollment');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const tabs: { id: ReportTab; label: string; icon: typeof FileText }[] = [
    { id: 'enrollment', label: 'Enrollment', icon: Users },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Analytics
            </button>
            <div className="w-px h-5 bg-slate-300" />
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h1 className="text-lg font-bold text-slate-900">Reports</h1>
            </div>
          </div>

          {/* Tabs + date range */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[40px] ${
                      tab === t.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {tab !== 'schedule' && (
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {(Object.entries(DATE_RANGE_LABELS) as [DateRange, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'enrollment' && <EnrollmentReport key={dateRange} dateRange={dateRange} />}
        {tab === 'revenue' && <RevenueReport key={dateRange} dateRange={dateRange} />}
        {tab === 'schedule' && <ScheduleReport />}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          .print\\:space-y-4 { display: block; }
          [data-print-content], [data-print-content] * { visibility: visible; }
        }
      `}</style>
    </div>
  );
}
