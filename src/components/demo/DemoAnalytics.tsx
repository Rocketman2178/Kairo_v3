import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Clock, Target,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, AlertTriangle,
  CheckCircle, Calendar, MapPin, ChevronDown
} from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d' | 'ytd';

interface MetricCard {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
}

export function DemoAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const metrics: MetricCard[] = [
    {
      label: 'Total Revenue',
      value: '$47,850',
      change: 12.5,
      changeLabel: 'vs last period',
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      label: 'New Registrations',
      value: '284',
      change: 8.3,
      changeLabel: 'vs last period',
      icon: <Users className="w-5 h-5" />
    },
    {
      label: 'Avg Registration Time',
      value: '3:24',
      change: -45.2,
      changeLabel: 'vs industry avg',
      icon: <Clock className="w-5 h-5" />
    },
    {
      label: 'Completion Rate',
      value: '94.2%',
      change: 18.5,
      changeLabel: 'vs last period',
      icon: <Target className="w-5 h-5" />
    }
  ];

  const funnelData = [
    { stage: 'Started Registration', count: 412, percentage: 100, color: 'bg-blue-500' },
    { stage: 'Child Info Collected', count: 398, percentage: 96.6, color: 'bg-blue-400' },
    { stage: 'Class Selected', count: 375, percentage: 91.0, color: 'bg-cyan-500' },
    { stage: 'Payment Initiated', count: 342, percentage: 83.0, color: 'bg-cyan-400' },
    { stage: 'Registration Complete', count: 324, percentage: 78.6, color: 'bg-emerald-500' }
  ];

  const churnRisks = [
    {
      family: 'Anderson Family',
      children: 'Jake (8), Mia (5)',
      risk: 'high',
      reason: 'Failed payment 2x, no response to outreach',
      daysInactive: 14
    },
    {
      family: 'Thompson Family',
      children: 'Ethan (6)',
      risk: 'medium',
      reason: 'Missed last 2 classes, no re-enrollment',
      daysInactive: 21
    },
    {
      family: 'Davis Family',
      children: 'Sophie (4)',
      risk: 'medium',
      reason: 'Session ending, no renewal intent shown',
      daysInactive: 7
    }
  ];

  const topPrograms = [
    { name: 'Mini Soccer', enrollments: 89, revenue: '$15,041', growth: 15.2 },
    { name: 'Dance Academy', enrollments: 67, revenue: '$12,663', growth: 22.1 },
    { name: 'Swim Lessons', enrollments: 54, revenue: '$10,206', growth: 8.4 },
    { name: 'Basketball Basics', enrollments: 41, revenue: '$6,519', growth: -3.2 },
    { name: 'Martial Arts', enrollments: 33, revenue: '$6,237', growth: 12.8 }
  ];

  const locationPerformance = [
    { name: 'Lincoln Park', utilization: 87, registrations: 112, avgRating: 4.8 },
    { name: 'Riverside Park', utilization: 76, registrations: 89, avgRating: 4.6 },
    { name: 'Downtown Center', utilization: 92, registrations: 134, avgRating: 4.7 },
    { name: 'Westside Park', utilization: 64, registrations: 67, avgRating: 4.5 }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Intelligence</h1>
          <p className="text-slate-600">Real-time analytics and predictive insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="ytd">Year to date</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                {metric.icon}
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                metric.change >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {metric.change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(metric.change)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{metric.value}</div>
            <div className="text-sm text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Conversion Funnel</h2>
          <div className="space-y-3">
            {funnelData.map((stage, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{stage.count}</span>
                    <span className="text-xs text-slate-500">({stage.percentage}%)</span>
                  </div>
                </div>
                <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Drop-off rate</span>
              <span className="font-semibold text-slate-900">21.4%</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-slate-600">Biggest drop-off</span>
              <span className="font-semibold text-amber-600">Payment Initiation (-8%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Revenue by Channel</h2>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20"
                  strokeDasharray="188.5" strokeDashoffset="47.1"
                />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#06b6d4" strokeWidth="20"
                  strokeDasharray="188.5" strokeDashoffset="141.4"
                  className="origin-center"
                  style={{ transform: 'rotate(270deg)', transformOrigin: '50px 50px' }}
                />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20"
                  strokeDasharray="188.5" strokeDashoffset="169.7"
                  className="origin-center"
                  style={{ transform: 'rotate(315deg)', transformOrigin: '50px 50px' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">$47.8K</span>
                <span className="text-sm text-slate-500">Total</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Kai Chat', value: '$35,887', percent: 75, color: 'bg-blue-500' },
              { label: 'Web Forms', value: '$7,178', percent: 15, color: 'bg-cyan-500' },
              { label: 'SMS/Voice', value: '$4,785', percent: 10, color: 'bg-emerald-500' }
            ].map((channel, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{channel.label}</p>
                  <p className="text-xs text-slate-500">{channel.value} ({channel.percent}%)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Programs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                  <th className="pb-3 font-medium">Program</th>
                  <th className="pb-3 font-medium">Enrollments</th>
                  <th className="pb-3 font-medium">Revenue</th>
                  <th className="pb-3 font-medium">Growth</th>
                </tr>
              </thead>
              <tbody>
                {topPrograms.map((program, idx) => (
                  <tr key={idx} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 font-medium text-slate-900">{program.name}</td>
                    <td className="py-3 text-slate-700">{program.enrollments}</td>
                    <td className="py-3 text-slate-700">{program.revenue}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                        program.growth >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {program.growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(program.growth)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Churn Risk Alerts</h2>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              3 at risk
            </span>
          </div>
          <div className="space-y-4">
            {churnRisks.map((risk, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-slate-900">{risk.family}</h3>
                    <p className="text-xs text-slate-500">{risk.children}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    risk.risk === 'high'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {risk.risk} risk
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{risk.reason}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{risk.daysInactive} days inactive</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Location Performance</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {locationPerformance.map((location, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-slate-500" />
                <h3 className="font-medium text-slate-900">{location.name}</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">Utilization</span>
                    <span className={`font-medium ${
                      location.utilization >= 80 ? 'text-emerald-600' :
                      location.utilization >= 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>{location.utilization}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        location.utilization >= 80 ? 'bg-emerald-500' :
                        location.utilization >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${location.utilization}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Registrations</span>
                  <span className="font-medium text-slate-900">{location.registrations}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Avg Rating</span>
                  <span className="font-medium text-slate-900">{location.avgRating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
