import { useState } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Users, DollarSign,
  Filter, Lock, Sparkles, ArrowUpRight, ArrowDownRight,
  Target, Zap, Building2, MapPin, Calendar, ChevronDown,
  AlertTriangle, CheckCircle, Info, Crown, ToggleRight, Shield
} from 'lucide-react';

type TabId = 'dashboard' | 'enrollment' | 'revenue' | 'operations' | 'recommendations';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { id: 'dashboard', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'enrollment', label: 'Enrollment', icon: <Users className="w-4 h-4" /> },
  { id: 'revenue', label: 'Revenue', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'operations', label: 'Operations', icon: <Target className="w-4 h-4" /> },
  { id: 'recommendations', label: 'AI Insights', icon: <Sparkles className="w-4 h-4" /> },
];

type SubscriptionTier = 'base' | 'benchmarking' | 'intelligence';

function BenchmarkCard({
  label,
  yourValue,
  peerAvg,
  percentile,
  format = 'number',
  higherIsBetter = true
}: {
  label: string;
  yourValue: number;
  peerAvg: number;
  percentile: number;
  format?: 'number' | 'percent' | 'currency';
  higherIsBetter?: boolean;
}) {
  const diff = yourValue - peerAvg;
  const diffPercent = ((diff / peerAvg) * 100).toFixed(1);
  const isPositive = higherIsBetter ? diff > 0 : diff < 0;

  const formatValue = (val: number) => {
    switch (format) {
      case 'percent': return `${val.toFixed(1)}%`;
      case 'currency': return `$${val.toLocaleString()}`;
      default: return val.toLocaleString();
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${isPositive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-2xl font-bold text-white">{formatValue(yourValue)}</p>
          <p className="text-slate-500 text-xs">Your Business</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-slate-400">{formatValue(peerAvg)}</p>
          <p className="text-slate-500 text-xs">Peer Average</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>{isPositive ? '+' : ''}{diffPercent}% vs peers</span>
        </div>
        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
          {percentile}th percentile
        </span>
      </div>
    </div>
  );
}

function LockedFeature({ tier, children }: { tier: 'benchmarking' | 'intelligence'; children: React.ReactNode }) {
  const tierLabels = {
    benchmarking: 'Benchmarking (+$99/mo)',
    intelligence: 'Intelligence (+$199/mo)'
  };

  return (
    <div className="relative">
      <div className="filter blur-sm pointer-events-none opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-6 text-center max-w-xs">
          <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Upgrade to Unlock</p>
          <p className="text-slate-400 text-sm mb-3">This feature requires {tierLabels[tier]}</p>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}

function PercentileBar({ percentile, label }: { percentile: number; label: string }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-white font-medium">{percentile}th</span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 flex">
          <div className="w-1/4 border-r border-slate-600" />
          <div className="w-1/4 border-r border-slate-600" />
          <div className="w-1/4 border-r border-slate-600" />
          <div className="w-1/4" />
        </div>
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full relative"
          style={{ width: `${percentile}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
        </div>
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>25th</span>
        <span>50th</span>
        <span>75th</span>
        <span>100th</span>
      </div>
    </div>
  );
}

function AlertCard({ type, title, children }: { type: 'info' | 'success' | 'warning'; title: string; children: React.ReactNode }) {
  const styles = {
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500', icon: <Info className="w-5 h-5 text-blue-400" /> },
    success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500', icon: <CheckCircle className="w-5 h-5 text-emerald-400" /> },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500', icon: <AlertTriangle className="w-5 h-5 text-amber-400" /> },
  };

  return (
    <div className={`${styles[type].bg} border-l-4 ${styles[type].border} rounded-r-lg p-4`}>
      <div className="flex items-start gap-3">
        {styles[type].icon}
        <div>
          <h4 className="text-white font-medium mb-1">{title}</h4>
          <div className="text-slate-400 text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({
  priority,
  title,
  description,
  opportunity,
  actions
}: {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  opportunity: string;
  actions: string[];
}) {
  const priorityStyles = {
    high: 'bg-red-500/10 border-red-500/30 text-red-400',
    medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    low: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h4 className="text-white font-semibold">{title}</h4>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded border ${priorityStyles[priority]}`}>
          {priority.toUpperCase()} IMPACT
        </span>
      </div>
      <p className="text-slate-400 text-sm mb-3">{description}</p>
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-3">
        <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Estimated Opportunity: {opportunity}
        </p>
      </div>
      <div>
        <p className="text-slate-500 text-xs uppercase font-medium mb-2">Recommended Actions</p>
        <ul className="space-y-1">
          {actions.map((action, idx) => (
            <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              {action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FilterBar() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-white font-medium text-sm">Benchmark Filters</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="relative">
          <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer">
            <option>California</option>
            <option>All States</option>
            <option>Southwest</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer">
            <option>Soccer</option>
            <option>All Sports</option>
            <option>Swim</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer">
            <option>$500K-$1M</option>
            <option>All Sizes</option>
            <option>$100K-$500K</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer">
            <option>3-5 Years</option>
            <option>All</option>
            <option>0-2 Years</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer">
            <option>Current Season</option>
            <option>Year over Year</option>
            <option>Last Season</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <p className="text-slate-500 text-xs mt-3 flex items-center gap-2">
        <Users className="w-3 h-3" />
        Comparing against 47 similar businesses in your peer group
      </p>
    </div>
  );
}

export function DemoBenchmarking() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [currentTier] = useState<SubscriptionTier>('intelligence');

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600/20 text-cyan-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-medium">Intelligence Tier</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <DashboardTab tier={currentTier} />}
        {activeTab === 'enrollment' && <EnrollmentTab tier={currentTier} />}
        {activeTab === 'revenue' && <RevenueTab tier={currentTier} />}
        {activeTab === 'operations' && <OperationsTab tier={currentTier} />}
        {activeTab === 'recommendations' && <RecommendationsTab tier={currentTier} />}
      </main>

      <footer className="border-t border-slate-700 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            Powered by <span className="text-cyan-400">Kairo Benchmarking</span> - Anonymous peer data from 47 businesses
          </p>
          <p className="text-slate-600 text-xs mt-1">AI Recommendations by Gemini 3 Flash - Data updated January 2026</p>
        </div>
      </footer>
    </div>
  );
}

function DataSharingToggle() {
  const [isEnabled, setIsEnabled] = useState(true);
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Data Sharing Settings</h4>
            <p className="text-slate-400 text-sm">
              {isEnabled
                ? "Your anonymized data contributes to peer benchmarks. To access industry insights, data sharing must be enabled."
                : "Data sharing is disabled. Enable to access benchmarking insights and contribute to the peer network."}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
            isEnabled ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
            isEnabled ? 'left-8' : 'left-1'
          }`} />
        </button>
      </div>
      {isEnabled && (
        <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-2 text-xs text-slate-500">
          <ToggleRight className="w-4 h-4 text-emerald-400" />
          <span>Your data is anonymized and aggregated - competitors cannot see your individual metrics</span>
        </div>
      )}
    </div>
  );
}

function DashboardTab({ tier }: { tier: SubscriptionTier }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-2 right-2 px-2 py-1 bg-white/20 rounded-full text-xs font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          NEW
        </div>
        <h3 className="text-xl font-bold mb-2">Benchmarking Intelligence Dashboard</h3>
        <p className="text-blue-100">
          See how your business compares to similar youth sports organizations. Anonymous, aggregated data from 47 peer businesses.
        </p>
      </div>

      <DataSharingToggle />

      <FilterBar />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BenchmarkCard
          label="Enrollment Rate"
          yourValue={78.5}
          peerAvg={71.2}
          percentile={72}
          format="percent"
        />
        <BenchmarkCard
          label="Revenue per Child"
          yourValue={248}
          peerAvg={215}
          percentile={68}
          format="currency"
        />
        <BenchmarkCard
          label="Re-enrollment Rate"
          yourValue={62.3}
          peerAvg={68.5}
          percentile={38}
          format="percent"
        />
        <BenchmarkCard
          label="Cart Abandonment"
          yourValue={24.5}
          peerAvg={31.2}
          percentile={71}
          format="percent"
          higherIsBetter={false}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Your Percentile Rankings
          </h4>
          <PercentileBar percentile={72} label="Enrollment Rate" />
          <PercentileBar percentile={68} label="Revenue per Child" />
          <PercentileBar percentile={38} label="Re-enrollment Rate" />
          <PercentileBar percentile={71} label="Cart Recovery" />
          <PercentileBar percentile={55} label="Class Fill Rate" />
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Strengths vs. Peers
          </h4>
          <div className="space-y-3">
            {[
              { metric: 'Enrollment Rate', diff: '+7.3%', desc: 'Above peer average' },
              { metric: 'Revenue per Child', diff: '+$33', desc: 'Higher than 68% of peers' },
              { metric: 'Cart Recovery', diff: '-6.7%', desc: 'Lower abandonment rate' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div>
                  <p className="text-white font-medium">{item.metric}</p>
                  <p className="text-slate-400 text-xs">{item.desc}</p>
                </div>
                <span className="text-emerald-400 font-bold">{item.diff}</span>
              </div>
            ))}
          </div>
          <h4 className="text-white font-semibold mb-3 mt-5 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-amber-400" />
            Opportunities
          </h4>
          <div className="space-y-3">
            {[
              { metric: 'Re-enrollment Rate', diff: '-6.2%', desc: 'Below peer average' },
              { metric: 'Sibling Enrollment', diff: '-3.1%', desc: 'Below 75th percentile' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div>
                  <p className="text-white font-medium">{item.metric}</p>
                  <p className="text-slate-400 text-xs">{item.desc}</p>
                </div>
                <span className="text-amber-400 font-bold">{item.diff}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tier === 'intelligence' ? (
        <AlertCard type="success" title="AI Insight">
          <p>Your re-enrollment rate of 62.3% is 6.2% below peer average. Based on similar businesses, implementing automated re-enrollment reminders 3 weeks before season end could increase this by 8-12%. Estimated annual revenue opportunity: <strong>$14,200</strong>.</p>
        </AlertCard>
      ) : (
        <LockedFeature tier="intelligence">
          <AlertCard type="success" title="AI Insight">
            <p>Upgrade to Intelligence tier to see AI-powered recommendations based on your benchmarking data.</p>
          </AlertCard>
        </LockedFeature>
      )}
    </div>
  );
}

function EnrollmentTab({ tier }: { tier: SubscriptionTier }) {
  return (
    <div className="space-y-6">
      <FilterBar />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <BenchmarkCard label="Enrollment Rate" yourValue={78.5} peerAvg={71.2} percentile={72} format="percent" />
        <BenchmarkCard label="Trial-to-Paid" yourValue={34.2} peerAvg={38.5} percentile={42} format="percent" />
        <BenchmarkCard label="Re-enrollment" yourValue={62.3} peerAvg={68.5} percentile={38} format="percent" />
        <BenchmarkCard label="Sibling Rate" yourValue={8.5} peerAvg={11.2} percentile={35} format="percent" />
        <BenchmarkCard label="Waitlist Conversion" yourValue={72.0} peerAvg={65.3} percentile={68} format="percent" />
        <BenchmarkCard label="Cart Abandonment" yourValue={24.5} peerAvg={31.2} percentile={71} format="percent" higherIsBetter={false} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Enrollment Rate Trend</h4>
          <div className="h-48 flex items-end gap-4 px-4">
            {[
              { period: 'Q1', yours: 65, peers: 68 },
              { period: 'Q2', yours: 72, peers: 70 },
              { period: 'Q3', yours: 75, peers: 71 },
              { period: 'Q4', yours: 78.5, peers: 71.2 },
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 items-end h-40">
                  <div
                    className="flex-1 bg-cyan-500 rounded-t"
                    style={{ height: `${(item.yours / 100) * 100}%` }}
                  />
                  <div
                    className="flex-1 bg-slate-600 rounded-t"
                    style={{ height: `${(item.peers / 100) * 100}%` }}
                  />
                </div>
                <span className="text-slate-400 text-xs">{item.period}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-cyan-500 rounded" />
              <span className="text-slate-400">Your Business</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-slate-600 rounded" />
              <span className="text-slate-400">Peer Average</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Enrollment by Program Type</h4>
          <div className="space-y-4">
            {[
              { program: 'Preschool Partnership', yours: 82, peers: 78 },
              { program: 'Community Programs', yours: 71, peers: 65 },
              { program: 'Private Lessons', yours: 45, peers: 52 },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.program}</span>
                  <span className="text-white">{item.yours}% <span className="text-slate-500">vs {item.peers}%</span></span>
                </div>
                <div className="h-4 bg-slate-700 rounded overflow-hidden relative">
                  <div
                    className="absolute h-full bg-slate-500 rounded"
                    style={{ width: `${item.peers}%` }}
                  />
                  <div
                    className={`absolute h-full rounded ${item.yours > item.peers ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${item.yours}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertCard type="warning" title="Improvement Opportunity">
        <p>Your trial-to-paid conversion (34.2%) is below the peer average (38.5%). Businesses in the 75th percentile achieve 45%+ conversion by implementing automated follow-up sequences within 48 hours of trial completion.</p>
      </AlertCard>
    </div>
  );
}

function RevenueTab({ tier }: { tier: SubscriptionTier }) {
  return (
    <div className="space-y-6">
      <FilterBar />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <BenchmarkCard label="Revenue per Child" yourValue={248} peerAvg={215} percentile={68} format="currency" />
        <BenchmarkCard label="Avg Transaction" yourValue={312} peerAvg={285} percentile={62} format="currency" />
        <BenchmarkCard label="Pay-in-Full Rate" yourValue={82.5} peerAvg={78.3} percentile={65} format="percent" />
        <BenchmarkCard label="Revenue per Location" yourValue={185000} peerAvg={162000} percentile={71} format="currency" />
        <BenchmarkCard label="Revenue per Session" yourValue={2850} peerAvg={2420} percentile={74} format="currency" />
        <BenchmarkCard label="Discount Rate" yourValue={18.5} peerAvg={22.1} percentile={68} format="percent" higherIsBetter={false} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Revenue Distribution</h4>
          <div className="space-y-4">
            {[
              { source: 'Program Fees', yours: 72, peers: 68 },
              { source: 'Equipment/Merch', yours: 12, peers: 15 },
              { source: 'Registration Fees', yours: 8, peers: 10 },
              { source: 'Private Lessons', yours: 8, peers: 7 },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.source}</span>
                  <span className="text-white">{item.yours}%</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${item.yours}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Price Point Comparison</h4>
          <div className="space-y-3">
            {[
              { program: '8-Week Session', yours: '$224', peers: '$208', diff: '+$16' },
              { program: 'Monthly Rate', yours: '$95', peers: '$89', diff: '+$6' },
              { program: 'Sibling Discount', yours: '$50', peers: '$55', diff: '-$5' },
              { program: 'Registration Fee', yours: '$25', peers: '$30', diff: '-$5' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-300">{item.program}</span>
                <div className="flex items-center gap-4">
                  <span className="text-white font-medium">{item.yours}</span>
                  <span className="text-slate-500 text-sm">vs {item.peers}</span>
                  <span className={`text-sm font-medium ${item.diff.startsWith('+') ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {item.diff}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertCard type="info" title="Pricing Insight">
        <p>Your average transaction ($312) is above peer average ($285). However, your merchandise revenue (12%) is below peers (15%). Top performers generate 18-20% from merchandise. Consider bundling equipment with registration.</p>
      </AlertCard>
    </div>
  );
}

function OperationsTab({ tier }: { tier: SubscriptionTier }) {
  return (
    <div className="space-y-6">
      <FilterBar />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <BenchmarkCard label="Class Fill Rate" yourValue={68.5} peerAvg={72.1} percentile={42} format="percent" />
        <BenchmarkCard label="Coach Utilization" yourValue={78.2} peerAvg={74.5} percentile={58} format="percent" />
        <BenchmarkCard label="Cancellation Rate" yourValue={4.2} peerAvg={5.8} percentile={72} format="percent" higherIsBetter={false} />
        <BenchmarkCard label="Avg Class Size" yourValue={9.2} peerAvg={8.8} percentile={55} format="number" />
        <BenchmarkCard label="Weekend Fill Rate" yourValue={82.5} peerAvg={78.3} percentile={62} format="percent" />
        <BenchmarkCard label="Weekday Fill Rate" yourValue={54.3} peerAvg={61.2} percentile={35} format="percent" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Fill Rate by Time Slot
          </h4>
          <div className="space-y-3">
            {[
              { slot: 'Saturday 9-11 AM', yours: 92, peers: 88 },
              { slot: 'Saturday 11-1 PM', yours: 78, peers: 75 },
              { slot: 'Sunday 9-11 AM', yours: 85, peers: 82 },
              { slot: 'Weekday 4-6 PM', yours: 58, peers: 65 },
              { slot: 'Weekday 9-11 AM', yours: 45, peers: 52 },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.slot}</span>
                  <span className={`font-medium ${item.yours >= item.peers ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {item.yours}% <span className="text-slate-500 font-normal">vs {item.peers}%</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.yours >= item.peers ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${item.yours}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            Performance by Location Type
          </h4>
          <div className="space-y-3">
            {[
              { type: 'Preschool Partners', yours: 85, peers: 82, status: 'above' },
              { type: 'Community Parks', yours: 62, peers: 68, status: 'below' },
              { type: 'Recreation Centers', yours: 71, peers: 70, status: 'above' },
              { type: 'Private Venues', yours: 58, peers: 55, status: 'above' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{item.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{item.yours}%</span>
                  {item.status === 'above' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-amber-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertCard type="warning" title="Schedule Optimization Opportunity">
        <p>Your weekday fill rate (54.3%) is significantly below peer average (61.2%). Top performers in your peer group achieve 70%+ weekday fill by offering "working parent" time slots (4:30-6:30 PM) and employer partnership programs.</p>
      </AlertCard>
    </div>
  );
}

function RecommendationsTab({ tier }: { tier: SubscriptionTier }) {
  if (tier !== 'intelligence') {
    return (
      <LockedFeature tier="intelligence">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">AI-Powered Recommendations</h3>
            <p className="text-amber-100">
              Get personalized recommendations based on your benchmarking data, powered by Gemini 3 Flash
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <RecommendationCard
              priority="high"
              title="Sample Recommendation"
              description="This is a preview of AI recommendations"
              opportunity="$XX,XXX/year"
              actions={['Action 1', 'Action 2']}
            />
          </div>
        </div>
      </LockedFeature>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-2 right-2 px-2 py-1 bg-white/20 rounded-full text-xs font-medium flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Powered by Gemini 3 Flash
        </div>
        <h3 className="text-xl font-bold mb-2">AI-Powered Recommendations</h3>
        <p className="text-amber-100">
          Personalized insights based on your benchmarking data and peer performance patterns
        </p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          AI Summary
        </h4>
        <div className="bg-slate-900/50 rounded-lg p-4 border border-cyan-500/20">
          <p className="text-slate-300 text-sm leading-relaxed">
            Based on analysis of your performance vs. 47 peer businesses, your biggest opportunity is <strong className="text-white">re-enrollment optimization</strong>.
            You're currently at the 38th percentile (62.3% rate), while top performers achieve 78%+.
            Combined with your below-average weekday fill rates, implementing the recommendations below could generate an estimated
            <strong className="text-emerald-400"> $28,400 in additional annual revenue</strong>.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <RecommendationCard
          priority="high"
          title="Improve Re-enrollment Rate"
          description="Your 62.3% re-enrollment rate is 6.2% below peer average. Families who don't re-enroll cite 'forgot to sign up' as the top reason."
          opportunity="$14,200/year"
          actions={[
            'Send automated reminders 3 weeks before season ends',
            'Offer early-bird discount for returning families',
            'Implement one-click re-enrollment with saved preferences',
            'Add Kai proactive chat during re-enrollment window'
          ]}
        />
        <RecommendationCard
          priority="high"
          title="Optimize Weekday Fill Rates"
          description="Your weekday fill rate (54.3%) is below the 61.2% peer average. This represents significant untapped capacity."
          opportunity="$8,600/year"
          actions={[
            'Add 4:30-5:30 PM slots for working parents',
            'Partner with local employers for corporate discounts',
            'Offer weekday-only pricing tier (15% discount)',
            'Promote weekday availability in abandoned cart recovery'
          ]}
        />
        <RecommendationCard
          priority="medium"
          title="Increase Sibling Enrollment"
          description="Your sibling enrollment rate (8.5%) is below peer average (11.2%). Multi-child families have higher lifetime value."
          opportunity="$3,800/year"
          actions={[
            'Prominently display sibling discount during registration',
            'Add "Register Another Child" prompt after completion',
            'Create sibling-specific email campaigns',
            'Offer cascading discounts (25% 2nd, 35% 3rd child)'
          ]}
        />
        <RecommendationCard
          priority="medium"
          title="Boost Trial Conversion"
          description="Your trial-to-paid rate (34.2%) is below the 38.5% peer average. Top performers achieve 45%+."
          opportunity="$1,800/year"
          actions={[
            'Send follow-up within 24 hours of trial class',
            'Include coach video message in follow-up',
            'Offer limited-time discount for trial participants',
            'Implement trial-specific Kai conversation flow'
          ]}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h4 className="text-white font-semibold mb-4">Total Opportunity Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-emerald-400 text-2xl font-bold">$28,400</p>
            <p className="text-slate-400 text-sm">Total Annual Opportunity</p>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <p className="text-white text-2xl font-bold">4</p>
            <p className="text-slate-400 text-sm">Recommendations</p>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <p className="text-white text-2xl font-bold">2</p>
            <p className="text-slate-400 text-sm">High Priority</p>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <p className="text-white text-2xl font-bold">38th</p>
            <p className="text-slate-400 text-sm">Lowest Percentile</p>
          </div>
        </div>
      </div>
    </div>
  );
}
