import { useState } from 'react';
import {
  Check, X, Zap, TrendingUp, Building2, Users, MessageCircle,
  BarChart3, Brain, Shield, Rocket, Star, ArrowRight, Mic,
  Globe, CreditCard, Bell, Calendar, Target, ChevronDown, ChevronUp,
  DollarSign, Award
} from 'lucide-react';

type BillingCycle = 'monthly' | 'annual';

const PRICES = {
  monthly: { starter: 149, growth: 299, pro: 499 },
  annual: { starter: 127, growth: 254, pro: 424 },
};

const tiers = [
  {
    id: 'starter',
    name: 'Starter',
    color: 'emerald',
    icon: Zap,
    target: 'Single-location operators and new franchisees getting started with Kairo.',
    badge: null,
    limits: { locations: 'Up to 3', users: 'Up to 5 staff' },
    highlight: '80% of all features included',
    groups: [
      {
        label: 'AI Registration',
        icon: MessageCircle,
        features: [
          'Kai AI Chat (Web — EN + ES)',
          'Smart class recommendations',
          'Real-time availability checking',
          'Cart abandonment recovery (3-step)',
        ],
      },
      {
        label: 'Payments',
        icon: CreditCard,
        features: [
          'Stripe + Apple/Google Pay',
          'Pay-in-full, installment plans',
          'Monthly subscriptions',
          'Two-payment split',
          'Fee waiver for full pay',
        ],
      },
      {
        label: 'Coach & Staff Tools',
        icon: Users,
        features: [
          'Coach mobile app (PWA + offline)',
          'Attendance & lesson plans',
          'Curriculum timer system',
          'Incident report system',
          'Staff messaging & DMs',
          'Parent communication tools',
        ],
      },
      {
        label: 'Analytics & Reporting',
        icon: BarChart3,
        features: [
          'Core analytics dashboard',
          'Conversion funnel & drop-off',
          'Financial reporting',
          'CSV / Excel / PDF export',
          'Printable poolside schedules',
        ],
      },
    ],
    cta: 'Start Free Trial',
    ctaStyle: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  },
  {
    id: 'growth',
    name: 'Growth',
    color: 'blue',
    icon: TrendingUp,
    target: 'Multi-location operators scaling their business with advanced scheduling and engagement tools.',
    badge: 'Most Popular',
    limits: { locations: 'Up to 20', users: 'Up to 15 staff' },
    highlight: 'Everything in Starter, plus:',
    groups: [
      {
        label: 'Advanced Scheduling',
        icon: Calendar,
        features: [
          'Drag-and-drop schedule builder',
          'Conflict detection & bulk sessions',
          'Smart coach assignment (weighted)',
          'Preschool partnership module',
        ],
      },
      {
        label: 'Retention & Engagement',
        icon: Bell,
        features: [
          'Churn risk scoring',
          'Proactive Kai interventions',
          'Re-enrollment campaigns (4-step)',
          'Welcome series for new families',
          '4-tier loyalty program',
        ],
      },
      {
        label: 'Deeper Analytics',
        icon: BarChart3,
        features: [
          'Staff performance analytics',
          'Custom date range & trend analysis',
          'NPS + star ratings collection',
          'Tip jar integration',
          'Benchmarking preview (teaser)',
        ],
      },
      {
        label: 'Localization',
        icon: Globe,
        features: [
          'English + Spanish + Cantonese',
          'Automatic language detection',
        ],
      },
    ],
    cta: 'Start Free Trial',
    ctaStyle: 'bg-blue-600 hover:bg-blue-500 text-white',
  },
  {
    id: 'pro',
    name: 'Pro',
    color: 'purple',
    icon: Brain,
    target: 'Large multi-location franchises needing the full platform with advanced AI and automation.',
    badge: 'AI-Powered',
    limits: { locations: 'Unlimited', users: 'Unlimited staff' },
    highlight: 'Everything in Growth, plus:',
    groups: [
      {
        label: 'AI-Powered Features',
        icon: Brain,
        features: [
          'AI Schedule Optimizer',
          'Predictive churn modeling',
          'Demand forecasting & pricing AI',
          'Benchmarking Intelligence',
          'Ad ROI tracking & auto-scaling',
        ],
      },
      {
        label: 'Registration Channels',
        icon: Mic,
        features: [
          'Voice registration (web + phone)',
          'SMS registration via Kai',
          'Accent & voice customization',
        ],
      },
      {
        label: 'Marketing Suite',
        icon: Target,
        features: [
          'Email + SMS campaign builder',
          'Family & employee referral programs',
          'Birthday campaigns',
          'Performance tracking',
        ],
      },
      {
        label: 'Enterprise',
        icon: Shield,
        features: [
          'White-label full customization',
          'Public API & webhooks',
          'Migration toolkit + 90-day success',
          'COPPA / GDPR / CAN-SPAM compliance',
          'Drag-and-drop report designer',
          'Internal help desk + knowledge base',
        ],
      },
    ],
    cta: 'Start Free Trial',
    ctaStyle: 'bg-purple-600 hover:bg-purple-500 text-white',
  },
];

const comparisonRows = [
  { label: 'AI Registration', starter: 'Web (EN + ES)', growth: '+ Proactive AI, 3 languages', pro: '+ Voice + SMS channels' },
  { label: 'Locations', starter: 'Up to 3', growth: 'Up to 20', pro: 'Unlimited' },
  { label: 'Admin Users', starter: '5', growth: '15', pro: 'Unlimited' },
  { label: 'Payments', starter: 'Full suite + cart recovery', growth: 'Same', pro: 'Same' },
  { label: 'Scheduling', starter: 'Manual', growth: 'Drag-drop + smart assign', pro: '+ AI optimizer' },
  { label: 'Analytics', starter: 'Core dashboard', growth: '+ Staff analytics + insights', pro: '+ Benchmarking + predictive AI' },
  { label: 'Retention', starter: 'Cart recovery', growth: '+ Churn scoring + loyalty', pro: '+ Advanced automation' },
  { label: 'Marketing', starter: null, growth: null, pro: 'Full suite + referrals + ads' },
  { label: 'White-Label', starter: null, growth: null, pro: 'Full customization + API' },
  { label: 'Compliance', starter: null, growth: null, pro: 'COPPA, GDPR, CAN-SPAM' },
  { label: 'Migration toolkit', starter: null, growth: null, pro: 'Full + 90-day success program' },
];

const competitors = [
  { name: 'Kairo Starter', price: '$149/mo', ai: true, highlight: true },
  { name: 'iClassPro', price: '$129–$299/mo', ai: false, highlight: false },
  { name: 'SportsEngine', price: '~$79/mo+', ai: false, highlight: false },
  { name: 'Upper Hand', price: '~$76/mo', ai: false, highlight: false },
  { name: 'LeagueApps', price: '1.5–3% per txn', ai: false, highlight: false },
  { name: 'TeamSnap', price: 'Free – $99/mo', ai: false, highlight: false },
];

const colorMap: Record<string, { ring: string; bg: string; text: string; border: string; badge: string }> = {
  emerald: {
    ring: 'ring-emerald-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  blue: {
    ring: 'ring-blue-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  purple: {
    ring: 'ring-purple-500',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
};

function CellValue({ value }: { value: string | null }) {
  if (value === null) {
    return <X className="w-4 h-4 text-slate-600 mx-auto" />;
  }
  return (
    <div className="flex items-start gap-1.5">
      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
      <span className="text-slate-300 text-xs">{value}</span>
    </div>
  );
}

export function DemoPricing() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [showComparison, setShowComparison] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const prices = PRICES[billing];
  const annualSavings = billing === 'annual' ? '15% off' : null;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-10 text-center">
          <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold mb-2">Pricing</p>
          <h1 className="text-4xl font-black text-white mb-3">Simple, Transparent Pricing</h1>
          <p className="text-slate-400 text-lg mb-6">One flat subscription. Kai AI included free. Start with a 30-day Pro trial.</p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                billing === 'monthly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                billing === 'annual' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Save 15%
              </span>
            </button>
          </div>
          {annualSavings && (
            <p className="text-emerald-400 text-sm mt-3">Billed annually — {15}% discount applied</p>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-10 space-y-12">

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const c = colorMap[tier.color];
            const price = prices[tier.id as keyof typeof prices];
            const Icon = tier.icon;

            return (
              <div
                key={tier.id}
                className={`relative bg-slate-800 border rounded-2xl flex flex-col ${
                  tier.badge === 'Most Popular'
                    ? `border-blue-500 ring-2 ring-blue-500/20`
                    : 'border-slate-700'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${c.badge}`}>
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
                      <Icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <h2 className="text-xl font-bold text-white">{tier.name}</h2>
                  </div>

                  <div className="mb-3">
                    <span className={`text-5xl font-black ${c.text}`}>${price}</span>
                    <span className="text-slate-400 text-sm">/mo</span>
                  </div>
                  {billing === 'annual' && (
                    <p className="text-slate-500 text-xs mb-3">
                      ${price * 12}/yr · saves ${(PRICES.monthly[tier.id as keyof typeof PRICES.monthly] - price) * 12}/yr
                    </p>
                  )}

                  <p className="text-slate-400 text-sm mb-4">{tier.target}</p>

                  <div className={`flex gap-4 p-3 rounded-lg ${c.bg} border ${c.border} mb-4`}>
                    <div className="text-center flex-1">
                      <p className={`text-sm font-bold ${c.text}`}>{tier.limits.locations}</p>
                      <p className="text-slate-500 text-xs">locations</p>
                    </div>
                    <div className="w-px bg-slate-700" />
                    <div className="text-center flex-1">
                      <p className={`text-sm font-bold ${c.text}`}>{tier.limits.users}</p>
                      <p className="text-slate-500 text-xs">users</p>
                    </div>
                  </div>

                  <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${tier.ctaStyle}`}>
                    {tier.cta}
                  </button>
                  <p className="text-slate-600 text-xs text-center mt-2">30-day Pro trial • No credit card required</p>
                </div>

                <div className="p-6 flex-1 space-y-4">
                  <p className="text-slate-500 text-xs uppercase font-semibold">{tier.highlight}</p>
                  {tier.groups.map((group) => {
                    const groupKey = `${tier.id}-${group.label}`;
                    const isOpen = expandedGroup === groupKey;
                    const GroupIcon = group.icon;
                    return (
                      <div key={group.label}>
                        <button
                          onClick={() => setExpandedGroup(isOpen ? null : groupKey)}
                          className="w-full flex items-center justify-between py-1 group"
                        >
                          <div className="flex items-center gap-2">
                            <GroupIcon className={`w-4 h-4 ${c.text}`} />
                            <span className="text-slate-300 text-sm font-medium">{group.label}</span>
                          </div>
                          {isOpen
                            ? <ChevronUp className="w-4 h-4 text-slate-500" />
                            : <ChevronDown className="w-4 h-4 text-slate-500" />
                          }
                        </button>
                        {isOpen && (
                          <ul className="mt-2 space-y-1.5 pl-6">
                            {group.features.map((f) => (
                              <li key={f} className="flex items-start gap-2 text-slate-400 text-sm">
                                <Check className={`w-3.5 h-3.5 ${c.text} mt-0.5 flex-shrink-0`} />
                                {f}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trial CTA */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 text-center">
          <Award className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">Start with a 30-Day Pro Trial</h3>
          <p className="text-slate-400 mb-4 max-w-xl mx-auto">
            Every new customer starts on Pro — free for 30 days. After the trial, choose the tier that matches how you actually used the platform. Downgrade is frictionless.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> No credit card</div>
            <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Full Pro access</div>
            <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Cancel anytime</div>
          </div>
        </div>

        {/* AI Registration Fee */}
        <div className="bg-slate-800 border border-amber-500/30 rounded-2xl overflow-hidden">
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">AI Registration — Included Free</h3>
                <p className="text-amber-300/70 text-sm">Your subscription stays fixed. You never pay more as you grow.</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-slate-300 text-sm leading-relaxed">
              Every Kairo plan includes <span className="text-white font-semibold">Kai, our AI registration assistant</span>, at no additional cost to you.
              When a family registers through Kai, a small <span className="text-amber-400 font-semibold">$3.50 technology fee</span> is built into their checkout.
              That's how we fund the AI — so you get unlimited AI-powered registration without any added cost on your side.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-amber-400 mb-1">$3.50</p>
                <p className="text-slate-400 text-xs">Per registration at checkout</p>
                <p className="text-slate-500 text-[11px] mt-1">Paid by families, not you</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-emerald-400 mb-1">1%</p>
                <p className="text-slate-400 text-xs">Of average season cost</p>
                <p className="text-slate-500 text-[11px] mt-1">$3.50 on a $350 season</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-purple-400 mb-1">$0</p>
                <p className="text-slate-400 text-xs">Your cost for AI</p>
                <p className="text-slate-500 text-[11px] mt-1">Included in every plan</p>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-500 text-xs uppercase font-semibold tracking-wide mb-3">How the fee works</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-300 text-sm">Charged <span className="text-white font-medium">once per registration</span> — not per transaction or payment installment</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-300 text-sm">No fee on <span className="text-white font-medium">renewals, installments, or subscription payments</span></p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-300 text-sm"><span className="text-white font-medium">1 child + 1 program + 1 season</span> = 1 registration = 1 fee</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-300 text-sm">We only earn from AI <span className="text-white font-medium">when families register</span> — we succeed when you do</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-300 text-sm italic leading-relaxed">
                "We don't bake AI costs into your subscription or charge you more as you grow. The AI is funded through a small fee paid by families at checkout. That means we're aligned around one goal — helping you grow by converting more families into long-term customers."
              </p>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors"
          >
            <span className="text-white font-semibold">Full Feature Comparison</span>
            {showComparison
              ? <ChevronUp className="w-5 h-5 text-slate-400" />
              : <ChevronDown className="w-5 h-5 text-slate-400" />
            }
          </button>

          {showComparison && (
            <div className="mt-3 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 text-sm font-medium w-1/4">Feature</th>
                    <th className="py-3 px-4 text-center w-1/4">
                      <span className="text-emerald-400 font-bold text-sm">Starter</span>
                      <p className="text-slate-500 text-xs font-normal">${prices.starter}/mo</p>
                    </th>
                    <th className="py-3 px-4 text-center w-1/4 bg-blue-500/5">
                      <span className="text-blue-400 font-bold text-sm">Growth</span>
                      <p className="text-slate-500 text-xs font-normal">${prices.growth}/mo</p>
                    </th>
                    <th className="py-3 px-4 text-center w-1/4">
                      <span className="text-purple-400 font-bold text-sm">Pro</span>
                      <p className="text-slate-500 text-xs font-normal">${prices.pro}/mo</p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, idx) => (
                    <tr key={row.label} className={`border-b border-slate-700/50 ${idx % 2 === 0 ? '' : 'bg-slate-900/30'}`}>
                      <td className="py-3 px-4 text-slate-300 text-sm font-medium">{row.label}</td>
                      <td className="py-3 px-4"><CellValue value={row.starter} /></td>
                      <td className="py-3 px-4 bg-blue-500/5"><CellValue value={row.growth} /></td>
                      <td className="py-3 px-4"><CellValue value={row.pro} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Competitive Positioning */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-cyan-400" />
              How Kairo Compares
            </h3>
            <p className="text-slate-500 text-xs mb-4">Only Kairo offers AI-powered conversational registration</p>
            <div className="space-y-2">
              {competitors.map((c) => (
                <div
                  key={c.name}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    c.highlight
                      ? 'bg-blue-500/10 border border-blue-500/30'
                      : 'bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-medium text-sm ${c.highlight ? 'text-white' : 'text-slate-400'}`}>
                      {c.name}
                    </span>
                    {c.highlight && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${c.highlight ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                      {c.price}
                    </span>
                    {c.ai
                      ? <span className="flex items-center gap-1 text-xs text-emerald-400"><Check className="w-3 h-3" /> AI</span>
                      : <span className="flex items-center gap-1 text-xs text-slate-600"><X className="w-3 h-3" /> AI</span>
                    }
                  </div>
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-3 italic">
              Kairo's AI reduces registration time from 18–20 min to ~3 min. No competitor offers this.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              What Kairo Replaces
            </h3>
            <p className="text-slate-500 text-xs mb-4">Tools you can cancel on day one</p>
            <div className="space-y-3">
              {[
                { tier: 'Starter', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', items: [
                  { tool: 'Slack', cost: '$8.75/user/mo', what: 'Staff messaging' },
                  { tool: 'Square', cost: '$60/mo', what: 'Payment processing' },
                  { tool: 'Intercom', cost: '$89/mo', what: 'Customer chat' },
                  { tool: 'Incident tools', cost: '$20–50/mo', what: 'Incident reporting' },
                ], savings: '~$170+/mo' },
                { tier: 'Growth', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', items: [
                  { tool: 'Calendly', cost: '$16/mo', what: 'Advanced scheduling' },
                  { tool: 'Klaviyo', cost: '$45/mo', what: 'Re-engagement' },
                  { tool: 'LoyaltyLion', cost: '$199/mo', what: 'Loyalty program' },
                ], savings: '~$260+/mo additional' },
                { tier: 'Pro', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', items: [
                  { tool: 'HubSpot', cost: '$800/mo', what: 'Marketing CRM' },
                  { tool: 'Tableau', cost: '$75/user/mo', what: 'Advanced analytics' },
                  { tool: 'Ad agency fees', cost: '$2K+/mo', what: 'Ad management' },
                ], savings: '~$2,900+/mo additional' },
              ].map((group) => (
                <div key={group.tier} className={`p-3 rounded-lg border ${group.color}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${group.color.split(' ')[0]}`}>{group.tier}</span>
                    <span className={`text-xs font-bold ${group.color.split(' ')[0]}`}>{group.savings}</span>
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <div key={item.tool} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          <span className="line-through text-slate-600">{item.tool}</span> → {item.what}
                        </span>
                        <span className="text-slate-600 line-through">{item.cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Annual savings callout */}
        {billing === 'monthly' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-white text-sm font-semibold">Switch to annual and save up to $900/yr</p>
                <p className="text-emerald-300/70 text-xs">Pro annual: $424/mo vs $499/mo monthly</p>
              </div>
            </div>
            <button
              onClick={() => setBilling('annual')}
              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              See annual prices <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
