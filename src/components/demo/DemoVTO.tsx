import { useState } from 'react';
import {
  Target, Compass, Rocket, TrendingUp, Users, Calendar,
  CheckCircle, Star, MapPin, DollarSign, BarChart3,
  Shield, Zap, Heart, ArrowRight, Building2, Clock,
  Award, Flag, Layers, ChevronRight
} from 'lucide-react';

type VTOSection = 'vision' | 'targets' | 'strategy' | 'plan' | 'operations';

const sectionTabs: { id: VTOSection; label: string; icon: React.ElementType }[] = [
  { id: 'vision', label: 'Vision & Values', icon: Compass },
  { id: 'targets', label: 'Targets', icon: Target },
  { id: 'strategy', label: 'Go-to-Market', icon: Rocket },
  { id: 'plan', label: '1-Year Plan', icon: Calendar },
  { id: 'operations', label: 'Operations', icon: Layers },
];

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, label, color = 'text-cyan-400' }: {
  icon: React.ElementType;
  label: string;
  color?: string;
}) {
  return (
    <h3 className={`text-base font-semibold text-white mb-4 flex items-center gap-2`}>
      <Icon className={`w-5 h-5 ${color}`} />
      {label}
    </h3>
  );
}

function ValueCard({ title, description, icon: Icon, color }: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className={`bg-slate-900/60 border rounded-xl p-5 border-slate-700 group hover:border-slate-500 transition-colors`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-white font-bold mb-1">{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function MetricTarget({ label, value, sublabel, color = 'text-cyan-400' }: {
  label: string;
  value: string;
  sublabel?: string;
  color?: string;
}) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-white text-sm font-medium mt-0.5">{label}</p>
      {sublabel && <p className="text-slate-500 text-xs mt-0.5">{sublabel}</p>}
    </div>
  );
}

function CheckItem({ text, color = 'text-emerald-400' }: { text: string; color?: string }) {
  return (
    <li className="flex items-start gap-2 text-slate-300 text-sm">
      <CheckCircle className={`w-4 h-4 ${color} mt-0.5 flex-shrink-0`} />
      {text}
    </li>
  );
}

function VisionSection() {
  return (
    <div className="space-y-6">
      {/* Core Values */}
      <SectionCard>
        <SectionHeader icon={Heart} label="Core Values" color="text-rose-400" />
        <div className="grid md:grid-cols-3 gap-4">
          <ValueCard
            icon={Shield}
            title="We Take Ownership."
            description="We solve problems. We don't blame. We move forward."
            color="bg-blue-500/20 text-blue-400"
          />
          <ValueCard
            icon={Zap}
            title="We Simplify."
            description="If it adds confusion or friction, it doesn't belong."
            color="bg-amber-500/20 text-amber-400"
          />
          <ValueCard
            icon={TrendingUp}
            title="We Grow for Impact."
            description="Growth is not ego. It fuels meaningful work and enables our customers to do more good."
            color="bg-emerald-500/20 text-emerald-400"
          />
        </div>
      </SectionCard>

      {/* Core Focus */}
      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard>
          <SectionHeader icon={Compass} label="Purpose" color="text-purple-400" />
          <p className="text-slate-300 leading-relaxed">
            We exist to eliminate operational friction in enrollment-based businesses so operators can{' '}
            <span className="text-white font-semibold">grow profitably</span> and create{' '}
            <span className="text-white font-semibold">meaningful experiences</span>.
          </p>
        </SectionCard>

        <SectionCard>
          <SectionHeader icon={MapPin} label="Niche" color="text-cyan-400" />
          <p className="text-slate-300 leading-relaxed italic text-lg font-medium">
            "The intelligent registration and retention platform for enrollment-driven businesses."
          </p>
          <div className="mt-4 flex items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <Star className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <p className="text-cyan-200 text-sm font-medium">Primary vertical: Independent swim schools (1–10 locations)</p>
          </div>
        </SectionCard>
      </div>

      {/* Brand */}
      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6 text-center">
        <p className="text-slate-400 text-sm uppercase font-semibold tracking-widest mb-2">Brand Promise</p>
        <p className="text-2xl font-bold text-white mb-2">The inevitable future of enrollment.</p>
        <p className="text-slate-300 text-lg">
          Kairo brings <span className="text-blue-400 font-semibold">clarity</span>,{' '}
          <span className="text-cyan-400 font-semibold">control</span>, and{' '}
          <span className="text-emerald-400 font-semibold">intelligent growth</span> to enrollment-driven businesses.
        </p>
      </div>
    </div>
  );
}

function TargetsSection() {
  return (
    <div className="space-y-6">
      {/* 10-Year */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white text-center">
        <p className="text-purple-200 text-sm uppercase font-semibold tracking-widest mb-2">10-Year Target</p>
        <p className="text-6xl font-black mb-2">8,000</p>
        <p className="text-xl text-purple-100">enrollment-driven businesses powered by Kairo</p>
      </div>

      {/* 3-Year Picture */}
      <SectionCard>
        <div className="flex items-center justify-between mb-5">
          <SectionHeader icon={Flag} label="3-Year Picture" color="text-blue-400" />
          <span className="text-slate-500 text-sm">December 31, 2029</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <MetricTarget value="2,000" label="Businesses" sublabel="powered by Kairo" color="text-blue-400" />
          <MetricTarget value="$8M+" label="ARR" sublabel="annual recurring" color="text-emerald-400" />
          <MetricTarget value="50%+" label="Profit Margin" sublabel="non-negotiable" color="text-amber-400" />
          <MetricTarget value="90%+" label="Gross Retention" sublabel="target" color="text-cyan-400" />
          <MetricTarget value="110%" label="NRR" sublabel="net revenue retention" color="text-purple-400" />
          <MetricTarget value="10–12" label="Team" sublabel="leadership & revenue" color="text-rose-400" />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-400 text-xs uppercase font-semibold mb-2">Tier Mix Target</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 text-sm">Starter</span>
                <span className="text-white text-sm font-bold">20%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full">
                <div className="h-full w-1/5 bg-emerald-500 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-400 text-sm">Growth</span>
                <span className="text-white text-sm font-bold">50%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full">
                <div className="h-full w-1/2 bg-blue-500 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-400 text-sm">Pro</span>
                <span className="text-white text-sm font-bold">30%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full">
                <div className="h-full w-[30%] bg-purple-500 rounded-full" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-400 text-xs uppercase font-semibold mb-2">Geographic Focus</p>
            <ul className="space-y-2">
              <CheckItem text="North America dominant" />
              <CheckItem text="Dominant in swim schools" />
              <CheckItem text="Expanding internationally" />
            </ul>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-amber-400 text-xs uppercase font-semibold mb-2">Non-Negotiable</p>
            <p className="text-amber-100 text-sm leading-relaxed">
              Anything below 50% profit margin is considered failure. We operate on the{' '}
              <span className="font-bold">Profit First</span> methodology.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function StrategySection() {
  return (
    <div className="space-y-6">
      {/* Target Market */}
      <SectionCard>
        <SectionHeader icon={Users} label='Target Market — "The List"' color="text-cyan-400" />
        <p className="text-slate-400 text-sm mb-4">Independent, owner-led swim school operators who:</p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { text: 'Operate 1–10 locations', icon: Building2 },
            { text: 'Run capacity-constrained classes', icon: Layers },
            { text: 'Have recurring enrollment cycles', icon: Calendar },
            { text: 'Are frustrated with legacy registration systems', icon: Shield },
            { text: 'Experience enrollment drop-off and admin overload', icon: TrendingUp },
            { text: 'Are willing to switch for measurable growth', icon: BarChart3 },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
              <item.icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm">{item.text}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-sm text-center font-medium">North America is the primary market</p>
        </div>
      </SectionCard>

      {/* Three Uniques + Proven Process */}
      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard>
          <SectionHeader icon={Star} label="Three Uniques" color="text-amber-400" />
          <div className="space-y-3">
            {[
              { num: '01', title: 'Frictionless AI Enrollment', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
              { num: '02', title: 'Retention That Works Automatically', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
              { num: '03', title: 'One Intelligent Growth Platform', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
            ].map((item) => (
              <div key={item.num} className={`flex items-center gap-3 p-3 border rounded-lg ${item.color}`}>
                <span className="text-lg font-black opacity-60">{item.num}</span>
                <span className="font-semibold">{item.title}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader icon={ArrowRight} label="Proven Process" color="text-emerald-400" />
          <div className="space-y-3">
            {[
              { step: '1', label: 'Launch with Clarity', desc: 'Setup in days, not months' },
              { step: '2', label: 'Enroll Without Friction', desc: 'AI-powered conversational registration' },
              { step: '3', label: 'Grow on Autopilot', desc: 'Retention and upsell automation' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  <p className="text-slate-400 text-xs">{item.desc}</p>
                </div>
                {idx < 2 && <ChevronRight className="w-4 h-4 text-slate-600 ml-auto mt-2 flex-shrink-0" />}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <p className="text-emerald-400 text-xs font-bold uppercase mb-1">Guarantee</p>
            <p className="text-emerald-200 text-sm">
              <span className="font-bold">No-Risk Migration.</span> We handle your migration and onboarding at no additional cost.
              If it's not simpler, it's not Kairo.
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function PlanSection() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <p className="text-emerald-200 text-sm uppercase font-semibold tracking-widest mb-1">1-Year Plan</p>
        <h3 className="text-2xl font-bold mb-1">October 2026 – December 31, 2027</h3>
        <p className="text-emerald-100">Founder-led sales through first 100 customers</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Financial */}
        <SectionCard>
          <SectionHeader icon={DollarSign} label="Financial Targets" color="text-emerald-400" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/60 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">260</p>
                <p className="text-slate-400 text-xs mt-1">businesses</p>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">~$1M</p>
                <p className="text-slate-400 text-xs mt-1">ARR</p>
              </div>
            </div>
            <ul className="space-y-2">
              <CheckItem text="50%+ profit margin" />
              <CheckItem text="90%+ gross retention" />
            </ul>
          </div>
        </SectionCard>

        {/* Sales */}
        <SectionCard>
          <SectionHeader icon={Target} label="Sales Targets" color="text-blue-400" />
          <ul className="space-y-2">
            <CheckItem text="Minimum 5 demos per week (starting November 2026)" color="text-blue-400" />
            <CheckItem text="Founder-led sales through first 100 customers" color="text-blue-400" />
            <CheckItem text="Close rate: TBD (to be measured and refined)" color="text-blue-400" />
          </ul>
        </SectionCard>

        {/* Operational */}
        <SectionCard>
          <SectionHeader icon={Clock} label="Operational Standards" color="text-amber-400" />
          <ul className="space-y-2">
            <CheckItem text="Onboarding scheduled within 5 business days of close" color="text-amber-400" />
            <CheckItem text="30-minute onboarding time (for prepared clients)" color="text-amber-400" />
            <CheckItem text="Onboarding fully standardized and repeatable" color="text-amber-400" />
            <CheckItem text="80%+ of customers on Growth or Pro" color="text-amber-400" />
          </ul>
        </SectionCard>

        {/* Strategic */}
        <SectionCard>
          <SectionHeader icon={Award} label="Strategic Milestones" color="text-purple-400" />
          <ul className="space-y-2">
            <CheckItem text="Sponsor and/or speak at 3 national industry events" color="text-purple-400" />
            <CheckItem text="10 documented case studies (minimum 3 swim)" color="text-purple-400" />
            <CheckItem text="October swim event launch executed" color="text-purple-400" />
            <CheckItem text="Hire 1 dedicated sales rep once process repeatable at 100 clients" color="text-purple-400" />
          </ul>
        </SectionCard>
      </div>

      {/* Pre-Launch Rocks */}
      <SectionCard>
        <SectionHeader icon={Rocket} label="Pre-Launch Rocks (Now → October 2026)" color="text-rose-400" />
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-slate-400 text-xs uppercase font-semibold mb-3">By May 1</p>
            <ul className="space-y-2">
              <CheckItem text="Tier 1 fully stable and ready to onboard first paying client" color="text-rose-400" />
              <CheckItem text="5 beta swim operators signed and onboarded" color="text-rose-400" />
              <CheckItem text="October swim event locked in" color="text-rose-400" />
            </ul>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase font-semibold mb-3">Before October Launch</p>
            <ul className="space-y-2">
              <CheckItem text="Migration checklist documented" color="text-rose-400" />
              <CheckItem text="Onboarding flow documented" color="text-rose-400" />
              <CheckItem text="Swim-specific demo finalized" color="text-rose-400" />
              <CheckItem text="Offer + pricing + launch CTA finalized" color="text-rose-400" />
            </ul>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function OperationsSection() {
  return (
    <div className="space-y-6">
      {/* Weekly Scorecard */}
      <SectionCard>
        <SectionHeader icon={BarChart3} label="Weekly Scorecard (Non-Negotiables)" color="text-cyan-400" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            { label: 'Demos Scheduled', target: '5/week', color: 'text-blue-400' },
            { label: 'Demos Completed', target: 'measured', color: 'text-blue-400' },
            { label: 'Close Rate', target: 'TBD', color: 'text-amber-400' },
            { label: 'New Clients', target: 'onboarded', color: 'text-emerald-400' },
            { label: 'Onboarding Time', target: '30 min', color: 'text-emerald-400' },
            { label: 'Gross Retention', target: '90%+', color: 'text-emerald-400' },
            { label: 'Profit Margin', target: '50%+ min', color: 'text-amber-400' },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-900/60 rounded-lg p-3 text-center">
              <p className={`text-sm font-bold ${item.color}`}>{item.target}</p>
              <p className="text-slate-500 text-xs mt-1 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Accountability Chart */}
      <SectionCard>
        <SectionHeader icon={Users} label="Accountability Chart (Current)" color="text-blue-400" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {[
              { role: 'Visionary', name: 'JoBen', color: 'bg-purple-500/20 text-purple-400' },
              { role: 'Integrator (temporary)', name: 'JoBen', color: 'bg-blue-500/20 text-blue-400' },
              { role: 'Director of Sales / Marketing', name: 'JoBen', color: 'bg-cyan-500/20 text-cyan-400' },
              { role: 'Director of Operations', name: 'JoBen', color: 'bg-teal-500/20 text-teal-400' },
              { role: 'Director of Finance', name: 'JoBen', color: 'bg-emerald-500/20 text-emerald-400' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400 text-sm">{item.role}</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${item.color}`}>{item.name}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <p className="text-slate-300 text-sm font-semibold mb-1">Executive Assistant (Stephanie)</p>
              <ul className="space-y-1">
                <li className="text-slate-500 text-xs">• Owns conversion of pipeline into calendared meetings</li>
                <li className="text-slate-500 text-xs">• Manages scheduling, follow-up, coordination</li>
                <li className="text-slate-500 text-xs">• Protects founder focus time</li>
              </ul>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <p className="text-slate-300 text-sm font-semibold mb-1">Product Development</p>
              <p className="text-slate-500 text-xs">Rocket AI (AI development partner) + Founder oversight</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <p className="text-slate-300 text-sm font-semibold mb-1">Customer Success</p>
              <p className="text-slate-500 text-xs">Rocket AI (system and automation ownership) — Future hire as company scales</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Operating Principles */}
      <SectionCard>
        <SectionHeader icon={Shield} label="Operating Principles" color="text-amber-400" />
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { text: 'We operate using Profit First.' },
            { text: 'We protect margin aggressively.' },
            { text: 'We do not build complexity that does not drive revenue or retention.' },
            { text: 'We focus on swim until dominant.' },
            { text: 'We execute with discipline over hype.' },
          ].map((item, idx) => (
            <div key={idx} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-amber-100 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function DemoVTO() {
  const [activeSection, setActiveSection] = useState<VTOSection>('vision');

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Internal
                </span>
                <span className="text-slate-500 text-sm">Vision / Traction Organizer</span>
              </div>
              <h1 className="text-3xl font-black text-white mb-1">KAIRO PRO</h1>
              <p className="text-slate-400">VTO — The playbook for building the inevitable future of enrollment</p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-slate-400 text-sm">10-Year Target: <span className="text-white font-bold">8,000 businesses</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-400 text-sm">3-Year: <span className="text-white font-bold">2,000 businesses / $8M ARR</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-400 text-sm">1-Year: <span className="text-white font-bold">260 businesses / ~$1M ARR</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Nav */}
      <nav className="bg-slate-800/80 border-b border-slate-700 sticky top-14 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {sectionTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeSection === 'vision' && <VisionSection />}
        {activeSection === 'targets' && <TargetsSection />}
        {activeSection === 'strategy' && <StrategySection />}
        {activeSection === 'plan' && <PlanSection />}
        {activeSection === 'operations' && <OperationsSection />}
      </main>
    </div>
  );
}
