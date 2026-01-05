import { useState } from 'react';
import {
  MessageCircle, CreditCard, BarChart3, Users, Calendar, TrendingUp,
  Building2, Megaphone, Palette, Shield, Brain, ChevronRight, Check,
  Mic, Globe, Zap, Clock, MapPin, Star, Phone, Mail,
  DollarSign, UserCheck, Bell, Target, Sparkles, Play, LayoutDashboard
} from 'lucide-react';
import { DemoChat } from '../components/demo/DemoChat';
import { DemoPayments } from '../components/demo/DemoPayments';
import { DemoAnalytics } from '../components/demo/DemoAnalytics';
import { DemoCoachApp } from '../components/demo/DemoCoachApp';
import { DemoScheduling } from '../components/demo/DemoScheduling';
import { DemoMarketing } from '../components/demo/DemoMarketing';
import { DemoWhiteLabel } from '../components/demo/DemoWhiteLabel';
import { DemoDataInsights } from '../components/demo/DemoDataInsights';
import { DemoBenchmarking } from '../components/demo/DemoBenchmarking';
import { DemoInternalDashboard } from '../components/demo/DemoInternalDashboard';

interface Stage {
  id: number;
  name: string;
  status: 'completed' | 'in_progress' | 'planned';
  icon: React.ReactNode;
  description: string;
  features: string[];
  tigerTank: string[];
  badge?: 'new' | 'improved';
}

const stages: Stage[] = [
  {
    id: 1,
    name: 'Foundation',
    status: 'completed',
    icon: <Zap className="w-5 h-5" />,
    description: 'Database schema, authentication, and core UI components',
    features: ['13 database tables', 'Row Level Security', 'Mobile-first UI', 'Auth system'],
    tigerTank: [
      'Create and manage organization account',
      'Add programs, sessions, and locations',
      'Set up staff/coach profiles',
      'View and manage family registrations'
    ],
    badge: 'improved'
  },
  {
    id: 2,
    name: 'Kai Intelligence',
    status: 'in_progress',
    icon: <MessageCircle className="w-5 h-5" />,
    description: 'Conversational AI registration with 99% accuracy target',
    features: ['AI chat with Kai', 'Smart recommendations', 'Waitlist prevention', 'Voice input'],
    tigerTank: [
      'Register children via AI conversation',
      'Receive smart class recommendations',
      'Get alternative suggestions when classes are full',
      'Use voice input for hands-free registration'
    ],
    badge: 'improved'
  },
  {
    id: 3,
    name: 'Payments & Retention',
    status: 'planned',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Complete payment processing and cart recovery',
    features: ['Stripe integration', 'Apple/Google Pay', 'Payment plans', 'Cart recovery'],
    tigerTank: [
      'Accept payments via Stripe (cards, Apple Pay, Google Pay)',
      'Offer payment plans to families',
      'Automatically recover abandoned carts',
      'Process refunds and issue credits'
    ]
  },
  {
    id: 4,
    name: 'Business Intelligence',
    status: 'planned',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Analytics, reporting, and predictive insights',
    features: ['Conversion funnel', 'Revenue forecasting', 'Churn prediction', 'Drop-off analysis'],
    tigerTank: [
      'View registration conversion funnel',
      'Analyze revenue trends and forecasts',
      'Identify at-risk families before they churn',
      'See where parents drop off during registration'
    ],
    badge: 'new'
  },
  {
    id: 5,
    name: 'Staff & Coach Tools',
    status: 'planned',
    icon: <Users className="w-5 h-5" />,
    description: 'Coach mobile app with messaging and attendance',
    features: ['In-company messaging', 'Parent video updates', 'Mobile attendance', 'Curriculum library'],
    tigerTank: [
      'Coaches take attendance on mobile (large touch targets)',
      'Send video updates to parents from class',
      'Message team via location and company channels',
      'Access lesson plans and curriculum'
    ],
    badge: 'improved'
  },
  {
    id: 6,
    name: 'Advanced Scheduling',
    status: 'planned',
    icon: <Calendar className="w-5 h-5" />,
    description: 'AI-powered schedule optimization',
    features: ['Drag-drop scheduling', 'AI Optimizer', 'Revenue analysis', 'Waitlist demand'],
    tigerTank: [
      'Build schedules with drag-and-drop',
      'Get AI suggestions based on waitlist demand',
      'See revenue potential per time slot',
      'Detect and resolve scheduling conflicts'
    ],
    badge: 'improved'
  },
  {
    id: 7,
    name: 'Upselling & Engagement',
    status: 'planned',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Revenue maximization and lifecycle communications',
    features: ['Smart upsells', 'Re-enrollment', 'Sibling discounts', 'Loyalty programs'],
    tigerTank: [
      'Automatically prompt re-enrollment before session ends',
      'Offer sibling discounts during registration',
      'Suggest program upgrades based on child progress',
      'Run loyalty/rewards programs'
    ]
  },
  {
    id: 8,
    name: 'Multi-Location',
    status: 'planned',
    icon: <Building2 className="w-5 h-5" />,
    description: 'Multi-location operators and franchise support (120+ locations)',
    features: ['Multi-location', 'Franchise mode', 'Central dashboard', 'Location analytics'],
    tigerTank: [
      'Manage 120+ locations from one dashboard',
      'Compare performance across locations',
      'Set location-specific pricing and schedules',
      'Franchise-level reporting and controls'
    ]
  },
  {
    id: 8.5,
    name: 'Benchmarking Intelligence',
    status: 'planned',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Anonymous peer comparison with AI-powered recommendations',
    features: ['Peer benchmarks', 'AI recommendations', 'Revenue opportunities', 'Industry insights'],
    tigerTank: [
      'Compare enrollment rate to peer businesses in same sport/region',
      'See where you rank vs. 50th and 75th percentile benchmarks',
      'Get AI recommendations for revenue opportunities',
      'Filter by business size, geography, and sport type'
    ],
    badge: 'new'
  },
  {
    id: 9,
    name: 'Marketing Automation',
    status: 'planned',
    icon: <Megaphone className="w-5 h-5" />,
    description: 'Ad ROI tracking and automated budget optimization',
    features: ['ROI tracking', 'Auto budget allocation', 'Facebook/Google Ads', 'Lead generation'],
    tigerTank: [
      'Track ROI across Facebook, Google, Instagram ads',
      'Let AI auto-pause underperforming campaigns',
      'Automatically scale budget to best performers',
      'See cost per registration by channel'
    ]
  },
  {
    id: 10,
    name: 'White-Label & API',
    status: 'planned',
    icon: <Palette className="w-5 h-5" />,
    description: 'Deep customization including voice accents',
    features: ['Custom branding', 'Voice accents', 'Language options', 'Public API'],
    tigerTank: [
      'Apply custom colors, logos, and branding',
      'Choose AI voice accent (British, Latin American, etc.)',
      'Enable Spanish language support',
      'Integrate via public API and webhooks'
    ]
  },
  {
    id: 11,
    name: 'Data & Compliance',
    status: 'planned',
    icon: <Shield className="w-5 h-5" />,
    description: 'COPPA/GDPR compliance and data portability',
    features: ['COPPA compliance', 'GDPR tools', 'Data export', 'Consent management'],
    tigerTank: [
      'Ensure COPPA compliance for child data',
      'Handle GDPR data requests automatically',
      'Export all family and registration data',
      'Manage consent and privacy preferences'
    ]
  },
  {
    id: 12,
    name: 'Advanced AI',
    status: 'planned',
    icon: <Brain className="w-5 h-5" />,
    description: 'Predictive models and optimization algorithms',
    features: ['Demand forecasting', 'Pricing optimization', 'Churn prevention', 'Smart scheduling'],
    tigerTank: [
      'Predict demand for new programs/locations',
      'Get AI pricing recommendations',
      'Receive churn alerts with intervention suggestions',
      'Auto-optimize schedules based on enrollment patterns'
    ]
  },
  {
    id: 13,
    name: 'Internal Operations',
    status: 'planned',
    icon: <LayoutDashboard className="w-5 h-5" />,
    description: 'B2B SaaS operations dashboard with transaction-based health metrics',
    features: ['CEO Dashboard', 'EA Operations', 'Customer Health', 'Revenue Protection'],
    tigerTank: [
      'See business health in 60 seconds (CEO view)',
      'Track customer health by transaction volume, not logins',
      'Get prioritized action list with MRR at risk',
      'Protect revenue with proactive payment monitoring'
    ],
    badge: 'new'
  }
];

type DemoView = 'overview' | 'chat' | 'payments' | 'analytics' | 'coach' | 'scheduling' | 'marketing' | 'whitelabel' | 'datainsights' | 'benchmarking' | 'internal';

export function Demo() {
  const [activeView, setActiveView] = useState<DemoView>('overview');
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  const getStatusColor = (status: Stage['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500';
      case 'in_progress': return 'bg-amber-500';
      case 'planned': return 'bg-slate-300';
    }
  };

  const getStatusLabel = (status: Stage['status']) => {
    switch (status) {
      case 'completed': return 'Complete';
      case 'in_progress': return 'In Progress';
      case 'planned': return 'Planned';
    }
  };

  const demoButtons = [
    { view: 'chat' as DemoView, label: 'Try Kai Chat', icon: <MessageCircle className="w-4 h-4" />, stage: 2, badge: 'improved' as const },
    { view: 'payments' as DemoView, label: 'Payments Demo', icon: <CreditCard className="w-4 h-4" />, stage: 3 },
    { view: 'analytics' as DemoView, label: 'Analytics Demo', icon: <BarChart3 className="w-4 h-4" />, stage: 4, badge: 'improved' as const },
    { view: 'coach' as DemoView, label: 'Coach App Demo', icon: <Users className="w-4 h-4" />, stage: 5, badge: 'improved' as const },
    { view: 'scheduling' as DemoView, label: 'Scheduling Demo', icon: <Calendar className="w-4 h-4" />, stage: 6, badge: 'improved' as const },
    { view: 'marketing' as DemoView, label: 'Marketing Demo', icon: <Megaphone className="w-4 h-4" />, stage: 9 },
    { view: 'whitelabel' as DemoView, label: 'White-Label Demo', icon: <Palette className="w-4 h-4" />, stage: 10 },
    { view: 'datainsights' as DemoView, label: 'Data Insights', icon: <TrendingUp className="w-4 h-4" />, stage: 4, badge: 'new' as const },
    { view: 'benchmarking' as DemoView, label: 'Benchmarking', icon: <BarChart3 className="w-4 h-4" />, stage: 8.5, badge: 'new' as const },
    { view: 'internal' as DemoView, label: 'Internal Ops', icon: <LayoutDashboard className="w-4 h-4" />, stage: 13, badge: 'new' as const },
  ];

  if (activeView !== 'overview') {
    const isDarkView = activeView === 'chat' || activeView === 'datainsights' || activeView === 'benchmarking' || activeView === 'internal';
    return (
      <div className={`min-h-screen ${isDarkView ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <header className={`${isDarkView ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b sticky top-0 z-50`}>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setActiveView('overview')}
              className={`flex items-center gap-2 ${isDarkView ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'} transition-colors`}
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="font-medium">Back to Overview</span>
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className={`w-5 h-5 ${isDarkView ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`font-semibold ${isDarkView ? 'text-white' : 'text-slate-900'}`}>Kairo Demo</span>
            </div>
          </div>
        </header>

        {activeView === 'chat' && <DemoChat />}
        {activeView === 'payments' && <DemoPayments />}
        {activeView === 'analytics' && <DemoAnalytics />}
        {activeView === 'coach' && <DemoCoachApp />}
        {activeView === 'scheduling' && <DemoScheduling />}
        {activeView === 'marketing' && <DemoMarketing />}
        {activeView === 'whitelabel' && <DemoWhiteLabel />}
        {activeView === 'datainsights' && <DemoDataInsights />}
        {activeView === 'benchmarking' && <DemoBenchmarking />}
        {activeView === 'internal' && <DemoInternalDashboard />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Kairo Platform Demo</h1>
                <p className="text-slate-400 text-sm">Interactive feature showcase</p>
              </div>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Go to App
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 text-white">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold mb-4">
                Registration in 3 Minutes, Not 20
              </h2>
              <p className="text-blue-100 text-lg mb-6">
                Kairo transforms youth sports registration from an 18-20 minute painful process
                into a seamless conversational experience. Explore interactive demos of every
                planned feature below.
              </p>
              <div className="flex flex-wrap gap-3">
                {demoButtons.slice(0, 3).map((btn) => (
                  <button
                    key={btn.view}
                    onClick={() => setActiveView(btn.view)}
                    className="relative flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium backdrop-blur-sm"
                  >
                    {btn.badge && (
                      <span className={`absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                        btn.badge === 'new' ? 'bg-emerald-400 text-emerald-900' : 'bg-amber-400 text-amber-900'
                      }`}>
                        {btn.badge === 'new' ? 'New' : 'Updated'}
                      </span>
                    )}
                    {btn.icon}
                    {btn.label}
                    <Play className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Interactive Feature Demos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {demoButtons.map((btn) => (
              <button
                key={btn.view}
                onClick={() => setActiveView(btn.view)}
                className="relative flex flex-col items-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all hover:scale-105 border border-slate-700"
              >
                {btn.badge && (
                  <span className={`absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded shadow-lg ${
                    btn.badge === 'new' ? 'bg-emerald-400 text-emerald-900' : 'bg-amber-400 text-amber-900'
                  }`}>
                    {btn.badge === 'new' ? 'New' : 'Updated'}
                  </span>
                )}
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400">
                  {btn.icon}
                </div>
                <span className="text-white text-sm font-medium text-center">{btn.label}</span>
                <span className="text-slate-500 text-xs">Stage {btn.stage}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">14-Stage Development Roadmap</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-slate-400">Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-slate-400">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span className="text-slate-400">Planned</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={`relative bg-slate-800 rounded-xl p-5 border transition-all cursor-pointer ${
                  selectedStage === stage.id
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
              >
                {stage.badge && (
                  <span className={`absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded shadow-lg z-10 ${
                    stage.badge === 'new' ? 'bg-emerald-400 text-emerald-900' : 'bg-amber-400 text-amber-900'
                  }`}>
                    {stage.badge === 'new' ? 'New' : 'Updated'}
                  </span>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      stage.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      stage.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {stage.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-sm font-medium">Stage {stage.id}</span>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(stage.status)}`}></div>
                      </div>
                      <h3 className="text-white font-semibold">{stage.name}</h3>
                    </div>
                  </div>
                </div>

                <p className="text-slate-400 text-sm mb-4">{stage.description}</p>

                {selectedStage === stage.id && (
                  <div className="pt-3 border-t border-slate-700 space-y-4">
                    <div>
                      <p className="text-slate-500 text-xs uppercase font-medium mb-2">Key Features</p>
                      <div className="flex flex-wrap gap-2">
                        {stage.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                      <p className="text-amber-400 text-xs uppercase font-medium mb-2 flex items-center gap-1.5">
                        <span className="w-4 h-4 bg-amber-500 rounded text-[10px] text-white flex items-center justify-center font-bold">TT</span>
                        Tiger Tank Can...
                      </p>
                      <ul className="space-y-1.5">
                        {stage.tigerTank.map((capability, idx) => (
                          <li key={idx} className="text-amber-100/80 text-xs flex items-start gap-2">
                            <Check className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                            {capability}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Platform Highlights</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">3-Minute Registration</h3>
              <p className="text-emerald-100">
                Down from 18-20 minutes with traditional platforms. Parents complete
                registration while juggling kids.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">95% Completion Rate</h3>
              <p className="text-blue-100">
                Up from 54% industry average. AI-powered conversation keeps parents
                engaged and removes friction.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl p-6 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">$80K/mo Recovered</h3>
              <p className="text-amber-100">
                Automated cart recovery and waitlist prevention captures revenue
                lost to abandoned registrations.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-6">Key Capabilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Mic className="w-5 h-5" />, title: 'Voice Registration', desc: 'Hands-free enrollment via voice commands' },
              { icon: <Globe className="w-5 h-5" />, title: 'Multi-Language', desc: 'English and Spanish support' },
              { icon: <Bell className="w-5 h-5" />, title: 'Smart Notifications', desc: 'Automated reminders and updates' },
              { icon: <UserCheck className="w-5 h-5" />, title: 'Family Profiles', desc: 'Remember preferences across registrations' },
              { icon: <MapPin className="w-5 h-5" />, title: 'Location Matching', desc: 'Find classes near you automatically' },
              { icon: <Star className="w-5 h-5" />, title: 'Coach Ratings', desc: 'See ratings before enrolling' },
              { icon: <Phone className="w-5 h-5" />, title: 'Mobile-First', desc: 'Designed for one-handed use' },
              { icon: <Mail className="w-5 h-5" />, title: 'Instant Confirmations', desc: 'Email and calendar invites' },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-slate-300 mb-3">
                  {item.icon}
                </div>
                <h3 className="text-white font-medium mb-1">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-700/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <p>Kairo Platform Demo - All features shown are simulated</p>
            <p>Built with React, TypeScript, and Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
