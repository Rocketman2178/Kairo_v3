import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Target,
  BarChart3,
  RefreshCw,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OverviewMetrics {
  totalRevenueCents: number;
  confirmedRegistrations: number;
  conversionRate: number;
  abandonedCarts: number;
  cartRecoveryRate: number;
  avgRegistrationAmountCents: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

interface RevenueByProgram {
  programName: string;
  revenueCents: number;
  registrations: number;
}

interface AbandonedCartBreakdown {
  stepAbandoned: number | null;
  count: number;
  label: string;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  if (cents >= 100_000_00) return `$${(cents / 100_000_00).toFixed(1)}M`;
  if (cents >= 1_000_00) return `$${(cents / 1_000_00).toFixed(1)}K`;
  return `$${(cents / 100).toFixed(0)}`;
}

function formatFullCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function sinceDate(range: TimeRange): string | null {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const STEP_LABELS: Record<number, string> = {
  0: 'Session confirmation',
  1: 'Personal info',
  2: 'Payment',
  3: 'Completed',
};

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon,
  trend,
  trendLabel,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      )}
      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                trend >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
          {trendLabel && <span className="text-xs text-slate-400">{trendLabel}</span>}
          {sub && <span className="text-xs text-slate-400">{sub}</span>}
        </div>
      )}
    </div>
  );
}

function ConversionFunnel({ stages, loading }: { stages: FunnelStage[]; loading: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <Target className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">Registration Funnel</h3>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {stages.map((stage, i) => (
            <div key={i} className="group">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-700 font-medium">{stage.stage}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs">{stage.count.toLocaleString()}</span>
                  <span className="text-slate-700 font-semibold w-12 text-right">
                    {stage.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${stage.color}`}
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export function Analytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalRevenueCents: 0,
    confirmedRegistrations: 0,
    conversionRate: 0,
    abandonedCarts: 0,
    cartRecoveryRate: 0,
    avgRegistrationAmountCents: 0,
  });
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [revenueByProgram, setRevenueByProgram] = useState<RevenueByProgram[]>([]);
  const [abandonedBreakdown, setAbandonedBreakdown] = useState<AbandonedCartBreakdown[]>([]);

  async function loadAnalytics() {
    setLoading(true);
    const since = sinceDate(timeRange);

    try {
      // ── Confirmed registrations & revenue ──────────────────────────────────
      const regQuery = supabase
        .from('registrations')
        .select('id, amount_cents, status, created_at, session_id')
        .in('status', ['confirmed', 'awaiting_payment', 'pending_registration']);
      if (since) regQuery.gte('created_at', since);
      const { data: allRegs } = await regQuery;

      const confirmed = (allRegs ?? []).filter((r) => r.status === 'confirmed');
      const totalRevenueCents = confirmed.reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
      const avgCents = confirmed.length > 0 ? Math.round(totalRevenueCents / confirmed.length) : 0;

      // ── Conversations (top of funnel) ──────────────────────────────────────
      const convQuery = supabase.from('conversations').select('id, created_at', { count: 'exact' });
      if (since) convQuery.gte('created_at', since);
      const { count: conversationCount } = await convQuery;

      const totalConversations = conversationCount ?? 0;

      // ── Abandoned carts ─────────────────────────────────────────────────────
      const cartQuery = supabase.from('abandoned_carts').select(
        'id, step_abandoned, recovered_at, created_at'
      );
      if (since) cartQuery.gte('created_at', since);
      const { data: carts } = await cartQuery;

      const totalCarts = (carts ?? []).length;
      const recoveredCarts = (carts ?? []).filter((c) => c.recovered_at).length;
      const cartRecoveryRate = totalCarts > 0 ? Math.round((recoveredCarts / totalCarts) * 100) : 0;

      // ── Conversion rate ────────────────────────────────────────────────────
      const conversionRate =
        totalConversations > 0
          ? Math.round((confirmed.length / totalConversations) * 100 * 10) / 10
          : 0;

      setMetrics({
        totalRevenueCents,
        confirmedRegistrations: confirmed.length,
        conversionRate,
        abandonedCarts: totalCarts,
        cartRecoveryRate,
        avgRegistrationAmountCents: avgCents,
      });

      // ── Funnel stages ─────────────────────────────────────────────────────
      const chatStarted = totalConversations;
      const sessionSelected = (allRegs ?? []).length;
      const infoSubmitted = (allRegs ?? []).filter(
        (r) => r.status !== 'pending_registration'
      ).length;
      const paymentInitiated = (allRegs ?? []).filter(
        (r) => r.status === 'awaiting_payment' || r.status === 'confirmed'
      ).length;
      const completed = confirmed.length;

      const funnelStages: FunnelStage[] = [
        { stage: 'Chat started', count: chatStarted, percentage: 100, color: 'bg-blue-500' },
        {
          stage: 'Session selected',
          count: sessionSelected,
          percentage: chatStarted > 0 ? (sessionSelected / chatStarted) * 100 : 0,
          color: 'bg-blue-400',
        },
        {
          stage: 'Info submitted',
          count: infoSubmitted,
          percentage: chatStarted > 0 ? (infoSubmitted / chatStarted) * 100 : 0,
          color: 'bg-cyan-500',
        },
        {
          stage: 'Payment initiated',
          count: paymentInitiated,
          percentage: chatStarted > 0 ? (paymentInitiated / chatStarted) * 100 : 0,
          color: 'bg-cyan-400',
        },
        {
          stage: 'Registration complete',
          count: completed,
          percentage: chatStarted > 0 ? (completed / chatStarted) * 100 : 0,
          color: 'bg-emerald-500',
        },
      ];
      setFunnel(funnelStages);

      // ── Revenue by program ─────────────────────────────────────────────────
      if (confirmed.length > 0) {
        const sessionIds = [...new Set(confirmed.map((r) => r.session_id).filter(Boolean))];
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id, program_id, programs(name)')
          .in('id', sessionIds);

        const sessionMap = new Map(
          (sessions ?? []).map((s) => [s.id, (s.programs as { name: string } | null)?.name ?? 'Unknown'])
        );

        const byProgram = new Map<string, { revenueCents: number; count: number }>();
        for (const reg of confirmed) {
          const name = sessionMap.get(reg.session_id) ?? 'Other';
          const existing = byProgram.get(name) ?? { revenueCents: 0, count: 0 };
          byProgram.set(name, {
            revenueCents: existing.revenueCents + (reg.amount_cents ?? 0),
            count: existing.count + 1,
          });
        }

        const sorted = [...byProgram.entries()]
          .sort((a, b) => b[1].revenueCents - a[1].revenueCents)
          .slice(0, 6)
          .map(([name, data]) => ({
            programName: name,
            revenueCents: data.revenueCents,
            registrations: data.count,
          }));
        setRevenueByProgram(sorted);
      } else {
        setRevenueByProgram([]);
      }

      // ── Abandoned cart breakdown by step ──────────────────────────────────
      const stepCounts = new Map<number | null, number>();
      for (const cart of carts ?? []) {
        const step = cart.step_abandoned as number | null;
        stepCounts.set(step, (stepCounts.get(step) ?? 0) + 1);
      }
      const breakdown: AbandonedCartBreakdown[] = [...stepCounts.entries()]
        .sort((a, b) => (a[0] ?? -1) - (b[0] ?? -1))
        .map(([step, count]) => ({
          stepAbandoned: step,
          count,
          label: step !== null ? (STEP_LABELS[step] ?? `Step ${step}`) : 'Unknown',
        }));
      setAbandonedBreakdown(breakdown);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  }

  useEffect(() => {
    loadAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const maxProgramRevenue = Math.max(...revenueByProgram.map((p) => p.revenueCents), 1);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Analytics</h1>
              <p className="text-xs text-slate-400">
                Last updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Time range selector */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
              {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[32px] ${
                    timeRange === r
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {r === 'all' ? 'All time' : r}
                </button>
              ))}
            </div>

            <button
              onClick={loadAnalytics}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Overview metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label="Total Revenue"
            value={loading ? '—' : formatCurrency(metrics.totalRevenueCents)}
            sub={loading ? undefined : formatFullCurrency(metrics.totalRevenueCents)}
            icon={<DollarSign className="w-4 h-4" />}
            loading={loading}
          />
          <MetricCard
            label="Registrations"
            value={loading ? '—' : metrics.confirmedRegistrations.toLocaleString()}
            icon={<CheckCircle className="w-4 h-4" />}
            loading={loading}
          />
          <MetricCard
            label="Conversion Rate"
            value={loading ? '—' : `${metrics.conversionRate}%`}
            sub="chat → registration"
            icon={<Target className="w-4 h-4" />}
            loading={loading}
          />
          <MetricCard
            label="Avg Registration"
            value={loading ? '—' : formatCurrency(metrics.avgRegistrationAmountCents)}
            icon={<BarChart3 className="w-4 h-4" />}
            loading={loading}
          />
          <MetricCard
            label="Abandoned Carts"
            value={loading ? '—' : metrics.abandonedCarts.toLocaleString()}
            icon={<ShoppingCart className="w-4 h-4" />}
            loading={loading}
          />
          <MetricCard
            label="Cart Recovery"
            value={loading ? '—' : `${metrics.cartRecoveryRate}%`}
            sub="of abandoned"
            icon={<TrendingUp className="w-4 h-4" />}
            loading={loading}
          />
        </div>

        {/* Funnel + Abandoned breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ConversionFunnel stages={funnel} loading={loading} />

          {/* Abandoned cart drop-off */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-800">Drop-off Points</h3>
              <span className="ml-auto text-xs text-slate-400 font-medium">Abandoned at step</span>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : abandonedBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-400 mb-2" />
                <p className="text-slate-500 text-sm">No abandoned carts in this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {abandonedBreakdown.map((item) => {
                  const totalCarts = abandonedBreakdown.reduce((s, i) => s + i.count, 0);
                  const pct = totalCarts > 0 ? (item.count / totalCarts) * 100 : 0;
                  return (
                    <div key={String(item.stepAbandoned)} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 font-medium">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-xs">{item.count} carts</span>
                          <span className="font-semibold text-slate-700 w-10 text-right">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Revenue by program */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Revenue by Program</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : revenueByProgram.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm">No completed registrations in this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revenueByProgram.map((prog) => {
                const pct = (prog.revenueCents / maxProgramRevenue) * 100;
                return (
                  <div key={prog.programName} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 font-medium truncate max-w-[60%]">
                        {prog.programName}
                      </span>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-slate-400 text-xs">
                          {prog.registrations} registrations
                        </span>
                        <span className="font-semibold text-slate-800 w-16 text-right">
                          {formatCurrency(prog.revenueCents)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Source breakdown hint */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-blue-900">Device & Source Tracking</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Source attribution and device analytics (mobile vs. desktop, referral channel) are
              coming in Stage 4.1 — tracking events will be added to the registration flow.
            </p>
          </div>
        </div>

        {loading && (
          <div className="fixed bottom-6 right-6 bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2 text-sm text-slate-600 border border-slate-200">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            Loading analytics…
          </div>
        )}
      </div>
    </div>
  );
}
