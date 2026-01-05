import { useState } from 'react';
import {
  BarChart3, Users, Calendar, Zap, TrendingUp, MapPin,
  CreditCard, Clock, Target, AlertTriangle, CheckCircle,
  Info, DollarSign, Building2, Percent, MessageSquare, Shield, RefreshCw
} from 'lucide-react';

type TabId = 'overview' | 'nbc' | 'configio' | 'demographics' | 'payments' | 'scheduling' | 'capacity' | 'insights' | 'churn' | 'proactive';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'nbc', label: 'NBC Analysis', icon: <Users className="w-4 h-4" /> },
  { id: 'configio', label: 'Configio Data', icon: <Building2 className="w-4 h-4" /> },
  { id: 'demographics', label: 'Demographics', icon: <Users className="w-4 h-4" /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'scheduling', label: 'Scheduling', icon: <Calendar className="w-4 h-4" /> },
  { id: 'capacity', label: 'Capacity', icon: <Target className="w-4 h-4" /> },
  { id: 'churn', label: 'Churn Prevention', icon: <Shield className="w-4 h-4" /> },
  { id: 'proactive', label: 'Proactive Chat', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'insights', label: 'Kairo Insights', icon: <Zap className="w-4 h-4" /> },
];

function StatCard({ label, value, subtitle, accent = false }: { label: string; value: string; subtitle: string; accent?: boolean }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${accent ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`} />
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-slate-500 text-xs mt-1">{subtitle}</p>
    </div>
  );
}

function ProgressBar({ label, value, max, color = 'blue' }: { label: string; value: number; max: number; color?: string }) {
  const percentage = (value / max) * 100;
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    cyan: 'bg-cyan-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function InsightBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-3">
      <h4 className="text-cyan-400 font-medium mb-2">{title}</h4>
      <p className="text-slate-400 text-sm">{children}</p>
    </div>
  );
}

function AlertCard({ type, title, children }: { type: 'info' | 'success' | 'warning' | 'danger'; title: string; children: React.ReactNode }) {
  const styles = {
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500', icon: <Info className="w-5 h-5 text-blue-400" /> },
    success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500', icon: <CheckCircle className="w-5 h-5 text-emerald-400" /> },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500', icon: <AlertTriangle className="w-5 h-5 text-amber-400" /> },
    danger: { bg: 'bg-red-500/10', border: 'border-red-500', icon: <AlertTriangle className="w-5 h-5 text-red-400" /> },
  };

  return (
    <div className={`${styles[type].bg} border-l-4 ${styles[type].border} rounded-r-lg p-4 mb-4`}>
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

function MetricCard({ label, value, type }: { label: string; value: string; type: 'success' | 'warning' | 'danger' | 'info' }) {
  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    danger: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  };

  return (
    <div className={`${styles[type]} border rounded-xl p-4 text-center`}>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function DonutChart({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {data.map((item, i) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const largeArc = angle > 180 ? 1 : 0;
            const startX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
            const startY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
            currentAngle += angle;
            const endX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
            const endY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);

            return (
              <path
                key={i}
                d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                fill={colors[i % colors.length]}
                className="hover:opacity-80 transition-opacity"
              />
            );
          })}
          <circle cx="50" cy="50" r="25" fill="#1e293b" />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-slate-300">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({ data, maxValue, color = 'blue' }: { data: { label: string; value: number }[]; maxValue: number; color?: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    cyan: 'bg-cyan-500',
  };

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300">{item.label}</span>
            <span className="text-slate-400">{item.value.toLocaleString()}</span>
          </div>
          <div className="h-6 bg-slate-700 rounded overflow-hidden">
            <div
              className={`h-full ${colorClasses[color]} rounded transition-all duration-500`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function LocationRank({ rank, name, count }: { rank: number; name: string; count: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0">
      <div className="w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
        {rank}
      </div>
      <span className="flex-1 text-slate-300 text-sm">{name}</span>
      <span className="text-slate-500 text-sm">{count}</span>
    </div>
  );
}

export function DemoDataInsights() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4">
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
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'nbc' && <NBCTab />}
        {activeTab === 'configio' && <ConfigioTab />}
        {activeTab === 'demographics' && <DemographicsTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'scheduling' && <SchedulingTab />}
        {activeTab === 'capacity' && <CapacityTab />}
        {activeTab === 'churn' && <ChurnTab />}
        {activeTab === 'proactive' && <ProactiveTab />}
        {activeTab === 'insights' && <InsightsTab />}
      </main>

      <footer className="border-t border-slate-700 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            Powered by <span className="text-cyan-400">Kairo Pro</span> & <span className="text-cyan-400">RocketHub</span> - Combined Analysis: 7,594 Records
          </p>
          <p className="text-slate-600 text-xs mt-1">NBC Sports Engine (661) + Configio (6,933) - December 2025</p>
        </div>
      </footer>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Combined Data Intelligence</h3>
        <p className="text-blue-100">
          Analysis of 7,594 records across two major platforms: NBC Sports Engine (661 registrations) and Configio (6,933 products)
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Records" value="7,594" subtitle="Combined dataset" />
        <StatCard label="NBC Registrations" value="661" subtitle="Individual enrollments" accent />
        <StatCard label="Configio Products" value="6,933" subtitle="Class offerings" />
        <StatCard label="Combined Revenue" value="$9.8M" subtitle="In analyzed data" accent />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Key Metrics Comparison
          </h4>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-cyan-400 text-sm font-medium mb-3">NBC Sports Engine</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Avg Registration</span><span className="text-white font-semibold">$206</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Preschool Revenue</span><span className="text-white font-semibold">74.8%</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Pay in Full</span><span className="text-white font-semibold">86.4%</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Multi-Child</span><span className="text-white font-semibold">8.1%</span></div>
              </div>
            </div>
            <div>
              <p className="text-emerald-400 text-sm font-medium mb-3">Configio</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Avg Price</span><span className="text-white font-semibold">$220</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Preschool Products</span><span className="text-white font-semibold">32%</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Weekend Classes</span><span className="text-white font-semibold">76%</span></div>
                <div className="flex justify-between"><span className="text-slate-400">At Capacity</span><span className="text-white font-semibold">12%</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Critical Findings
          </h4>
          <InsightBox title="46% Registration Drop-off">
            From price acceptance to completion. This is the core problem Kairo solves.
          </InsightBox>
          <InsightBox title="Preschool = 74.8% of NBC Revenue">
            B2B preschool partnerships are far more valuable than community programs.
          </InsightBox>
          <InsightBox title="92.3% Register on Weekdays">
            Parents register during work hours on mobile, not at home on weekends.
          </InsightBox>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-bold mb-3">Platform Comparison Insight</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="font-semibold mb-1">NBC Advantage</p>
            <p className="text-emerald-100 text-sm">Individual enrollment tracking, detailed demographics</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="font-semibold mb-1">Configio Advantage</p>
            <p className="text-emerald-100 text-sm">Product hierarchy, regional organization, capacity tracking</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="font-semibold mb-1">Both Lack</p>
            <p className="text-emerald-100 text-sm">AI guidance, mobile optimization, progress saving, alternative suggestions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NBCTab() {
  const programData = [
    { label: 'Classic', value: 411 },
    { label: 'Mini', value: 145 },
    { label: 'Other', value: 58 },
    { label: 'Premier', value: 47 },
  ];

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm">
        <BarChart3 className="w-4 h-4" />
        Data Source: NBC Sports Engine - 661 Registrations - Soccer Shots OC
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value="$136,166" subtitle="661 registrations" accent />
        <StatCard label="Avg per Registration" value="$206" subtitle="Median: $224" accent />
        <StatCard label="Discounts Applied" value="$6,081" subtitle="23.8% of registrations" accent />
        <StatCard label="Unique Venues" value="66" subtitle="25 instructors" accent />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Revenue by Location Type</h4>
          <DonutChart
            data={[
              { label: 'Preschool Partnership (74.8%)', value: 74.8 },
              { label: 'Community Program (25.2%)', value: 25.2 },
            ]}
            colors={['#10b981', '#06b6d4']}
          />
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Program Distribution</h4>
          <HorizontalBarChart data={programData} maxValue={450} color="cyan" />
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-400" />
          Top NBC Venues
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <LocationRank rank={1} name="Beacon Park School" count="37 registrations" />
            <LocationRank rank={2} name="Milestones Montessori Irvine" count="34 registrations" />
            <LocationRank rank={3} name="Piper Preschool" count="30 registrations" />
          </div>
          <div>
            <LocationRank rank={4} name="Bella Montessori" count="29 registrations" />
            <LocationRank rank={5} name="Sendero Field" count="24 registrations" />
            <LocationRank rank={6} name="LiMai Montessori" count="22 registrations" />
          </div>
        </div>
      </div>

      <AlertCard type="success" title="Montessori Dominance">
        <p>Montessori schools appear in 4 of the top 6 venues. This suggests a strong Montessori-specific marketing opportunity. Consider dedicated Montessori partnership messaging and portal features.</p>
      </AlertCard>
    </div>
  );
}

function ConfigioTab() {
  const regionData = [
    { label: 'OC South', value: 3707533 },
    { label: 'OC Central', value: 3216672 },
    { label: 'OC North', value: 1560341 },
    { label: 'OC West', value: 1153332 },
  ];

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm">
        <BarChart3 className="w-4 h-4" />
        Data Source: Configio - 6,933 Products - Soccer Shots OC
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Products" value="6,933" subtitle="Active: 3,880" />
        <StatCard label="Total Revenue" value="$9.66M" subtitle="In dataset" />
        <StatCard label="Locations" value="175+" subtitle="16 cities" />
        <StatCard label="4 Regions" value="OC" subtitle="Central, South, North, West" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Product Categories</h4>
          <DonutChart
            data={[
              { label: 'Preschool', value: 2214 },
              { label: 'Mini - Public', value: 1160 },
              { label: 'Classic - Public', value: 1148 },
              { label: 'Premier', value: 488 },
              { label: 'Parks', value: 403 },
              { label: 'Other', value: 1520 },
            ]}
            colors={['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6']}
          />
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Revenue by Region</h4>
          <div className="space-y-4">
            {regionData.map((region, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{region.label}</span>
                  <span className="text-slate-400">${(region.value / 1000000).toFixed(1)}M</span>
                </div>
                <div className="h-6 bg-slate-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded"
                    style={{ width: `${(region.value / 4000000) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Price Trends 2022-2025
        </h4>
        <div className="flex items-end justify-between h-40 px-4">
          {[
            { year: '2022', price: 199.91 },
            { year: '2023', price: 219.65 },
            { year: '2024', price: 244.71 },
            { year: '2025', price: 288.12 },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className="w-16 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t"
                style={{ height: `${((item.price - 180) / 120) * 100}%` }}
              />
              <div className="text-center">
                <p className="text-white font-semibold">${item.price.toFixed(0)}</p>
                <p className="text-slate-500 text-sm">{item.year}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AlertCard type="warning" title="18% Price Increase in 2025">
        <p>Average price jumped from $245 (2024) to $288 (2025). This validates the need for prominent payment plan display. "$37/month" is more palatable than "$299 total".</p>
      </AlertCard>
    </div>
  );
}

function DemographicsTab() {
  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm">
        <Users className="w-4 h-4" />
        Data Source: NBC Sports Engine - 661 Registrations
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Average Age" value="3.9 yrs" subtitle="47.3 months" accent />
        <StatCard label="Age Range" value="1-10.5" subtitle="years old" accent />
        <StatCard label="Male" value="64.3%" subtitle="425 children" accent />
        <StatCard label="Female" value="34.9%" subtitle="231 children" accent />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Age Distribution</h4>
          <HorizontalBarChart
            data={[
              { label: '2-3 yrs', value: 116 },
              { label: '3-4 yrs', value: 276 },
              { label: '4-5 yrs', value: 155 },
              { label: '5-6 yrs', value: 78 },
              { label: '6+ yrs', value: 36 },
            ]}
            maxValue={300}
            color="green"
          />
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Shirt Size Distribution</h4>
          <DonutChart
            data={[
              { label: 'XS (4T-5T) 56%', value: 333 },
              { label: 'XXS (2T-3T) 28%', value: 163 },
              { label: 'S (Youth 6-8) 14%', value: 81 },
              { label: 'M+ 2%', value: 15 },
            ]}
            colors={['#6366f1', '#06b6d4', '#f59e0b', '#ec4899']}
          />
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Multi-Child Families
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-3 px-4">Family Type</th>
                <th className="text-left py-3 px-4">Count</th>
                <th className="text-left py-3 px-4">Percentage</th>
                <th className="text-left py-3 px-4">Kairo Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 px-4 text-slate-300">Single-child registration</td>
                <td className="py-3 px-4 text-white">559</td>
                <td className="py-3 px-4"><span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">91.9%</span></td>
                <td className="py-3 px-4 text-slate-400">Standard flow</td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 px-4 text-slate-300">2 children</td>
                <td className="py-3 px-4 text-white">46</td>
                <td className="py-3 px-4"><span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">7.6%</span></td>
                <td className="py-3 px-4 text-slate-400">Auto-apply $50-60 sibling discount</td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 px-4 text-slate-300">3 children</td>
                <td className="py-3 px-4 text-white">2</td>
                <td className="py-3 px-4"><span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">0.3%</span></td>
                <td className="py-3 px-4 text-slate-400">Cascade discounts</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300">5 children</td>
                <td className="py-3 px-4 text-white">1</td>
                <td className="py-3 px-4"><span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">0.2%</span></td>
                <td className="py-3 px-4 text-slate-400">Bulk roster upload</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <AlertCard type="info" title="Smart Defaults from Demographics">
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Age to Program:</strong> 3 years auto-suggests "Classic"</li>
          <li><strong>Age to Shirt Size:</strong> 3 years defaults to XXS (2T-3T)</li>
          <li><strong>DOB to Age:</strong> Calculate automatically, never ask parent to enter age</li>
          <li><strong>Zip to Venues:</strong> Show nearest 3 locations with availability</li>
        </ul>
      </AlertCard>
    </div>
  );
}

function PaymentsTab() {
  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm">
        <CreditCard className="w-4 h-4" />
        Combined Data: NBC + Configio Analysis
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Pay in Full" value="86.4%" type="success" />
        <MetricCard label="Payment Plans" value="8%" type="warning" />
        <MetricCard label="With Discount" value="23.8%" type="info" />
        <MetricCard label="Avg Discount" value="$38.73" type="danger" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Payment Plan Types (NBC)</h4>
          <HorizontalBarChart
            data={[
              { label: 'Pay in Full', value: 500 },
              { label: 'Payment Plan', value: 53 },
              { label: 'Full Payment', value: 50 },
              { label: 'Payment in Full', value: 21 },
              { label: 'Annual Fee', value: 35 },
            ]}
            maxValue={550}
            color="green"
          />
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Price Distribution (Configio)</h4>
          <HorizontalBarChart
            data={[
              { label: '$0-100', value: 514 },
              { label: '$100-150', value: 275 },
              { label: '$150-200', value: 1960 },
              { label: '$200-250', value: 2696 },
              { label: '$250-300', value: 1011 },
              { label: '$300+', value: 10 },
            ]}
            maxValue={3000}
            color="cyan"
          />
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Sibling Discount Patterns
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <InsightBox title="Hornstein Family (3 children)">
            Zahra: $240 (full) - Zayda: $180 (-$60) - Emran: $222 (-$60)
          </InsightBox>
          <InsightBox title="Pho Family (2 children)">
            Emmy: $224 (full) - Alice: $210 (-$56 sibling discount)
          </InsightBox>
        </div>
      </div>

      <AlertCard type="success" title="Kairo Payment Strategy">
        <div className="grid md:grid-cols-2 gap-4 mt-2">
          <div>
            <p className="font-medium text-slate-300">Payment Plan Display:</p>
            <p>Show first: "$52/month" then "or pay $208 today"</p>
            <p className="font-medium text-slate-300 mt-2">Per-Class Breakdown:</p>
            <p>"That's just $6.50 per class!"</p>
          </div>
          <div>
            <p className="font-medium text-slate-300">Sibling Celebration:</p>
            <p>When adding 2nd child: "You're saving $56!"</p>
            <p className="font-medium text-slate-300 mt-2">Auto-Apply:</p>
            <p>$50-60 sibling discount (25% off additional child)</p>
          </div>
        </div>
      </AlertCard>
    </div>
  );
}

function SchedulingTab() {
  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm">
        <Calendar className="w-4 h-4" />
        Combined Data: NBC + Configio Analysis
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">When Parents REGISTER (NBC)</h4>
          <HorizontalBarChart
            data={[
              { label: 'Thursday', value: 146 },
              { label: 'Monday', value: 136 },
              { label: 'Wednesday', value: 123 },
              { label: 'Tuesday', value: 117 },
              { label: 'Friday', value: 88 },
              { label: 'Sunday', value: 27 },
              { label: 'Saturday', value: 24 },
            ]}
            maxValue={160}
            color="green"
          />
          <p className="text-slate-500 text-sm mt-4 text-center">92.3% register Monday-Friday during work hours</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">When CLASSES Run (Configio)</h4>
          <HorizontalBarChart
            data={[
              { label: 'Saturday', value: 1415 },
              { label: 'Sunday', value: 646 },
              { label: 'Monday', value: 146 },
              { label: 'Tuesday', value: 154 },
              { label: 'Wednesday', value: 150 },
              { label: 'Thursday', value: 142 },
              { label: 'Friday', value: 77 },
            ]}
            maxValue={1500}
            color="blue"
          />
          <p className="text-slate-500 text-sm mt-4 text-center">76% of classes are Saturday/Sunday</p>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Popular Time Slots (Configio)
        </h4>
        <div className="flex items-end justify-between h-32 px-4">
          {[
            { time: '9:00', value: 307 },
            { time: '9:45', value: 329 },
            { time: '10:30', value: 347 },
            { time: '11:20', value: 264 },
            { time: '3:00', value: 115 },
            { time: '4:30', value: 183 },
            { time: '5:15', value: 153 },
          ].map((slot, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div
                className="w-full max-w-[40px] bg-gradient-to-t from-purple-600 to-purple-400 rounded-t mx-1"
                style={{ height: `${(slot.value / 350) * 100}%` }}
              />
              <p className="text-slate-500 text-xs">{slot.time}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <AlertCard type="warning" title="Critical Insight: Registration vs Classes">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Parents register:</strong> Mon-Fri during work (92.3%)</li>
            <li><strong>Classes run:</strong> Sat-Sun mornings (76%)</li>
            <li><strong>Implication:</strong> Mobile-first is validated - parents register on phones between meetings</li>
          </ul>
        </AlertCard>

        <AlertCard type="info" title="Save Progress is Critical">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Parents have limited windows (lunch breaks)</li>
            <li>Interruptions are guaranteed</li>
            <li>Auto-save after every field</li>
            <li>Abandoned cart follow-up at 6-8 PM</li>
          </ul>
        </AlertCard>
      </div>
    </div>
  );
}

function CapacityTab() {
  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm">
        <Target className="w-4 h-4" />
        Data Source: Configio - 6,933 Products
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="At 100%+ Capacity" value="753" type="danger" />
        <MetricCard label="With Holds" value="296" type="warning" />
        <MetricCard label="Overbooked" value="90" type="info" />
        <MetricCard label="NBC Waitlist" value="0.9%" type="success" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Fill Rate by Program Level</h4>
          <div className="space-y-4">
            {[
              { label: 'Mini', fillRate: 46.7, atCapacity: 18.8 },
              { label: 'Classic', fillRate: 45.9, atCapacity: 13.8 },
              { label: 'Premier', fillRate: 28.7, atCapacity: 6.9 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-slate-400">{item.fillRate}% fill / {item.atCapacity}% full</span>
                </div>
                <div className="h-4 bg-slate-700 rounded overflow-hidden flex">
                  <div className="h-full bg-cyan-500" style={{ width: `${item.fillRate}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${item.atCapacity}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4">Fill Rate by Class Size</h4>
          <div className="space-y-4">
            {[
              { label: '8 spots', fillRate: 45.4, atCapacity: 18.0 },
              { label: '10 spots', fillRate: 62.9, atCapacity: 26.5 },
              { label: '12 spots', fillRate: 39.9, atCapacity: 10.6 },
              { label: '24 spots', fillRate: 35.2, atCapacity: 8.2 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-slate-400">{item.fillRate}% / {item.atCapacity}%</span>
                </div>
                <div className="h-4 bg-slate-700 rounded overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${item.fillRate}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${item.atCapacity}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertCard type="danger" title="Waitlist Prevention Logic">
        <div className="grid md:grid-cols-2 gap-4 mt-2">
          <div>
            <p className="font-medium text-slate-300 mb-2">When class is full, Kai suggests:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Same day, +/-45 min time slot</li>
              <li>Same time, adjacent day</li>
              <li>Same level, nearby location (&lt;5 miles)</li>
              <li>Next season early registration</li>
            </ol>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="font-medium text-slate-300 mb-2">Example:</p>
            <p className="italic text-slate-400">"Great choice! That Saturday 9:45 AM class is full, but I found a spot at 10:30 AM same day - would that work?"</p>
          </div>
        </div>
      </AlertCard>
    </div>
  );
}

function ChurnTab() {
  const atRiskFamilies = [
    { name: 'Martinez Family', children: ['Sofia (5)', 'Lucas (3)'], risk: 'high', factors: ['Missed 2 classes', 'No re-enrollment'], lastActivity: '3 weeks ago' },
    { name: 'Johnson Family', children: ['Emma (4)'], risk: 'medium', factors: ['Payment failed'], lastActivity: '1 week ago' },
    { name: 'Williams Family', children: ['Aiden (6)', 'Mia (4)'], risk: 'medium', factors: ['Low engagement', 'Season ending'], lastActivity: '5 days ago' },
    { name: 'Brown Family', children: ['Oliver (3)'], risk: 'low', factors: ['First season'], lastActivity: '2 days ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-600 to-pink-500 rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Intelligent Churn Prevention</h3>
        <p className="text-rose-100">
          AI-powered risk scoring and automated retention campaigns that learn from experience
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="At-Risk Families" value="23" subtitle="This month" accent />
        <StatCard label="Retention Rate" value="94.2%" subtitle="+2.1% vs last season" accent />
        <StatCard label="Saved Revenue" value="$8,420" subtitle="From interventions" accent />
        <StatCard label="Auto-Campaigns Sent" value="156" subtitle="This month" accent />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              At-Risk Families
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {atRiskFamilies.map((family, idx) => (
              <div key={idx} className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium">{family.name}</p>
                    <p className="text-slate-400 text-sm">{family.children.join(', ')}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    family.risk === 'high' ? 'bg-red-500/20 text-red-400' :
                    family.risk === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {family.risk.toUpperCase()} RISK
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {family.factors.map((factor, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                      {factor}
                    </span>
                  ))}
                </div>
                <p className="text-slate-500 text-xs">Last activity: {family.lastActivity}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-cyan-400" />
              Auto-Retention Campaigns
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {[
              { name: 'Re-engagement Email', trigger: 'No activity 2 weeks', sent: 45, recovered: 12, status: 'active' },
              { name: 'Season-End Reminder', trigger: 'Season ends in 2 weeks', sent: 89, recovered: 67, status: 'active' },
              { name: 'Failed Payment Follow-up', trigger: 'Payment failed', sent: 22, recovered: 18, status: 'active' },
            ].map((campaign, idx) => (
              <div key={idx} className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium">{campaign.name}</p>
                    <p className="text-slate-400 text-sm">Trigger: {campaign.trigger}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">
                    {campaign.status}
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-slate-400">Sent: <span className="text-white">{campaign.sent}</span></span>
                  <span className="text-slate-400">Recovered: <span className="text-emerald-400">{campaign.recovered}</span></span>
                  <span className="text-slate-400">Rate: <span className="text-white">{Math.round((campaign.recovered / campaign.sent) * 100)}%</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertCard type="success" title="Campaign Coordination Active">
        <p>Smart scheduling prevents over-communication. Families receive max 2 retention messages per week, and retention campaigns pause when seasonal re-enrollment campaigns are active.</p>
      </AlertCard>
    </div>
  );
}

function ProactiveTab() {
  const dropOffPoints = [
    { step: 'Child Info', dropOff: 8, total: 1000, suggestion: 'Add Kai popup for shirt size help' },
    { step: 'Session Selection', dropOff: 24, total: 920, suggestion: 'Offer alternative times if full' },
    { step: 'Payment Details', dropOff: 46, total: 896, suggestion: 'Show payment plan options prominently' },
    { step: 'Review & Confirm', dropOff: 12, total: 850, suggestion: 'Simplify summary display' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Proactive Kai Chat Intervention</h3>
        <p className="text-blue-100">
          AI analyzes drop-off patterns and recommends chat popup placement to reduce abandonment
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Interventions Triggered" value="1,234" subtitle="This month" />
        <StatCard label="Recovery Rate" value="34%" subtitle="From interventions" />
        <StatCard label="Revenue Saved" value="$24,680" subtitle="From recovered registrations" />
        <StatCard label="Drop-off Reduction" value="-18%" subtitle="Since AI enabled" />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Registration Funnel Analysis
          </h4>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {dropOffPoints.map((point, idx) => (
              <div key={idx} className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="text-white font-medium">{point.step}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${point.dropOff > 30 ? 'text-red-400' : point.dropOff > 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      -{point.dropOff}%
                    </span>
                    <p className="text-slate-500 text-xs">{point.total} users reached</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full ${point.dropOff > 30 ? 'bg-red-500' : point.dropOff > 15 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${100 - point.dropOff}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400">AI Suggestion:</span>
                  <span className="text-slate-300">{point.suggestion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Active Interventions
          </h4>
          <div className="space-y-3">
            {[
              { name: 'Payment Step Helper', trigger: 'User pauses 30+ seconds', effectiveness: '42% recovery', status: 'on' },
              { name: 'Session Alternative Finder', trigger: 'Full class selected', effectiveness: '67% recovery', status: 'on' },
              { name: 'Inactivity Prompt', trigger: 'No action for 2 minutes', effectiveness: '28% recovery', status: 'on' },
              { name: 'Form Error Assistant', trigger: 'Validation error occurs', effectiveness: '51% recovery', status: 'on' },
            ].map((intervention, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">{intervention.name}</p>
                  <p className="text-slate-500 text-xs">{intervention.trigger}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 text-sm font-medium">{intervention.effectiveness}</p>
                  <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            A/B Test Results
          </h4>
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-400 font-medium">Winner: Conversational Popup</span>
                <span className="text-emerald-400">+23% conversion</span>
              </div>
              <p className="text-slate-400 text-sm">Friendly Kai message vs. generic help button</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 font-medium">Running: Timing Test</span>
                <span className="text-amber-400">In progress</span>
              </div>
              <p className="text-slate-500 text-sm">15 sec vs. 30 sec delay before popup</p>
            </div>
          </div>
        </div>
      </div>

      <AlertCard type="info" title="AI Learning Active">
        <p>Kai continuously learns from user behavior. The system has identified that users who receive chat assistance at the payment step are 34% more likely to complete registration.</p>
      </AlertCard>
    </div>
  );
}

function InsightsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Kairo Development Recommendations</h3>
        <p className="text-blue-100">
          Actionable insights from analyzing 7,594 records across NBC Sports Engine and Configio platforms
        </p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          Waitlist Prevention Logic
        </h4>
        <pre className="bg-slate-900 rounded-lg p-4 text-emerald-400 text-sm overflow-x-auto">
{`IF class_at_capacity:
  1. Check same_day + adjacent_time (±45 min)
  2. Check same_time + adjacent_day (±1 day)
  3. Check same_level + nearby_location (within 5 miles)
  4. Check same_level + next_season
  5. If all fail → Waitlist with position + notification`}
        </pre>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <AlertCard type="info" title="Schema Enhancements">
          <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
            <li>Add <code className="bg-slate-800 px-1 rounded text-xs">region</code> to locations</li>
            <li>Add <code className="bg-slate-800 px-1 rounded text-xs">program_category</code> enum</li>
            <li>Add <code className="bg-slate-800 px-1 rounded text-xs">season</code> to sessions</li>
            <li>Add <code className="bg-slate-800 px-1 rounded text-xs">merchandise</code> table</li>
          </ul>
        </AlertCard>

        <AlertCard type="success" title="Kai AI Features">
          <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
            <li>Fill rate awareness (&gt;75% priority)</li>
            <li>Smart day alternatives</li>
            <li>Time slot suggestions</li>
            <li>Monthly price display first</li>
          </ul>
        </AlertCard>

        <AlertCard type="warning" title="Data Fields Required">
          <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
            <li>Child: Name, DOB, Gender, Shirt Size</li>
            <li>Guardian: Name, Phone, Email, Address</li>
            <li>Enrollment: Class, Plan, Discount</li>
            <li>Admin: Waitlist, Review, Instructor</li>
          </ul>
        </AlertCard>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-cyan-400 font-semibold mb-2">Mini Programs</h4>
          <p className="text-slate-400 text-sm">
            Highest fill (46.7%) and capacity hits (18.8%). <strong className="text-white">Prioritize waitlist prevention here.</strong>
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-emerald-400 font-semibold mb-2">Classic Programs</h4>
          <p className="text-slate-400 text-sm">
            Highest volume (62.2%). Most revenue ($3.43M). <strong className="text-white">Core business engine.</strong>
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h4 className="text-amber-400 font-semibold mb-2">Preschool Partners</h4>
          <p className="text-slate-400 text-sm">
            74.8% of NBC revenue. <strong className="text-white">Build dedicated partner portal in Phase 2.</strong>
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-bold mb-3">Business Opportunity Summary</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="font-semibold mb-1">753 classes hit capacity</p>
            <p className="text-emerald-100 text-sm">Each = lost revenue. Kai captures with smart alternatives.</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="font-semibold mb-1">46% registration abandonment</p>
            <p className="text-emerald-100 text-sm">Kairo's 3-min flow vs legacy 18-min forms.</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="font-semibold mb-1">Only 8% use payment plans</p>
            <p className="text-emerald-100 text-sm">Show monthly first = increase conversions.</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="font-semibold mb-1">92% register on mobile</p>
            <p className="text-emerald-100 text-sm">Mobile-first, one-handed design validated.</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Test Scenarios from Real Data
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-3 px-4">Scenario</th>
                <th className="text-left py-3 px-4">Frequency</th>
                <th className="text-left py-3 px-4">Priority</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 px-4 text-slate-300">Single Child, Pay in Full</td>
                <td className="py-3 px-4 text-white">75%</td>
                <td className="py-3 px-4"><span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Critical</span></td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 px-4 text-slate-300">Preschool Program Enrollment</td>
                <td className="py-3 px-4 text-white">74%</td>
                <td className="py-3 px-4"><span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Critical</span></td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 px-4 text-slate-300">Community Program, Weekend</td>
                <td className="py-3 px-4 text-white">26%</td>
                <td className="py-3 px-4"><span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">High</span></td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 px-4 text-slate-300">Multi-Child, Sibling Discount</td>
                <td className="py-3 px-4 text-white">8%</td>
                <td className="py-3 px-4"><span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">High</span></td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 px-4 text-slate-300">Single Child, Payment Plan</td>
                <td className="py-3 px-4 text-white">8%</td>
                <td className="py-3 px-4"><span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Medium</span></td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300">Waitlist Scenario</td>
                <td className="py-3 px-4 text-white">1%</td>
                <td className="py-3 px-4"><span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">Low (but valuable)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
