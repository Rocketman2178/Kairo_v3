import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  TrendingDown,
  Users,
  Mail,
  Phone,
  ArrowLeft,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Clock,
  BarChart3,
  Star,
  ChevronRight,
  Download,
  Filter,
  Activity,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface AtRiskFamily {
  familyId: string;
  parentName: string;
  email: string;
  phone: string | null;
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  lastActivityDays: number;
  totalRegistrations: number;
  abandonedCarts: number;
  engagementScore: number;
  lastChildName: string | null;
  lastProgramName: string | null;
}

interface RetentionMetrics {
  totalAtRisk: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  totalAbandonedCarts: number;
  avgDaysSinceActivity: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function computeRisk(
  daysSinceActivity: number,
  abandonedCarts: number,
  engagementScore: number,
  totalRegistrations: number
): { score: number; level: RiskLevel; factors: string[] } {
  const factors: string[] = [];
  let score = 0;

  // Days since last activity (most impactful factor)
  if (daysSinceActivity > 180) {
    score += 40;
    factors.push(`No activity in ${Math.round(daysSinceActivity / 30)} months`);
  } else if (daysSinceActivity > 90) {
    score += 25;
    factors.push(`Inactive for ${Math.round(daysSinceActivity / 30)} months`);
  } else if (daysSinceActivity > 45) {
    score += 15;
    factors.push(`Last activity ${Math.round(daysSinceActivity)} days ago`);
  }

  // Abandoned carts
  if (abandonedCarts >= 3) {
    score += 30;
    factors.push(`${abandonedCarts} abandoned carts`);
  } else if (abandonedCarts >= 2) {
    score += 20;
    factors.push(`${abandonedCarts} abandoned carts`);
  } else if (abandonedCarts === 1) {
    score += 10;
    factors.push('1 abandoned cart');
  }

  // Low engagement score (0–100 scale)
  if (engagementScore < 20) {
    score += 20;
    factors.push('Very low engagement');
  } else if (engagementScore < 40) {
    score += 10;
    factors.push('Low engagement score');
  }

  // Single-registration (no loyalty)
  if (totalRegistrations === 1) {
    score += 10;
    factors.push('Single registration — low loyalty');
  }

  let level: RiskLevel;
  if (score >= 60) level = 'critical';
  else if (score >= 40) level = 'high';
  else if (score >= 20) level = 'medium';
  else level = 'low';

  return { score: Math.min(score, 100), level, factors };
}

function getRiskConfig(level: RiskLevel) {
  switch (level) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-700',
        dot: 'bg-red-500',
        label: 'Critical',
      };
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        badge: 'bg-orange-100 text-orange-700',
        dot: 'bg-orange-500',
        label: 'High Risk',
      };
    case 'medium':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-700',
        dot: 'bg-amber-400',
        label: 'Medium',
      };
    default:
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-600',
        dot: 'bg-slate-400',
        label: 'Low',
      };
  }
}

function exportCsv(families: AtRiskFamily[]) {
  const rows = families.map((f) => ({
    'Parent Name': f.parentName,
    'Email': f.email,
    'Phone': f.phone ?? '',
    'Risk Level': f.riskLevel,
    'Risk Score': f.riskScore,
    'Days Since Activity': f.lastActivityDays,
    'Abandoned Carts': f.abandonedCarts,
    'Engagement Score': f.engagementScore,
    'Total Registrations': f.totalRegistrations,
    'Risk Factors': f.riskFactors.join('; '),
    'Last Program': f.lastProgramName ?? '',
  }));

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = String(r[h as keyof typeof r] ?? '');
          return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(',')
    ),
  ];
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `at-risk-families-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Family Risk Card
// ─────────────────────────────────────────────────────────────────────────────

function FamilyRiskCard({ family }: { family: AtRiskFamily }) {
  const config = getRiskConfig(family.riskLevel);

  function handleEmailOutreach() {
    const subject = encodeURIComponent(`We miss you at ${family.lastProgramName ?? 'our programs'}!`);
    const body = encodeURIComponent(
      `Hi ${family.parentName.split(' ')[0]},\n\nWe noticed it's been a while since ${family.lastChildName ?? 'your child'} has been active with us. We'd love to have you back!\n\nReach out if you have any questions about upcoming sessions.\n\nBest,\nThe Team`
    );
    window.open(`mailto:${family.email}?subject=${subject}&body=${body}`);
  }

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.dot}`} />
            <p className="font-semibold text-slate-900 text-sm">{family.parentName}</p>
          </div>
          <p className="text-xs text-slate-500 ml-4 mt-0.5">{family.email}</p>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.badge}`}>
            {config.label}
          </span>
          <p className="text-xs text-slate-400 mt-1">Score: {family.riskScore}/100</p>
        </div>
      </div>

      {/* Risk score bar */}
      <div className="h-1.5 bg-white/80 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            family.riskLevel === 'critical' ? 'bg-red-500' :
            family.riskLevel === 'high' ? 'bg-orange-500' :
            family.riskLevel === 'medium' ? 'bg-amber-400' : 'bg-slate-400'
          }`}
          style={{ width: `${family.riskScore}%` }}
        />
      </div>

      {/* Risk factors */}
      <div className="space-y-1">
        {family.riskFactors.map((f, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5" />
          {family.totalRegistrations} reg{family.totalRegistrations !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {family.lastActivityDays}d ago
        </span>
        {family.abandonedCarts > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <ShoppingCart className="w-3.5 h-3.5" />
            {family.abandonedCarts} cart{family.abandonedCarts !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Last program */}
      {family.lastProgramName && (
        <p className="text-xs text-slate-400">Last: {family.lastProgramName}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleEmailOutreach}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-lg bg-white hover:bg-indigo-50 transition-colors border border-indigo-200 min-h-[36px] flex-1 justify-center"
        >
          <Mail className="w-3.5 h-3.5" />
          Email Outreach
        </button>
        {family.phone && (
          <a
            href={`tel:${family.phone}`}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-700 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 transition-colors border border-slate-200 min-h-[36px]"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

export function Retention() {
  const navigate = useNavigate();
  const [families, setFamilies] = useState<AtRiskFamily[]>([]);
  const [metrics, setMetrics] = useState<RetentionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();

      // Load families with their registrations and abandoned carts
      const { data: familyData, error: famErr } = await supabase
        .from('families')
        .select(`
          id,
          primary_contact_name,
          email,
          phone,
          engagement_score,
          created_at,
          registrations!left (
            id,
            status,
            created_at,
            children ( first_name, last_name ),
            sessions ( programs ( name ) )
          ),
          abandoned_carts!left (
            id,
            recovered,
            created_at
          )
        `)
        .order('engagement_score', { ascending: true })
        .limit(200);

      if (famErr) throw famErr;

      const result: AtRiskFamily[] = [];

      for (const fam of familyData ?? []) {
        const regs = (fam.registrations ?? []) as unknown as Array<{
          id: string;
          status: string;
          created_at: string;
          children: { first_name: string; last_name: string | null } | null;
          sessions: { programs: { name: string } } | null;
        }>;

        const carts = (fam.abandoned_carts ?? []) as unknown as Array<{
          id: string;
          recovered: boolean;
          created_at: string;
        }>;

        const confirmedRegs = regs.filter((r) => r.status === 'confirmed');
        const unrecoveredCarts = carts.filter((c) => !c.recovered);

        // Find last activity date (most recent confirmed registration)
        const lastRegDate = confirmedRegs.length > 0
          ? Math.max(...confirmedRegs.map((r) => new Date(r.created_at).getTime()))
          : new Date(fam.created_at).getTime();

        const daysSinceActivity = (now.getTime() - lastRegDate) / (1000 * 60 * 60 * 24);

        // Only include families with some history but showing churn signals
        const hasActivity = confirmedRegs.length > 0 || unrecoveredCarts.length > 0;
        const showsChurnSignal = daysSinceActivity > 30 || unrecoveredCarts.length > 0 || (fam.engagement_score ?? 50) < 40;

        if (!hasActivity && unrecoveredCarts.length === 0) continue;
        if (!showsChurnSignal) continue;

        const { score, level, factors } = computeRisk(
          daysSinceActivity,
          unrecoveredCarts.length,
          fam.engagement_score ?? 50,
          confirmedRegs.length
        );

        if (factors.length === 0) continue;

        // Get last child and program names
        const lastReg = confirmedRegs.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        const lastChildName = lastReg?.children
          ? lastReg.children.first_name
          : null;
        const lastProgramName = lastReg?.sessions?.programs?.name ?? null;

        result.push({
          familyId: fam.id,
          parentName: fam.primary_contact_name,
          email: fam.email,
          phone: fam.phone,
          riskScore: score,
          riskLevel: level,
          riskFactors: factors,
          lastActivityDays: Math.round(daysSinceActivity),
          totalRegistrations: confirmedRegs.length,
          abandonedCarts: unrecoveredCarts.length,
          engagementScore: fam.engagement_score ?? 50,
          lastChildName,
          lastProgramName,
        });
      }

      // Sort by risk score desc
      result.sort((a, b) => b.riskScore - a.riskScore);
      setFamilies(result);

      const criticalCount = result.filter((f) => f.riskLevel === 'critical').length;
      const highCount = result.filter((f) => f.riskLevel === 'high').length;
      const mediumCount = result.filter((f) => f.riskLevel === 'medium').length;
      const totalCarts = result.reduce((s, f) => s + f.abandonedCarts, 0);
      const avgDays = result.length > 0
        ? Math.round(result.reduce((s, f) => s + f.lastActivityDays, 0) / result.length)
        : 0;

      setMetrics({
        totalAtRisk: result.length,
        criticalCount,
        highCount,
        mediumCount,
        totalAbandonedCarts: totalCarts,
        avgDaysSinceActivity: avgDays,
      });

      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load retention data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = riskFilter === 'all'
    ? families
    : families.filter((f) => f.riskLevel === riskFilter);

  const RISK_LEVELS: { value: RiskLevel | 'all'; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: families.length },
    { value: 'critical', label: 'Critical', count: metrics?.criticalCount },
    { value: 'high', label: 'High', count: metrics?.highCount },
    { value: 'medium', label: 'Medium', count: metrics?.mediumCount },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
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
              <Activity className="w-5 h-5 text-red-500" />
              <h1 className="text-lg font-bold text-slate-900">Churn Prevention</h1>
            </div>
          </div>

          {lastUpdated && (
            <p className="text-xs text-slate-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 rounded-xl border border-red-100 p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{metrics.criticalCount}</p>
              <p className="text-xs text-red-500 mt-0.5">Critical</p>
            </div>
            <div className="bg-orange-50 rounded-xl border border-orange-100 p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">{metrics.highCount}</p>
              <p className="text-xs text-orange-500 mt-0.5">High Risk</p>
            </div>
            <div className="bg-slate-100 rounded-xl border border-slate-200 p-3 text-center">
              <p className="text-2xl font-bold text-slate-600">{metrics.totalAtRisk}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total At-Risk</p>
            </div>
          </div>
        )}

        {/* Insight card */}
        {metrics && metrics.totalAbandonedCarts > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <ShoppingCart className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {metrics.totalAbandonedCarts} unrecovered abandoned cart{metrics.totalAbandonedCarts !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Consider sending a personal follow-up email to families who have abandoned multiple carts.
              </p>
            </div>
          </div>
        )}

        {/* Risk methodology */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">How Risk is Calculated</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Days since last activity</span>
            <span className="flex items-center gap-1.5"><ShoppingCart className="w-3.5 h-3.5 text-slate-400" /> Abandoned carts</span>
            <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-slate-400" /> Engagement score</span>
            <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-slate-400" /> Registration history</span>
          </div>
        </div>

        {/* Filter + export */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1">
            {RISK_LEVELS.map((rl) => (
              <button
                key={rl.value}
                onClick={() => setRiskFilter(rl.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${
                  riskFilter === rl.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {rl.label}
                {rl.count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${riskFilter === rl.value ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {rl.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors min-h-[40px]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => exportCsv(filtered)}
              disabled={loading || filtered.length === 0}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors min-h-[40px] disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Families list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Analyzing family engagement…</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
            <button onClick={load} className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-sm">
              {riskFilter === 'all' ? 'No at-risk families detected' : `No ${riskFilter} risk families`}
            </p>
            <p className="text-xs mt-1">
              {riskFilter === 'all'
                ? 'Your families are all showing healthy engagement signals.'
                : 'Try a different filter level.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((f) => (
              <FamilyRiskCard key={f.familyId} family={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
