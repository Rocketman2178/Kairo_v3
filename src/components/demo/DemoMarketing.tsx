import { useState } from 'react';
import {
  Mail, MessageSquare, Users, TrendingUp, Send, Calendar, Gift,
  Target, CheckCircle, Clock, ChevronRight, Sparkles, Edit2, Eye,
  DollarSign, PauseCircle, PlayCircle, BarChart3, Zap, AlertTriangle,
  UserPlus, Star, Heart, QrCode
} from 'lucide-react';

type MarketingView = 'campaigns' | 'automation' | 'referrals' | 'ads' | 'employee-referrals' | 'tipping';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms';
  status: 'draft' | 'scheduled' | 'sent' | 'active';
  audience: string;
  sent?: number;
  opened?: number;
  clicked?: number;
  scheduledFor?: string;
}

export function DemoMarketing() {
  const [view, setView] = useState<MarketingView>('campaigns');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const campaigns: Campaign[] = [
    {
      id: '1',
      name: 'Spring Season Early Bird',
      type: 'email',
      status: 'sent',
      audience: 'All Families',
      sent: 1247,
      opened: 892,
      clicked: 234
    },
    {
      id: '2',
      name: 'Session Reminder - Week 4',
      type: 'sms',
      status: 'sent',
      audience: 'Active Enrollments',
      sent: 324,
      opened: 318,
      clicked: 156
    },
    {
      id: '3',
      name: 'Summer Camp Preview',
      type: 'email',
      status: 'scheduled',
      audience: 'All Families',
      scheduledFor: 'Mar 15, 2025 at 9:00 AM'
    },
    {
      id: '4',
      name: 'Re-enrollment Reminder',
      type: 'email',
      status: 'draft',
      audience: 'Session Ending Soon'
    }
  ];

  const automations = [
    {
      name: 'Welcome Series',
      trigger: 'New family registration',
      status: 'active',
      stats: { sent: 156, converted: 89 },
      steps: ['Welcome email (immediate)', 'Class prep tips (Day 2)', 'First class reminder (Day before)']
    },
    {
      name: 'Re-enrollment Campaign',
      trigger: 'Session ends in 2 weeks',
      status: 'active',
      stats: { sent: 234, converted: 167 },
      steps: ['First reminder email', 'Early bird discount (5 days)', 'Final reminder (2 days)', 'SMS if no action']
    },
    {
      name: 'Cart Recovery',
      trigger: 'Abandoned cart (1 hour)',
      status: 'active',
      stats: { sent: 89, converted: 31 },
      steps: ['SMS reminder', 'Email with saved cart', 'Final urgency message']
    },
    {
      name: 'Birthday Campaign',
      trigger: 'Child birthday this month',
      status: 'active',
      stats: { sent: 45, converted: 12 },
      steps: ['Birthday wishes + discount code']
    }
  ];

  const referralStats = {
    totalReferrals: 67,
    successfulEnrollments: 42,
    totalRewards: 840,
    topReferrers: [
      { name: 'Sarah Roberts', referrals: 5, earned: 100 },
      { name: 'Maria Martinez', referrals: 4, earned: 80 },
      { name: 'Jennifer Davis', referrals: 3, earned: 60 }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing Hub</h1>
          <p className="text-slate-600">Campaigns, automation, and referral programs</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Sparkles className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'campaigns', label: 'Campaigns', icon: <Mail className="w-4 h-4" /> },
          { id: 'ads', label: 'Ad ROI', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'automation', label: 'Automation', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'referrals', label: 'Family Referrals', icon: <Gift className="w-4 h-4" /> },
          { id: 'employee-referrals', label: 'Employee Referrals', icon: <UserPlus className="w-4 h-4" /> },
          { id: 'tipping', label: 'Feedback & Tipping', icon: <Heart className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as MarketingView)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              view === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'campaigns' && (
        <div>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Emails Sent', value: '2,847', change: '+12%', icon: <Mail className="w-5 h-5" /> },
              { label: 'Open Rate', value: '68.4%', change: '+5%', icon: <Eye className="w-5 h-5" /> },
              { label: 'Click Rate', value: '24.2%', change: '+8%', icon: <Target className="w-5 h-5" /> },
              { label: 'SMS Delivered', value: '1,156', change: '+18%', icon: <MessageSquare className="w-5 h-5" /> }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    {stat.icon}
                  </div>
                  <span className="text-sm font-medium text-emerald-600">{stat.change}</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Recent Campaigns</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        campaign.type === 'email' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {campaign.type === 'email' ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{campaign.name}</h3>
                        <p className="text-sm text-slate-500">{campaign.audience}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      campaign.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                      campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      campaign.status === 'active' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </div>

                  {campaign.status === 'sent' && campaign.sent && (
                    <div className="flex items-center gap-6 ml-13 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Send className="w-4 h-4" />
                        <span>{campaign.sent.toLocaleString()} sent</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{Math.round((campaign.opened! / campaign.sent) * 100)}% opened</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{Math.round((campaign.clicked! / campaign.sent) * 100)}% clicked</span>
                      </div>
                    </div>
                  )}

                  {campaign.status === 'scheduled' && campaign.scheduledFor && (
                    <div className="flex items-center gap-2 ml-13 text-sm text-blue-600">
                      <Calendar className="w-4 h-4" />
                      <span>Scheduled for {campaign.scheduledFor}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'ads' && (
        <div>
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Ad Performance & ROI</h2>
                <p className="text-blue-100 max-w-lg">
                  Track ROI across all ad platforms. AI automatically optimizes budget allocation based on performance.
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Ad Spend', value: '$4,280', change: 'This month', icon: <DollarSign className="w-5 h-5" /> },
              { label: 'Cost per Registration', value: '$18.42', change: '-12% vs last month', positive: true, icon: <Target className="w-5 h-5" /> },
              { label: 'Registrations from Ads', value: '232', change: '+28% vs last month', positive: true, icon: <Users className="w-5 h-5" /> },
              { label: 'Overall ROI', value: '847%', change: '+156% revenue', positive: true, icon: <TrendingUp className="w-5 h-5" /> }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
                <div className={`text-xs font-medium mt-1 ${stat.positive ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Ad Platform Performance</h3>
                <span className="text-sm text-slate-500">Last 30 days</span>
              </div>
              <div className="p-4 space-y-4">
                {[
                  { platform: 'Facebook Ads', spend: 2150, registrations: 124, roi: '892%', status: 'scaling', color: 'bg-blue-500' },
                  { platform: 'Google Ads', spend: 1450, registrations: 78, roi: '756%', status: 'optimizing', color: 'bg-red-500' },
                  { platform: 'Instagram Ads', spend: 680, registrations: 30, roi: '612%', status: 'active', color: 'bg-pink-500' }
                ].map((platform, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${platform.color}`}></div>
                        <span className="font-medium text-slate-900">{platform.platform}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        platform.status === 'scaling' ? 'bg-emerald-100 text-emerald-700' :
                        platform.status === 'optimizing' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {platform.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Spend</p>
                        <p className="font-semibold text-slate-900">${platform.spend.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Registrations</p>
                        <p className="font-semibold text-slate-900">{platform.registrations}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">ROI</p>
                        <p className="font-semibold text-emerald-600">{platform.roi}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-slate-900">AI Budget Optimizer</h3>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                  Auto-enabled
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-emerald-900">Scaling Facebook Ads</h4>
                      <p className="text-sm text-emerald-700 mt-1">
                        High ROI detected. Automatically increased daily budget by 20% ($50/day).
                      </p>
                      <p className="text-xs text-emerald-600 mt-2">Applied 2 hours ago</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-900">Optimizing Google Ads</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        CPC rising. Reallocating $200 from underperforming keywords.
                      </p>
                      <p className="text-xs text-amber-600 mt-2">In progress</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                      <PauseCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Paused Low-Performers</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        3 ad sets paused due to high CPA ({'>'}$45). Savings: $120/week.
                      </p>
                      <p className="text-xs text-slate-500 mt-2">Yesterday</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Budget Allocation Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Auto-scale high performers</p>
                  <p className="text-sm text-slate-500">Increase budget when ROI exceeds 500%</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Auto-pause underperformers</p>
                  <p className="text-sm text-slate-500">Pause ads when CPA exceeds $40</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">Budget reallocation</p>
                  <p className="text-sm text-slate-500">Automatically shift budget to best performers</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-4 p-3 bg-slate-50 rounded-lg">
              AI-powered budget optimization can eliminate the need for a dedicated marketing director, saving $60K+/year.
            </p>
          </div>
        </div>
      )}

      {view === 'automation' && (
        <div>
          <div className="grid md:grid-cols-2 gap-6">
            {automations.map((automation, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{automation.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">Trigger: {automation.trigger}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      automation.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {automation.status === 'active' ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-900">{automation.stats.sent}</div>
                      <div className="text-xs text-slate-500">Triggered</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-600">{automation.stats.converted}</div>
                      <div className="text-xs text-slate-500">Converted</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-lg font-bold text-slate-900">
                        {Math.round((automation.stats.converted / automation.stats.sent) * 100)}%
                      </div>
                      <div className="text-xs text-slate-500">Rate</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {automation.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {stepIdx + 1}
                        </div>
                        <span className="text-slate-600">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1">
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'referrals' && (
        <div>
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Family Referral Program</h2>
                <p className="text-blue-100 max-w-lg">
                  Parents earn $20 credit for each friend they refer who enrolls. Friends get 10% off their first registration.
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <Gift className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Referrals', value: referralStats.totalReferrals, icon: <Users className="w-5 h-5" /> },
              { label: 'Successful Enrollments', value: referralStats.successfulEnrollments, icon: <CheckCircle className="w-5 h-5" /> },
              { label: 'Conversion Rate', value: `${Math.round((referralStats.successfulEnrollments / referralStats.totalReferrals) * 100)}%`, icon: <TrendingUp className="w-5 h-5" /> },
              { label: 'Total Rewards Given', value: `$${referralStats.totalRewards}`, icon: <Gift className="w-5 h-5" /> }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 mb-2">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Top Referrers</h3>
              <div className="space-y-4">
                {referralStats.topReferrers.map((referrer, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-slate-100 text-slate-600' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{referrer.name}</p>
                        <p className="text-sm text-slate-500">{referrer.referrals} referrals</p>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-600">${referrer.earned} earned</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Program Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Referrer Reward</span>
                  <span className="font-semibold text-slate-900">$20 credit</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Friend Discount</span>
                  <span className="font-semibold text-slate-900">10% off</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Maximum Referrals</span>
                  <span className="font-semibold text-slate-900">Unlimited</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-600">Reward Expiry</span>
                  <span className="font-semibold text-slate-900">12 months</span>
                </div>
              </div>
              <button className="w-full mt-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
                Edit Program Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'employee-referrals' && (
        <div>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Employee Referral Program</h2>
                <p className="text-emerald-100 max-w-lg">
                  Each coach gets a unique referral code. When families use their code, coaches earn payouts.
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <UserPlus className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Active Codes', value: '24', icon: <QrCode className="w-5 h-5" /> },
              { label: 'Total Referrals', value: '89', icon: <Users className="w-5 h-5" /> },
              { label: 'Revenue Generated', value: '$18,420', icon: <DollarSign className="w-5 h-5" /> },
              { label: 'Payouts This Month', value: '$1,780', icon: <Gift className="w-5 h-5" /> }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 mb-2">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Coach Referral Leaderboard</h3>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { name: 'Coach Mike', code: 'COACH-MIKE', referrals: 12, earned: 240 },
                  { name: 'Coach Sarah', code: 'COACH-SARAH', referrals: 9, earned: 180 },
                  { name: 'Coach David', code: 'COACH-DAVID', referrals: 7, earned: 140 },
                  { name: 'Coach Emily', code: 'COACH-EMILY', referrals: 5, earned: 100 },
                ].map((coach, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-slate-200 text-slate-600' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{coach.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{coach.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">${coach.earned}</p>
                      <p className="text-xs text-slate-500">{coach.referrals} referrals</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Program Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payout per Referral</label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">$</span>
                    <input type="number" defaultValue="20" className="w-24 px-3 py-2 border border-slate-200 rounded-lg" />
                    <span className="text-sm text-slate-500">per enrollment</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code Naming Format</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option>COACH-[NAME]</option>
                    <option>[NAME]-2026</option>
                    <option>Custom per coach</option>
                  </select>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="font-medium text-slate-900">Auto-generate QR codes</p>
                    <p className="text-sm text-slate-500">Create shareable QR codes for each coach</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
                Generate Payout Report
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'tipping' && (
        <div>
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-6 text-white mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Season-End Feedback & Tipping</h2>
                <p className="text-rose-100 max-w-lg">
                  Collect feedback from parents at season end, then offer tipping options based on their response.
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <Heart className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Feedback Sent', value: '234', icon: <MessageSquare className="w-5 h-5" /> },
              { label: 'Responses', value: '189 (81%)', icon: <CheckCircle className="w-5 h-5" /> },
              { label: 'Avg Rating', value: '4.8', icon: <Star className="w-5 h-5" /> },
              { label: 'Tips Collected', value: '$2,340', icon: <Heart className="w-5 h-5" /> }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 mb-2">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-900">SMS #1: Feedback Request</h3>
                <p className="text-sm text-slate-500">Sent at end of season</p>
              </div>
              <div className="p-4">
                <div className="bg-slate-100 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-700 italic">
                    "Hi [Parent Name]! The Spring season with Soccer Shots has come to an end. We'd love to hear how [Child Name]'s experience was with Coach [Coach Name]. Please take a moment to share your feedback: [LINK]"
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Timing</span>
                    <span className="font-medium text-slate-900">Last day of season</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Questions</span>
                    <span className="font-medium text-slate-900">Rating + Comments</span>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit Message Template
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-900">SMS #2: Tipping Opportunity</h3>
                <p className="text-sm text-slate-500">Sent after feedback received</p>
              </div>
              <div className="p-4">
                <div className="bg-slate-100 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-700 italic">
                    "Thank you for your feedback! If you'd like to show extra appreciation to Coach [Coach Name], you can send a tip here: [VENMO_LINK]. Tips are optional but always appreciated!"
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Send to</span>
                    <span className="font-medium text-slate-900">Positive ratings only (4+ stars)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Delay after feedback</span>
                    <span className="font-medium text-slate-900">1 hour</span>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit Message Template
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Tipping Configuration</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Enable Tipping Feature</p>
                    <p className="text-sm text-slate-500">Allow tip requests after feedback</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Positive Reviews Only</p>
                    <p className="text-sm text-slate-500">Only send tip requests to 4+ star ratings</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Rating for Tips</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option>3+ stars</option>
                    <option selected>4+ stars</option>
                    <option>5 stars only</option>
                    <option>All ratings</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Platform</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option>Venmo</option>
                    <option>PayPal</option>
                    <option>CashApp</option>
                    <option>Coach enters own link</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">Coaches must add their payment link in their profile settings to receive tips.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
