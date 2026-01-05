import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  BarChart3, Users, Calendar, DollarSign, TrendingUp,
  MapPin, Star, Activity, Award, Clock, ArrowUp, ArrowDown
} from 'lucide-react';

interface DashboardStats {
  sessions: {
    total: number;
    full: number;
    active: number;
    avgFillRate: number;
    totalEnrolled: number;
    totalCapacity: number;
  };
  registrations: {
    total: number;
    paid: number;
    pending: number;
    failed: number;
    totalRevenue: number;
    avgAmount: number;
  };
  families: {
    total: number;
    returning: number;
    totalChildren: number;
    avgChildrenPerFamily: number;
  };
  reviews: {
    total: number;
    avgOverall: number;
    avgCoach: number;
    avgLocation: number;
    excellent: number;
  };
  channelBreakdown: {
    channel: string;
    count: number;
    revenue: number;
  }[];
  dayOfWeekData: {
    day: number;
    sessions: number;
    enrolled: number;
    fillRate: number;
  }[];
  cityData: {
    city: string;
    sessions: number;
    enrolled: number;
    fillRate: number;
  }[];
  programData: {
    name: string;
    level: string;
    sessions: number;
    enrolled: number;
    fillRate: number;
    price: number;
  }[];
  topCoaches: {
    name: string;
    rating: number;
    sessions: number;
    students: number;
    reviewAvg: number | null;
  }[];
}

const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TestDataDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'programs' | 'locations' | 'benchmarks'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [
        sessionsResult,
        registrationsResult,
        familiesResult,
        reviewsResult,
        channelResult,
        dayResult,
        cityResult,
        programResult,
        coachResult
      ] = await Promise.all([
        supabase.rpc('get_session_stats').maybeSingle(),
        supabase.rpc('get_registration_stats').maybeSingle(),
        supabase.rpc('get_family_stats').maybeSingle(),
        supabase.rpc('get_review_stats').maybeSingle(),
        supabase.from('registrations').select('registration_channel, amount_cents, payment_status'),
        supabase.from('sessions').select('day_of_week, enrolled_count, capacity').not('day_of_week', 'is', null),
        supabase.from('sessions').select('location_id, enrolled_count, capacity, locations!inner(city)'),
        supabase.from('sessions').select('program_id, enrolled_count, capacity, programs!inner(name, level, price_cents)'),
        supabase.from('staff').select('name, rating, id').eq('role', 'coach').order('rating', { ascending: false }).limit(5)
      ]);

      const channelBreakdown = processChannelData(channelResult.data || []);
      const dayOfWeekData = processDayData(dayResult.data || []);
      const cityData = processCityData(cityResult.data || []);
      const programData = processProgramData(programResult.data || []);
      const topCoaches = await processCoachData(coachResult.data || []);

      const sessionsData = await getSessionStats();
      const registrationsData = await getRegistrationStats();
      const familiesData = await getFamilyStats();
      const reviewsData = await getReviewStats();

      setStats({
        sessions: sessionsData,
        registrations: registrationsData,
        families: familiesData,
        reviews: reviewsData,
        channelBreakdown,
        dayOfWeekData,
        cityData,
        programData,
        topCoaches
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSessionStats = async () => {
    const { data } = await supabase.from('sessions').select('status, enrolled_count, capacity');
    const sessions = data || [];
    const total = sessions.length;
    const full = sessions.filter(s => s.status === 'full').length;
    const active = sessions.filter(s => s.status === 'active').length;
    const totalEnrolled = sessions.reduce((sum, s) => sum + (s.enrolled_count || 0), 0);
    const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const avgFillRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;
    return { total, full, active, avgFillRate, totalEnrolled, totalCapacity };
  };

  const getRegistrationStats = async () => {
    const { data } = await supabase.from('registrations').select('payment_status, amount_cents');
    const regs = data || [];
    const total = regs.length;
    const paid = regs.filter(r => r.payment_status === 'paid').length;
    const pending = regs.filter(r => r.payment_status === 'pending').length;
    const failed = regs.filter(r => r.payment_status === 'failed').length;
    const totalRevenue = regs.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + (r.amount_cents || 0), 0);
    const avgAmount = paid > 0 ? totalRevenue / paid : 0;
    return { total, paid, pending, failed, totalRevenue, avgAmount };
  };

  const getFamilyStats = async () => {
    const { data: families } = await supabase.from('families').select('is_returning');
    const { count: childCount } = await supabase.from('children').select('*', { count: 'exact', head: true });
    const total = families?.length || 0;
    const returning = families?.filter(f => f.is_returning).length || 0;
    const totalChildren = childCount || 0;
    const avgChildrenPerFamily = total > 0 ? totalChildren / total : 0;
    return { total, returning, totalChildren, avgChildrenPerFamily };
  };

  const getReviewStats = async () => {
    const { data } = await supabase.from('session_reviews').select('overall_rating, coach_rating, location_rating');
    const reviews = data || [];
    const total = reviews.length;
    const avgOverall = total > 0 ? reviews.reduce((sum, r) => sum + parseFloat(String(r.overall_rating)), 0) / total : 0;
    const avgCoach = total > 0 ? reviews.reduce((sum, r) => sum + parseFloat(String(r.coach_rating || 0)), 0) / total : 0;
    const avgLocation = total > 0 ? reviews.reduce((sum, r) => sum + parseFloat(String(r.location_rating || 0)), 0) / total : 0;
    const excellent = reviews.filter(r => parseFloat(String(r.overall_rating)) >= 4.5).length;
    return { total, avgOverall, avgCoach, avgLocation, excellent };
  };

  const processChannelData = (data: any[]) => {
    const channels: Record<string, { count: number; revenue: number }> = {};
    data.forEach(r => {
      const ch = r.registration_channel || 'unknown';
      if (!channels[ch]) channels[ch] = { count: 0, revenue: 0 };
      channels[ch].count++;
      if (r.payment_status === 'paid') channels[ch].revenue += r.amount_cents || 0;
    });
    return Object.entries(channels).map(([channel, data]) => ({ channel, ...data })).sort((a, b) => b.count - a.count);
  };

  const processDayData = (data: any[]) => {
    const days: Record<number, { sessions: number; enrolled: number; capacity: number }> = {};
    for (let i = 0; i < 7; i++) days[i] = { sessions: 0, enrolled: 0, capacity: 0 };
    data.forEach(s => {
      const d = s.day_of_week;
      if (d !== null && d !== undefined) {
        days[d].sessions++;
        days[d].enrolled += s.enrolled_count || 0;
        days[d].capacity += s.capacity || 0;
      }
    });
    return Object.entries(days).map(([day, d]) => ({
      day: parseInt(day),
      sessions: d.sessions,
      enrolled: d.enrolled,
      fillRate: d.capacity > 0 ? (d.enrolled / d.capacity) * 100 : 0
    }));
  };

  const processCityData = (data: any[]) => {
    const cities: Record<string, { sessions: number; enrolled: number; capacity: number }> = {};
    data.forEach(s => {
      const city = (s.locations as any)?.city || 'Unknown';
      if (!cities[city]) cities[city] = { sessions: 0, enrolled: 0, capacity: 0 };
      cities[city].sessions++;
      cities[city].enrolled += s.enrolled_count || 0;
      cities[city].capacity += s.capacity || 0;
    });
    return Object.entries(cities)
      .map(([city, d]) => ({
        city,
        sessions: d.sessions,
        enrolled: d.enrolled,
        fillRate: d.capacity > 0 ? (d.enrolled / d.capacity) * 100 : 0
      }))
      .sort((a, b) => b.enrolled - a.enrolled);
  };

  const processProgramData = (data: any[]) => {
    const programs: Record<string, { sessions: number; enrolled: number; capacity: number; level: string; price: number }> = {};
    data.forEach(s => {
      const prog = s.programs as any;
      const name = prog?.name || 'Unknown';
      if (!programs[name]) programs[name] = { sessions: 0, enrolled: 0, capacity: 0, level: prog?.level || '', price: prog?.price_cents || 0 };
      programs[name].sessions++;
      programs[name].enrolled += s.enrolled_count || 0;
      programs[name].capacity += s.capacity || 0;
    });
    return Object.entries(programs)
      .map(([name, d]) => ({
        name,
        level: d.level,
        sessions: d.sessions,
        enrolled: d.enrolled,
        fillRate: d.capacity > 0 ? (d.enrolled / d.capacity) * 100 : 0,
        price: d.price
      }))
      .sort((a, b) => b.enrolled - a.enrolled);
  };

  const processCoachData = async (coaches: any[]) => {
    const result = [];
    for (const coach of coaches) {
      const { count: sessionCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('coach_id', coach.id);
      const { data: sessions } = await supabase.from('sessions').select('enrolled_count').eq('coach_id', coach.id);
      const students = sessions?.reduce((sum, s) => sum + (s.enrolled_count || 0), 0) || 0;
      result.push({
        name: coach.name,
        rating: parseFloat(coach.rating) || 0,
        sessions: sessionCount || 0,
        students,
        reviewAvg: null
      });
    }
    return result;
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-500',
      voice: 'bg-emerald-500',
      web: 'bg-cyan-500',
      sms: 'bg-amber-500',
      phone: 'bg-rose-500'
    };
    return colors[channel] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-white text-lg">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Failed to load data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-cyan-400" />
                Soccer Shots Data Insights
              </h1>
              <p className="text-sm text-slate-400 mt-1">Real-time analytics from sample data + NBC Sports Engine benchmarks</p>
            </div>
            <div className="flex gap-2">
              {(['overview', 'programs', 'locations', 'benchmarks'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Calendar className="w-5 h-5" />}
                label="Total Sessions"
                value={stats.sessions.total}
                subtext={`${stats.sessions.full} full, ${stats.sessions.active} active`}
                color="cyan"
              />
              <StatCard
                icon={<Users className="w-5 h-5" />}
                label="Registrations"
                value={stats.registrations.total}
                subtext={`${stats.registrations.paid} paid (${Math.round(stats.registrations.paid / stats.registrations.total * 100)}%)`}
                color="emerald"
              />
              <StatCard
                icon={<DollarSign className="w-5 h-5" />}
                label="Total Revenue"
                value={formatCurrency(stats.registrations.totalRevenue)}
                subtext={`Avg ${formatCurrency(stats.registrations.avgAmount)}/reg`}
                color="amber"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Fill Rate"
                value={`${stats.sessions.avgFillRate.toFixed(1)}%`}
                subtext={`${stats.sessions.totalEnrolled}/${stats.sessions.totalCapacity} spots`}
                color="rose"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={<Users className="w-5 h-5" />}
                label="Families"
                value={stats.families.total}
                subtext={`${stats.families.totalChildren} children (${stats.families.avgChildrenPerFamily.toFixed(1)} avg)`}
                color="blue"
              />
              <StatCard
                icon={<Star className="w-5 h-5" />}
                label="Reviews"
                value={stats.reviews.total}
                subtext={`${stats.reviews.avgOverall.toFixed(2)} avg rating`}
                color="yellow"
              />
              <StatCard
                icon={<Award className="w-5 h-5" />}
                label="5-Star Reviews"
                value={stats.reviews.excellent}
                subtext={`${Math.round(stats.reviews.excellent / stats.reviews.total * 100)}% excellent`}
                color="emerald"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Registration Channels
                </h3>
                <div className="space-y-3">
                  {stats.channelBreakdown.map(ch => (
                    <div key={ch.channel} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getChannelColor(ch.channel)}`} />
                      <div className="w-16 text-sm text-slate-300 capitalize">{ch.channel}</div>
                      <div className="flex-1 bg-slate-700 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${getChannelColor(ch.channel)}`}
                          style={{ width: `${(ch.count / stats.registrations.total) * 100}%` }}
                        />
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-white font-medium">{ch.count}</span>
                        <span className="text-slate-400 text-sm ml-1">({Math.round(ch.count / stats.registrations.total * 100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    Voice + Text = {Math.round(((stats.channelBreakdown.find(c => c.channel === 'voice')?.count || 0) + (stats.channelBreakdown.find(c => c.channel === 'text')?.count || 0)) / stats.registrations.total * 100)}% of registrations (conversational AI)
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Sessions by Day of Week
                </h3>
                <div className="flex items-end justify-between gap-2 h-40">
                  {stats.dayOfWeekData.map(d => {
                    const maxFill = Math.max(...stats.dayOfWeekData.map(x => x.fillRate));
                    const height = maxFill > 0 ? (d.fillRate / maxFill) * 100 : 0;
                    const isHighest = d.fillRate === maxFill && maxFill > 0;
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center">
                        <div className="text-xs text-slate-400 mb-1">{d.fillRate.toFixed(0)}%</div>
                        <div
                          className={`w-full rounded-t transition-all ${isHighest ? 'bg-cyan-500' : 'bg-slate-600'}`}
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <div className="text-xs text-slate-400 mt-2">{dayNamesShort[d.day]}</div>
                        <div className="text-xs text-slate-500">{d.sessions}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    Saturday has highest fill rate ({stats.dayOfWeekData.find(d => d.day === 6)?.fillRate.toFixed(1)}%) with {stats.dayOfWeekData.find(d => d.day === 6)?.sessions} sessions
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                Top Coaches
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {stats.topCoaches.map((coach, idx) => (
                  <div key={coach.name} className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
                      {idx + 1}
                    </div>
                    <div className="text-white font-medium truncate">{coach.name}</div>
                    <div className="flex items-center justify-center gap-1 text-amber-400 text-sm">
                      <Star className="w-3 h-3 fill-current" />
                      {coach.rating.toFixed(1)}
                    </div>
                    <div className="text-slate-400 text-xs mt-1">{coach.sessions} sessions</div>
                    <div className="text-slate-400 text-xs">{coach.students} students</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white">Program Performance</h3>
                <p className="text-sm text-slate-400 mt-1">Enrollment and fill rates by program</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Level</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Sessions</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Enrolled</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Fill Rate</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {stats.programData.map(prog => (
                      <tr key={prog.name} className="hover:bg-slate-700/30">
                        <td className="px-6 py-4 text-white font-medium">{prog.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            prog.level === 'mini' ? 'bg-emerald-500/20 text-emerald-400' :
                            prog.level === 'classic' ? 'bg-blue-500/20 text-blue-400' :
                            prog.level === 'premier' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {prog.level || 'other'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-300">{prog.sessions}</td>
                        <td className="px-6 py-4 text-center text-slate-300">{prog.enrolled}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  prog.fillRate >= 70 ? 'bg-emerald-500' :
                                  prog.fillRate >= 50 ? 'bg-cyan-500' :
                                  prog.fillRate >= 30 ? 'bg-amber-500' :
                                  'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(prog.fillRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-slate-300 text-sm w-12">{prog.fillRate.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-300">{formatCurrency(prog.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-700/50 rounded-xl p-6">
                <div className="text-emerald-400 text-sm font-medium mb-2">Top Performer</div>
                <div className="text-2xl font-bold text-white">{stats.programData[0]?.name}</div>
                <div className="text-slate-400 text-sm mt-1">{stats.programData[0]?.enrolled} students enrolled</div>
              </div>
              <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border border-cyan-700/50 rounded-xl p-6">
                <div className="text-cyan-400 text-sm font-medium mb-2">Highest Fill Rate</div>
                <div className="text-2xl font-bold text-white">
                  {stats.programData.sort((a, b) => b.fillRate - a.fillRate)[0]?.name}
                </div>
                <div className="text-slate-400 text-sm mt-1">
                  {stats.programData.sort((a, b) => b.fillRate - a.fillRate)[0]?.fillRate.toFixed(1)}% capacity filled
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 border border-amber-700/50 rounded-xl p-6">
                <div className="text-amber-400 text-sm font-medium mb-2">Average Price</div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(stats.programData.reduce((sum, p) => sum + p.price, 0) / stats.programData.length)}
                </div>
                <div className="text-slate-400 text-sm mt-1">Across all programs</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Enrollment by City
              </h3>
              <div className="space-y-4">
                {stats.cityData.slice(0, 8).map((city, idx) => {
                  const maxEnrolled = stats.cityData[0]?.enrolled || 1;
                  return (
                    <div key={city.city} className="flex items-center gap-4">
                      <div className="w-6 text-slate-500 text-sm">{idx + 1}</div>
                      <div className="w-40 text-slate-300 truncate">{city.city}</div>
                      <div className="flex-1 bg-slate-700 rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          style={{ width: `${(city.enrolled / maxEnrolled) * 100}%` }}
                        />
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-white font-medium">{city.enrolled}</span>
                        <span className="text-slate-400 text-sm ml-1">enrolled</span>
                      </div>
                      <div className="w-20 text-right text-slate-400 text-sm">
                        {city.sessions} sessions
                      </div>
                      <div className="w-16 text-right">
                        <span className={`text-sm font-medium ${
                          city.fillRate >= 60 ? 'text-emerald-400' :
                          city.fillRate >= 40 ? 'text-cyan-400' :
                          'text-amber-400'
                        }`}>
                          {city.fillRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">City Performance Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Cities</span>
                    <span className="text-white font-medium">{stats.cityData.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Top City</span>
                    <span className="text-white font-medium">{stats.cityData[0]?.city}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Top City Share</span>
                    <span className="text-white font-medium">
                      {((stats.cityData[0]?.enrolled || 0) / stats.sessions.totalEnrolled * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Avg Fill Rate (Top 5)</span>
                    <span className="text-white font-medium">
                      {(stats.cityData.slice(0, 5).reduce((sum, c) => sum + c.fillRate, 0) / 5).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Geographic Insights</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <ArrowUp className="w-4 h-4 text-emerald-400 mt-0.5" />
                    <p className="text-slate-300">
                      <strong className="text-white">Fullerton</strong> has highest fill rate at 74.1% despite fewer sessions
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400 mt-0.5" />
                    <p className="text-slate-300">
                      <strong className="text-white">Irvine</strong> shows strong demand with 64.8% fill rate
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ArrowDown className="w-4 h-4 text-amber-400 mt-0.5" />
                    <p className="text-slate-300">
                      <strong className="text-white">Orange</strong> has most sessions but lower fill rate (35.4%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'benchmarks' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 backdrop-blur-sm border border-emerald-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">NBC Sports Engine Benchmarks</h3>
              <p className="text-slate-400 text-sm mb-6">Based on analysis of 661 real Soccer Shots OC registrations</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <BenchmarkCard label="Preschool Revenue" value="74.8%" subtext="vs 25.2% community" />
                <BenchmarkCard label="Pay in Full" value="86.4%" subtext="8% use plans" />
                <BenchmarkCard label="Weekday Reg" value="92.3%" subtext="Peak: Thursday" />
                <BenchmarkCard label="Avg Price" value="$206" subtext="Sweet spot: $200-250" />
                <BenchmarkCard label="Multi-Child" value="8.1%" subtext="$56 avg discount" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Registration Day (NBC Benchmark)</h3>
                <div className="flex items-end justify-between gap-2 h-36">
                  {[
                    { day: 'Mon', pct: 20.6 },
                    { day: 'Tue', pct: 17.7 },
                    { day: 'Wed', pct: 18.6 },
                    { day: 'Thu', pct: 22.1 },
                    { day: 'Fri', pct: 13.3 },
                    { day: 'Sat', pct: 3.6 },
                    { day: 'Sun', pct: 4.1 },
                  ].map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t ${d.day === 'Thu' ? 'bg-emerald-500' : d.day === 'Sat' || d.day === 'Sun' ? 'bg-slate-600' : 'bg-blue-500'}`}
                        style={{ height: `${(d.pct / 22.1) * 100}%` }}
                      />
                      <div className="text-xs text-slate-400 mt-2">{d.day}</div>
                      <div className="text-xs text-slate-500">{d.pct}%</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">92.3% of registrations happen Monday-Friday</p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Geographic Distribution (NBC)</h3>
                <div className="space-y-3">
                  {[
                    { city: 'Irvine', pct: 19.4 },
                    { city: 'Tustin', pct: 6.7 },
                    { city: 'Lake Forest', pct: 4.7 },
                    { city: 'Orange', pct: 4.7 },
                    { city: 'Anaheim', pct: 4.5 },
                    { city: 'Huntington Beach', pct: 4.5 },
                  ].map((c) => (
                    <div key={c.city} className="flex items-center gap-3">
                      <div className="w-28 text-sm text-slate-300">{c.city}</div>
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 rounded-full h-2"
                          style={{ width: `${(c.pct / 19.4) * 100}%` }}
                        />
                      </div>
                      <div className="w-12 text-xs text-slate-400 text-right">{c.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Data vs NBC Benchmarks</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Metric</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">NBC Benchmark</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Your Data</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <ComparisonRow
                      label="Average Price"
                      benchmark="$206"
                      actual={formatCurrency(stats.registrations.avgAmount)}
                      status={stats.registrations.avgAmount >= 18000 && stats.registrations.avgAmount <= 25000 ? 'good' : 'warning'}
                    />
                    <ComparisonRow
                      label="Payment Success Rate"
                      benchmark="86.4%"
                      actual={`${Math.round(stats.registrations.paid / stats.registrations.total * 100)}%`}
                      status={stats.registrations.paid / stats.registrations.total >= 0.80 ? 'good' : 'warning'}
                    />
                    <ComparisonRow
                      label="Avg Children/Family"
                      benchmark="1.08"
                      actual={stats.families.avgChildrenPerFamily.toFixed(2)}
                      status={stats.families.avgChildrenPerFamily >= 1 ? 'good' : 'neutral'}
                    />
                    <ComparisonRow
                      label="Average Rating"
                      benchmark="4.5+"
                      actual={stats.reviews.avgOverall.toFixed(2)}
                      status={stats.reviews.avgOverall >= 4.5 ? 'good' : stats.reviews.avgOverall >= 4 ? 'neutral' : 'warning'}
                    />
                    <ComparisonRow
                      label="Fill Rate"
                      benchmark="~50%"
                      actual={`${stats.sessions.avgFillRate.toFixed(1)}%`}
                      status={stats.sessions.avgFillRate >= 50 ? 'good' : stats.sessions.avgFillRate >= 30 ? 'neutral' : 'warning'}
                    />
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Key Insights for KAIRO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-emerald-400 font-medium">Preschool Opportunity</h4>
                  <p className="text-sm text-slate-300">
                    74.8% of NBC revenue comes from preschool partnerships. Current sample data shows 0% preschool locations -
                    major opportunity to add preschool partner locations.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="text-cyan-400 font-medium">Payment Psychology</h4>
                  <p className="text-sm text-slate-300">
                    86.4% of parents pay in full. Design should show "Pay in Full" as primary option with payment plans as secondary.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="text-amber-400 font-medium">Mobile-First Validation</h4>
                  <p className="text-sm text-slate-300">
                    92.3% register on weekdays (work hours) confirming parents register on mobile while multitasking.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="text-rose-400 font-medium">Price Sweet Spot</h4>
                  <p className="text-sm text-slate-300">
                    $200-250 is the optimal price range. Current avg of {formatCurrency(stats.registrations.avgAmount)}
                    {stats.registrations.avgAmount < 20000 ? ' is below' : stats.registrations.avgAmount > 25000 ? ' is above' : ' is within'} the sweet spot.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
  color: 'cyan' | 'emerald' | 'amber' | 'rose' | 'blue' | 'yellow';
}) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm border rounded-xl p-4 md:p-6`}>
      <div className={`${colorClasses[color].split(' ').pop()} mb-2`}>{icon}</div>
      <div className="text-slate-400 text-xs md:text-sm mb-1">{label}</div>
      <div className="text-xl md:text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{subtext}</div>
    </div>
  );
}

function BenchmarkCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-emerald-300">{label}</div>
      <div className="text-xs text-slate-500">{subtext}</div>
    </div>
  );
}

function ComparisonRow({ label, benchmark, actual, status }: {
  label: string;
  benchmark: string;
  actual: string;
  status: 'good' | 'warning' | 'neutral';
}) {
  const statusColors = {
    good: 'bg-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/20 text-amber-400',
    neutral: 'bg-slate-500/20 text-slate-400',
  };
  const statusLabels = {
    good: 'On Track',
    warning: 'Review',
    neutral: 'Baseline',
  };

  return (
    <tr className="hover:bg-slate-700/30">
      <td className="px-4 py-3 text-slate-300">{label}</td>
      <td className="px-4 py-3 text-center text-slate-400">{benchmark}</td>
      <td className="px-4 py-3 text-center text-white font-medium">{actual}</td>
      <td className="px-4 py-3 text-center">
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </td>
    </tr>
  );
}
