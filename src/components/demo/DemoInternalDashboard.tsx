import { useState } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Users, DollarSign,
  AlertTriangle, CheckCircle, Clock, Activity, Zap,
  CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight,
  Phone, Mail, Calendar, Target, Shield, RefreshCw,
  Building2, ChevronRight, ExternalLink, Search,
  Bell, Settings, User, LayoutDashboard
} from 'lucide-react';

type DashboardView = 'ceo' | 'ea';

interface Customer {
  id: string;
  name: string;
  tier: 'Essentials' | 'Most Popular' | 'Pro+' | 'Custom';
  mrr: number;
  registrationsThisWeek: number;
  avgRegistrations: number;
  successRate: number;
  healthScore: number;
  risk: 'high' | 'medium' | 'healthy';
  action?: string;
  paymentExpires?: string;
}

const mockCustomers: Customer[] = [
  { id: '1', name: 'Smith Academy', tier: 'Pro+', mrr: 500, registrationsThisWeek: 12, avgRegistrations: 24, successRate: 94, healthScore: 45, risk: 'high', action: 'URGENT CALL' },
  { id: '2', name: 'Johnson FC', tier: 'Most Popular', mrr: 400, registrationsThisWeek: 85, avgRegistrations: 81, successRate: 97, healthScore: 95, risk: 'healthy' },
  { id: '3', name: 'Williams League', tier: 'Pro+', mrr: 800, registrationsThisWeek: 134, avgRegistrations: 149, successRate: 91, healthScore: 75, risk: 'medium', action: 'Monitor' },
  { id: '4', name: 'Davis Club', tier: 'Most Popular', mrr: 350, registrationsThisWeek: 45, avgRegistrations: 48, successRate: 96, healthScore: 88, risk: 'healthy' },
  { id: '5', name: 'Martinez Sports', tier: 'Essentials', mrr: 199, registrationsThisWeek: 0, avgRegistrations: 15, successRate: 95, healthScore: 35, risk: 'high', action: 'Check-in' },
  { id: '6', name: 'Thompson Academy', tier: 'Pro+', mrr: 650, registrationsThisWeek: 92, avgRegistrations: 95, successRate: 98, healthScore: 92, risk: 'healthy', paymentExpires: '14 days' },
  { id: '7', name: 'Garcia United', tier: 'Most Popular', mrr: 400, registrationsThisWeek: 58, avgRegistrations: 72, successRate: 93, healthScore: 68, risk: 'medium', action: 'Review' },
  { id: '8', name: 'Anderson Youth', tier: 'Essentials', mrr: 199, registrationsThisWeek: 22, avgRegistrations: 20, successRate: 96, healthScore: 90, risk: 'healthy' },
];

function MetricCard({ label, value, change, changeType, sublabel, icon: Icon }: {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  sublabel?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-slate-400 text-sm">{label}</p>
        {Icon && <Icon className="w-5 h-5 text-slate-500" />}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <div className="flex items-center gap-2">
        {change && (
          <span className={`flex items-center gap-1 text-sm ${
            changeType === 'positive' ? 'text-emerald-400' :
            changeType === 'negative' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {changeType === 'positive' ? <ArrowUpRight className="w-3 h-3" /> :
             changeType === 'negative' ? <ArrowDownRight className="w-3 h-3" /> : null}
            {change}
          </span>
        )}
        {sublabel && <span className="text-slate-500 text-xs">{sublabel}</span>}
      </div>
    </div>
  );
}

function HealthBadge({ risk }: { risk: 'high' | 'medium' | 'healthy' }) {
  const styles = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    healthy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  const labels = { high: 'HIGH RISK', medium: 'MEDIUM', healthy: 'HEALTHY' };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[risk]}`}>
      {labels[risk]}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    'Essentials': 'bg-slate-600 text-slate-200',
    'Most Popular': 'bg-blue-600 text-blue-100',
    'Pro+': 'bg-cyan-600 text-cyan-100',
    'Custom': 'bg-amber-600 text-amber-100',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[tier] || 'bg-slate-600 text-slate-200'}`}>
      {tier}
    </span>
  );
}

function PriorityItem({ priority, customer, issue, mrr, action }: {
  priority: 'urgent' | 'important' | 'monitor';
  customer: string;
  issue: string;
  mrr: number;
  action: string;
}) {
  const styles = {
    urgent: { bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-500' },
    important: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-500' },
    monitor: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  };

  return (
    <div className={`${styles[priority].bg} border ${styles[priority].border} rounded-lg p-3 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${styles[priority].dot}`} />
        <div>
          <p className="text-white font-medium">{customer}</p>
          <p className="text-slate-400 text-sm">{issue}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-slate-300 text-sm font-medium">${mrr}/mo MRR</p>
        <p className="text-cyan-400 text-xs">{action}</p>
      </div>
    </div>
  );
}

function SystemHealthIndicator({ status }: { status: 'green' | 'yellow' | 'red' }) {
  const styles = {
    green: { bg: 'bg-emerald-500', label: 'All Systems Operational', color: 'text-emerald-400' },
    yellow: { bg: 'bg-amber-500', label: 'Minor Issues', color: 'text-amber-400' },
    red: { bg: 'bg-red-500', label: 'System Alert', color: 'text-red-400' },
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${styles[status].bg} animate-pulse`} />
      <span className={`text-sm font-medium ${styles[status].color}`}>{styles[status].label}</span>
    </div>
  );
}

function AIAgentStatus() {
  const agents = [
    { name: 'KAI', status: 'operational', uptime: '99.9%' },
    { name: 'DATABOT', status: 'operational', uptime: '99.8%' },
    { name: 'PAYPAL', status: 'operational', uptime: '99.9%' },
    { name: 'COMMBOT', status: 'operational', uptime: '99.7%' },
    { name: 'SOLVO', status: 'operational', uptime: '99.9%' },
  ];

  return (
    <div className="grid grid-cols-5 gap-2">
      {agents.map((agent) => (
        <div key={agent.name} className="bg-slate-900/50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-white text-xs font-medium">{agent.name}</span>
          </div>
          <span className="text-slate-500 text-[10px]">{agent.uptime}</span>
        </div>
      ))}
    </div>
  );
}

export function DemoInternalDashboard() {
  const [activeView, setActiveView] = useState<DashboardView>('ceo');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('ceo')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'ceo'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  CEO View
                </button>
                <button
                  onClick={() => setActiveView('ea')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'ea'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  EA View
                </button>
              </div>
              <SystemHealthIndicator status="green" />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 w-64"
                />
              </div>
              <button className="p-2 text-slate-400 hover:text-white relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeView === 'ceo' ? <CEOView /> : <EAView customers={mockCustomers} />}
      </main>

      <footer className="border-t border-slate-700 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            <span className="text-cyan-400">kAIro Pro LLC</span> Internal Operations Dashboard
          </p>
          <p className="text-slate-600 text-xs mt-1">Transaction-Based Health Metrics - Updated Real-time</p>
        </div>
      </footer>
    </div>
  );
}

function CEOView() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Good morning, CEO</h2>
            <p className="text-blue-100">Here's your business at a glance - January 5, 2026</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-sm">Last updated</p>
            <p className="text-white font-medium">2 minutes ago</p>
          </div>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          Revenue & Growth Scorecard
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard label="MRR" value="$47,850" change="+8.2%" changeType="positive" sublabel="from last month" icon={TrendingUp} />
          <MetricCard label="ARR" value="$574,200" change="+12.4%" changeType="positive" sublabel="YoY growth" icon={BarChart3} />
          <MetricCard label="Active Customers" value="127" change="+5" changeType="positive" sublabel="processing transactions" icon={Users} />
          <MetricCard label="GPV This Month" value="$2.4M" change="+15.3%" changeType="positive" sublabel="gross payment volume" icon={CreditCard} />
          <MetricCard label="Take Rate" value="2.1%" change="+0.1%" changeType="positive" sublabel="of GPV" icon={Target} />
          <MetricCard label="ARPA" value="$377" change="+$12" changeType="positive" sublabel="per account" icon={DollarSign} />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          Platform Performance - The kAIro Advantage
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h4 className="text-white font-medium mb-4">Transaction Success Metrics</h4>
            <div className="space-y-4">
              {[
                { label: 'Registration Completion', value: 96.2, benchmark: '50-60%', diff: '+36.2%' },
                { label: 'Cart Abandonment', value: 3.8, benchmark: '40-50%', diff: '-41.2%', inverse: true },
                { label: 'Avg Registration Time', value: '2:48', benchmark: '15-20 min', diff: '-85%' },
                { label: 'Payment Success Rate', value: 97.8, benchmark: '~90%', diff: '+7.8%' },
              ].map((metric, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-300">{metric.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">
                      {typeof metric.value === 'number' ? `${metric.value}%` : metric.value}
                    </span>
                    <span className="text-slate-500 text-sm">vs {metric.benchmark}</span>
                    <span className="text-emerald-400 text-sm font-medium">{metric.diff}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total Registrations Processed</span>
                <span className="text-white font-bold">847,293</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h4 className="text-white font-medium mb-4">Platform Reliability</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Platform Uptime</span>
                <span className="text-emerald-400 font-bold">99.97%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Avg Processing Speed</span>
                <span className="text-white font-bold">142ms</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-sm mb-3">AI Agents Status</p>
              <AIAgentStatus />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-400" />
          Customer Health Overview
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center">
            <p className="text-red-400 text-3xl font-bold">3</p>
            <p className="text-slate-400 text-sm mt-1">High Risk</p>
            <p className="text-red-400 text-xs mt-2">$1,049/mo at risk</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-center">
            <p className="text-amber-400 text-3xl font-bold">8</p>
            <p className="text-slate-400 text-sm mt-1">Medium Risk</p>
            <p className="text-amber-400 text-xs mt-2">Needs proactive outreach</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center">
            <p className="text-emerald-400 text-3xl font-bold">116</p>
            <p className="text-slate-400 text-sm mt-1">Healthy</p>
            <p className="text-emerald-400 text-xs mt-2">Processing normally</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 text-center">
            <p className="text-white text-3xl font-bold">127</p>
            <p className="text-slate-400 text-sm mt-1">Total Active</p>
            <p className="text-cyan-400 text-xs mt-2">+5 this month</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Investor Metrics (PE/VC Ready)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Net Revenue Retention" value="124%" change="+4%" changeType="positive" sublabel="target 120%+" />
          <MetricCard label="LTV:CAC Ratio" value="5.2:1" change="+0.3" changeType="positive" sublabel="target 3:1+" />
          <MetricCard label="Gross Margin" value="82%" change="+2%" changeType="positive" sublabel="target 75-90%" />
          <MetricCard label="Customer Concentration" value="4.8%" sublabel="largest customer" changeType="positive" />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          L10 Weekly Snapshot
        </h3>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
            <div>
              <p className="text-slate-400 text-xs uppercase mb-1">MRR</p>
              <p className="text-white text-lg font-bold">$47,850</p>
              <p className="text-emerald-400 text-xs">+8.2% wow</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase mb-1">Active Processing</p>
              <p className="text-white text-lg font-bold">127</p>
              <p className="text-emerald-400 text-xs">+5 this week</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase mb-1">Registrations</p>
              <p className="text-white text-lg font-bold">3,847</p>
              <p className="text-emerald-400 text-xs">+12% wow</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase mb-1">GPV</p>
              <p className="text-white text-lg font-bold">$612K</p>
              <p className="text-emerald-400 text-xs">+15% wow</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase mb-1">At-Risk</p>
              <p className="text-amber-400 text-lg font-bold">3</p>
              <p className="text-slate-500 text-xs">by volume decline</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase mb-1">Success Rate</p>
              <p className="text-white text-lg font-bold">96.2%</p>
              <p className="text-emerald-400 text-xs">+0.4% wow</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase mb-1">System Health</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <div className="w-4 h-4 rounded-full bg-emerald-500" />
                <span className="text-emerald-400 font-medium">Green</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function EAView({ customers }: { customers: Customer[] }) {
  const [activeTab, setActiveTab] = useState<'priorities' | 'customers' | 'transactions' | 'revenue' | 'expansion'>('priorities');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">Operational Dashboard</h2>
        <p className="text-amber-100">What needs attention RIGHT NOW? - January 5, 2026</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'priorities', label: 'Priority Actions', icon: AlertTriangle },
          { id: 'customers', label: 'Customer Health', icon: Users },
          { id: 'transactions', label: 'Transactions', icon: Activity },
          { id: 'revenue', label: 'Revenue Protection', icon: Shield },
          { id: 'expansion', label: 'Expansion', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600/20 text-cyan-400'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'priorities' && <PrioritiesTab />}
      {activeTab === 'customers' && <CustomersTab customers={customers} />}
      {activeTab === 'transactions' && <TransactionsTab />}
      {activeTab === 'revenue' && <RevenueProtectionTab />}
      {activeTab === 'expansion' && <ExpansionTab />}
    </div>
  );
}

function PrioritiesTab() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          URGENT - Do Now
        </h3>
        <div className="space-y-3">
          <PriorityItem priority="urgent" customer="Smith Academy" issue="Registration volume down 50% vs last month" mrr={500} action="URGENT CALL" />
          <PriorityItem priority="urgent" customer="Johnson FC" issue="Payment expires in 3 days" mrr={400} action="Update Payment" />
          <PriorityItem priority="urgent" customer="Williams League" issue="3 failed parent transactions today" mrr={800} action="Check Integration" />
          <PriorityItem priority="urgent" customer="Davis Club" issue="Requested data export yesterday" mrr={350} action="Retention Call" />
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          IMPORTANT - Do Today
        </h3>
        <div className="space-y-3">
          <PriorityItem priority="important" customer="Martinez Sports" issue="No registrations this week (season starts in 2 weeks?)" mrr={199} action="Check-in" />
          <PriorityItem priority="important" customer="Thompson Academy" issue="Credit card expires in 14 days" mrr={650} action="Update Payment" />
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <div>
                <p className="text-white font-medium">5 customers below expected registration volume</p>
                <p className="text-slate-400 text-sm">Combined MRR: $1,845</p>
              </div>
            </div>
            <button className="mt-2 text-cyan-400 text-sm flex items-center gap-1 hover:underline">
              View bulk check-in list <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          MONITOR - As Time Allows
        </h3>
        <div className="space-y-3">
          <PriorityItem priority="monitor" customer="New Feature Release" issue="Send adoption tips to Pro+ customers (12 recipients)" mrr={0} action="Send Campaign" />
          <PriorityItem priority="monitor" customer="3 customers" issue="Slightly elevated cart abandonment (8-12%)" mrr={0} action="Review UX" />
          <PriorityItem priority="monitor" customer="Seasonal Reminder" issue="Baseball registration season starting - prep customers" mrr={0} action="Send Tips" />
        </div>
      </div>
    </div>
  );
}

function CustomersTab({ customers }: { customers: Customer[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-white font-semibold">Customer Health Detail</h3>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">{customers.length} customers</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-400 text-xs uppercase">
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Tier</th>
                <th className="text-right py-3 px-4">MRR</th>
                <th className="text-right py-3 px-4">This Week</th>
                <th className="text-right py-3 px-4">vs. Avg</th>
                <th className="text-right py-3 px-4">Success</th>
                <th className="text-center py-3 px-4">Health</th>
                <th className="text-left py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const volumeChange = ((customer.registrationsThisWeek - customer.avgRegistrations) / customer.avgRegistrations * 100).toFixed(0);
                const isDown = customer.registrationsThisWeek < customer.avgRegistrations;

                return (
                  <tr key={customer.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <span className="text-white font-medium">{customer.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <TierBadge tier={customer.tier} />
                    </td>
                    <td className="py-3 px-4 text-right text-white">${customer.mrr}</td>
                    <td className="py-3 px-4 text-right text-white">{customer.registrationsThisWeek}</td>
                    <td className={`py-3 px-4 text-right font-medium ${isDown ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isDown ? '' : '+'}{volumeChange}%
                    </td>
                    <td className="py-3 px-4 text-right text-white">{customer.successRate}%</td>
                    <td className="py-3 px-4 text-center">
                      <HealthBadge risk={customer.risk} />
                    </td>
                    <td className="py-3 px-4">
                      {customer.action ? (
                        <button className="text-cyan-400 text-sm hover:underline flex items-center gap-1">
                          {customer.action}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-slate-500 text-sm">None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Health Score Breakdown</h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-400 mb-1">Registration Volume</p>
            <p className="text-white">40% weight</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-400 mb-1">Transaction Success</p>
            <p className="text-white">25% weight</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-400 mb-1">Payment Status</p>
            <p className="text-white">20% weight</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-400 mb-1">Feature Adoption</p>
            <p className="text-white">15% weight</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionsTab() {
  const liveTransactions = [
    { time: '2:34 PM', customer: 'Johnson FC', parent: 'Sarah M.', status: 'completed', amount: '$224' },
    { time: '2:33 PM', customer: 'Williams League', parent: 'Mike T.', status: 'completed', amount: '$199' },
    { time: '2:32 PM', customer: 'Davis Club', parent: 'Jennifer L.', status: 'failed', amount: '$249' },
    { time: '2:31 PM', customer: 'Garcia United', parent: 'Carlos R.', status: 'completed', amount: '$175' },
    { time: '2:30 PM', customer: 'Thompson Academy', parent: 'Amanda K.', status: 'completed', amount: '$299' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard label="Transactions Today" value="847" change="+12%" changeType="positive" />
        <MetricCard label="Success Rate" value="97.2%" change="+0.3%" changeType="positive" />
        <MetricCard label="Failed Today" value="24" change="-8" changeType="positive" />
        <MetricCard label="Avg Processing" value="142ms" sublabel="response time" />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Live Registration Feed
        </h3>
        <div className="space-y-2">
          {liveTransactions.map((tx, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-slate-500 text-sm">{tx.time}</span>
                <span className="text-white font-medium">{tx.customer}</span>
                <span className="text-slate-400">{tx.parent}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white">{tx.amount}</span>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  tx.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Failed Transactions Requiring Attention
        </h3>
        <div className="space-y-2">
          {[
            { customer: 'Williams League', count: 3, issue: 'API timeout', time: 'Last 2 hours' },
            { customer: 'Martinez Sports', count: 2, issue: 'Invalid card', time: 'Today' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div>
                <p className="text-white font-medium">{item.customer}</p>
                <p className="text-slate-400 text-sm">{item.count} failures - {item.issue}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm">{item.time}</p>
                <button className="text-cyan-400 text-sm hover:underline">Investigate</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RevenueProtectionTab() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">Expiring in 7 Days</span>
          </div>
          <p className="text-3xl font-bold text-white">4</p>
          <p className="text-slate-400 text-sm">$1,850 MRR at risk</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-medium">Expiring in 30 Days</span>
          </div>
          <p className="text-3xl font-bold text-white">12</p>
          <p className="text-slate-400 text-sm">$4,200 MRR at risk</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-5 h-5 text-slate-400" />
            <span className="text-slate-400 font-medium">Failed Charges</span>
          </div>
          <p className="text-3xl font-bold text-white">2</p>
          <p className="text-slate-400 text-sm">Retry scheduled</p>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Payment Method Expiration Calendar</h3>
        <div className="space-y-2">
          {[
            { customer: 'Johnson FC', expires: 'Jan 8, 2026', mrr: 400, days: 3 },
            { customer: 'Anderson Youth', expires: 'Jan 10, 2026', mrr: 199, days: 5 },
            { customer: 'Thompson Academy', expires: 'Jan 19, 2026', mrr: 650, days: 14 },
            { customer: 'Garcia United', expires: 'Jan 25, 2026', mrr: 400, days: 20 },
          ].map((item, idx) => (
            <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${
              item.days <= 7 ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-900/50'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  item.days <= 7 ? 'bg-red-500/20' : 'bg-slate-700'
                }`}>
                  <CreditCard className={`w-5 h-5 ${item.days <= 7 ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">{item.customer}</p>
                  <p className="text-slate-400 text-sm">Expires {item.expires}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">${item.mrr}/mo</p>
                <p className={`text-sm ${item.days <= 7 ? 'text-red-400' : 'text-slate-500'}`}>
                  {item.days} days
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Volume Below Seasonal Norm</h3>
        <div className="space-y-2">
          {[
            { customer: 'Smith Academy', current: 12, expected: 24, diff: -50 },
            { customer: 'Martinez Sports', current: 0, expected: 15, diff: -100 },
            { customer: 'Garcia United', current: 58, expected: 72, diff: -19 },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div>
                <p className="text-white font-medium">{item.customer}</p>
                <p className="text-slate-400 text-sm">{item.current} registrations (expected ~{item.expected})</p>
              </div>
              <span className="text-red-400 font-bold">{item.diff}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpansionTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Expansion Opportunities</h3>
        <p className="text-emerald-100">Data-driven upsell triggers based on actual usage patterns</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Approaching Plan Limits
          </h4>
          <div className="space-y-3">
            {[
              { customer: 'Johnson FC', usage: 95, limit: 100, tier: 'Most Popular', upgrade: 'Pro+' },
              { customer: 'Davis Club', usage: 88, limit: 100, tier: 'Most Popular', upgrade: 'Pro+' },
            ].map((item, idx) => (
              <div key={idx} className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{item.customer}</span>
                  <span className="text-emerald-400 text-sm">{item.usage}% of limit</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.usage}%` }} />
                </div>
                <p className="text-slate-400 text-sm">
                  Currently on {item.tier} - Upgrade to {item.upgrade}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            Multi-Location Opportunities
          </h4>
          <div className="space-y-3">
            {[
              { customer: 'Smith Academy', locations: 3, current: 'Pro+', need: 'Manual workarounds detected' },
              { customer: 'Williams League', locations: 2, current: 'Most Popular', need: 'Requested location support' },
            ].map((item, idx) => (
              <div key={idx} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{item.customer}</span>
                  <span className="text-blue-400 text-sm">{item.locations} locations</span>
                </div>
                <p className="text-slate-400 text-sm">{item.need}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          High Satisfaction - Ready for Premium
        </h4>
        <div className="space-y-3">
          {[
            { customer: 'Thompson Academy', nps: 9.5, completionRate: 98.2, suggestion: 'Add Premium AI features' },
            { customer: 'Anderson Youth', nps: 9.2, completionRate: 97.8, suggestion: 'Upgrade to Pro+ tier' },
            { customer: 'Garcia United', nps: 8.8, completionRate: 96.5, suggestion: 'Add Marketing module' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-emerald-400 text-lg font-bold">{item.nps}</p>
                  <p className="text-slate-500 text-xs">NPS</p>
                </div>
                <div>
                  <p className="text-white font-medium">{item.customer}</p>
                  <p className="text-slate-400 text-sm">{item.completionRate}% completion rate</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-cyan-400 text-sm">{item.suggestion}</p>
                <button className="text-slate-400 text-xs hover:text-white flex items-center gap-1 mt-1">
                  Contact <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
