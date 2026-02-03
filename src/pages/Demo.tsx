import { useState } from 'react';
import {
  MessageCircle, CreditCard, BarChart3, Users, Calendar, TrendingUp,
  Building2, Megaphone, Palette, Shield, Brain, ChevronRight, Check,
  Mic, Globe, Zap, Clock, MapPin, Star, Phone, Mail,
  DollarSign, UserCheck, Bell, Target, Sparkles, Play, LayoutDashboard,
  ArrowRight, Rocket, XCircle, CheckCircle2, RefreshCw, Bot, Database,
  MessageSquare, Smartphone, Monitor, PhoneCall, Infinity, HeartHandshake, Network
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
import { DemoKaiAgent } from '../components/demo/DemoKaiAgent';
import { FeedbackAdminDashboard } from '../components/feedback/FeedbackAdminDashboard';

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
    ]
  },
  {
    id: 2,
    name: 'Kai Intelligence',
    status: 'completed',
    icon: <MessageCircle className="w-5 h-5" />,
    description: 'Conversational AI registration with 99% accuracy (14/14 tests passed)',
    features: ['AI chat with Kai', 'Smart recommendations', 'Waitlist prevention', 'Sub-2s response'],
    tigerTank: [
      'Register children via AI conversation',
      'Receive smart class recommendations',
      'Get alternative suggestions when classes are full',
      'Experience sub-2-second AI response times'
    ]
  },
  {
    id: 2.5,
    name: 'Voice & Languages',
    status: 'planned',
    icon: <Mic className="w-5 h-5" />,
    description: 'Multi-language support with accent variations',
    features: ['Voice input', 'Spanish', 'Cantonese', 'Accent options'],
    tigerTank: [
      'Use voice input for hands-free registration',
      'Register in Spanish or Cantonese',
      'Choose voice accent (British, Latin American)',
      'Phone system integration (IVR hybrid)'
    ],
    badge: 'new'
  },
  {
    id: 3,
    name: 'Payments & Retention',
    status: 'in_progress',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Complete payment processing with custom payment plans',
    features: ['Stripe integration', 'Apple/Google Pay', 'Custom plans', 'Financial aid'],
    tigerTank: [
      'Accept payments via Stripe (cards, Apple Pay, Google Pay)',
      'Create custom payment plans during registration',
      'Apply financial aid within enrollment flow',
      'Automatically recover abandoned carts (25-30% improvement target)'
    ],
    badge: 'improved'
  },
  {
    id: 4,
    name: 'Business Intelligence',
    status: 'planned',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Analytics, reporting, and printable schedules',
    features: ['Custom reports', 'Printable schedules', 'Excel export', 'Churn prediction'],
    tigerTank: [
      'Build custom reports with drag-and-drop',
      'Print poolside/fieldside schedules',
      'Export to Excel, PDF, CSV',
      'Track staff performance and instructor retention'
    ],
    badge: 'improved'
  },
  {
    id: 5,
    name: 'Staff & Coach Tools',
    status: 'planned',
    icon: <Users className="w-5 h-5" />,
    description: 'Coach mobile app, staff scheduling, and internal messaging',
    features: ['Staff scheduling', 'In-company messaging', 'Time-off requests', 'Mobile attendance'],
    tigerTank: [
      'Schedule staff, refs, scorekeepers, and photographers',
      'Replace Slack/Connecteam with built-in team chat',
      'Manage time-off requests with conflict detection',
      'Coaches take attendance on mobile (large touch targets)'
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
    ]
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
    ]
  },
  {
    id: 8.6,
    name: 'Migration Toolkit',
    status: 'planned',
    icon: <RefreshCw className="w-5 h-5" />,
    description: 'Complete data migration with training materials and parallel running',
    features: ['Data import wizard', 'Training videos', 'Parallel testing', '90-day support'],
    tigerTank: [
      'Import from iClass Pro, NBC Sports Engine, TeamSnap',
      'Access video training library for staff and customers',
      'Run old and new systems in parallel for comparison',
      'Get dedicated 90-day success program support'
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
    description: 'CAN-SPAM, TCPA, COPPA/GDPR compliance and data portability',
    features: ['CAN-SPAM/TCPA', 'COPPA compliance', 'PII controls', 'Data export'],
    tigerTank: [
      'Full CAN-SPAM and TCPA compliance for marketing',
      'Documented PII storage and access controls',
      'Ensure COPPA compliance for child data',
      'Export all family and registration data on demand'
    ],
    badge: 'improved'
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
    ]
  }
];

type DemoView = 'overview' | 'chat' | 'payments' | 'analytics' | 'coach' | 'scheduling' | 'marketing' | 'whitelabel' | 'datainsights' | 'benchmarking' | 'internal' | 'kaiagent';

export function Demo() {
  const [activeView, setActiveView] = useState<DemoView>('overview');
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

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
    { view: 'chat' as DemoView, label: 'Try Kai Chat', icon: <MessageCircle className="w-4 h-4" />, stage: 2 },
    { view: 'payments' as DemoView, label: 'Payments Demo', icon: <CreditCard className="w-4 h-4" />, stage: 3 },
    { view: 'analytics' as DemoView, label: 'Analytics Demo', icon: <BarChart3 className="w-4 h-4" />, stage: 4 },
    { view: 'coach' as DemoView, label: 'Coach App Demo', icon: <Users className="w-4 h-4" />, stage: 5 },
    { view: 'scheduling' as DemoView, label: 'Scheduling Demo', icon: <Calendar className="w-4 h-4" />, stage: 6 },
    { view: 'marketing' as DemoView, label: 'Marketing Demo', icon: <Megaphone className="w-4 h-4" />, stage: 9 },
    { view: 'whitelabel' as DemoView, label: 'White-Label Demo', icon: <Palette className="w-4 h-4" />, stage: 10 },
    { view: 'datainsights' as DemoView, label: 'Data Insights', icon: <TrendingUp className="w-4 h-4" />, stage: 4 },
    { view: 'benchmarking' as DemoView, label: 'Benchmarking', icon: <BarChart3 className="w-4 h-4" />, stage: 8.5 },
    { view: 'internal' as DemoView, label: 'Internal Ops', icon: <LayoutDashboard className="w-4 h-4" />, stage: 13 },
    { view: 'kaiagent' as DemoView, label: 'Kai Agent', icon: <Bot className="w-4 h-4" />, stage: 2 },
  ];

  if (activeView !== 'overview') {
    const isDarkView = activeView === 'chat' || activeView === 'datainsights' || activeView === 'benchmarking' || activeView === 'internal' || activeView === 'kaiagent';
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
        {activeView === 'kaiagent' && <DemoKaiAgent />}
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdminDashboard(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                View Analytics
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Go to App
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 text-white">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Registration Made Simple</h2>
              <p className="text-blue-100 text-lg">Powered by Kai AI Agent</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Conversational</h3>
                <p className="text-blue-100 text-sm">Natural language chat that understands parents and guides them through registration</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                  <Brain className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Intelligent</h3>
                <p className="text-blue-100 text-sm">Smart recommendations based on child age, location preferences, and availability</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Effortless</h3>
                <p className="text-blue-100 text-sm">Complete registration in minutes while multitasking with the kids</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-white">Why Switch to Kairo?</h2>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-400 text-blue-900">
              Tiger Tank Validated
            </span>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 overflow-hidden">
              <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-400 text-amber-900">
                Updated
              </span>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Realistic Migration Timeline</h3>
                  <p className="text-slate-400 text-sm">Honest timelines based on industry feedback</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-medium">Single Location Business</span>
                    <span className="text-emerald-400 font-bold">1-2 months</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-1/4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                  </div>
                  <p className="text-slate-500 text-xs mt-2">Full data migration, staff training, parallel testing, and go-live</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-medium">Multi-Location (3-10)</span>
                    <span className="text-emerald-400 font-bold">3-6 months</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                  </div>
                  <p className="text-slate-500 text-xs mt-2">Phased rollout with dedicated support and parallel running</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-medium">Franchise System (100+)</span>
                    <span className="text-emerald-400 font-bold">6-12 months</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                  </div>
                  <p className="text-slate-500 text-xs mt-2">White-glove onboarding, train-the-trainer, enterprise approval cycles</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-emerald-300 text-sm font-medium">White-Glove Migration Included</p>
                    <p className="text-emerald-200/70 text-xs">We handle everything: data import, configuration, staff training, and parallel testing</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Eliminate Software Expenses</h3>
                  <p className="text-slate-400 text-sm">One platform replaces many tools</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-slate-300">Email Marketing Tools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 line-through text-sm">$200-500/mo</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Included</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-slate-300">Team Communication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 line-through text-sm">$100-300/mo</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Included</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-slate-300">Scheduling Software</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 line-through text-sm">$50-150/mo</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Included</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-slate-300">Re-enrollment Campaigns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 line-through text-sm">$500+/season</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Automated</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-slate-300">Marketing Agency Fees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 line-through text-sm">$1,000+/mo</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Trackable ROI</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-300 text-sm font-medium">True Marketing ROI Visibility</p>
                    <p className="text-blue-200/70 text-xs">No more vague agency reports. See exactly which campaigns drive registrations.</p>
                  </div>
                </div>
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
                {'badge' in btn && btn.badge && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded shadow-lg bg-emerald-400 text-emerald-900">
                    New
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
            <h2 className="text-xl font-bold text-white">Development Roadmap (Tiger Tank Validated)</h2>
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
              <h3 className="text-xl font-bold mb-2">Registration Made Simple</h3>
              <p className="text-emerald-100">
                Traditional platforms take 18-20 minutes. Kairo's conversational AI
                lets parents complete registration while juggling kids.
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
          <h2 className="text-xl font-bold text-white mb-6">Key Capabilities (Tiger Tank Validated)</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Mic className="w-5 h-5" />, title: 'Voice Registration', desc: 'Hands-free enrollment via voice commands' },
              { icon: <Globe className="w-5 h-5" />, title: 'Multi-Language', desc: 'English, Spanish, and Cantonese support' },
              { icon: <MapPin className="w-5 h-5" />, title: 'Drive Radius Search', desc: 'Find classes within your preferred distance' },
              { icon: <UserCheck className="w-5 h-5" />, title: 'Family Profiles', desc: 'Remember preferences across registrations' },
              { icon: <Star className="w-5 h-5" />, title: 'Skill Tracking', desc: 'Monitor student progress and plateau detection' },
              { icon: <Bell className="w-5 h-5" />, title: 'Smart Notifications', desc: 'Automated reminders and re-enrollment' },
              { icon: <Phone className="w-5 h-5" />, title: 'Mobile-First', desc: 'Designed for one-handed use' },
              { icon: <Mail className="w-5 h-5" />, title: 'Printable Schedules', desc: 'Poolside/fieldside ready formats' },
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

      {showAdminDashboard && (
        <FeedbackAdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}
    </div>
  );
}
