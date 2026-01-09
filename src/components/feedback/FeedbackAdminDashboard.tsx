import { useState, useEffect } from 'react';
import { X, Download, TrendingUp, Users, Star, Clock, ChevronDown, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FeedbackAdminDashboardProps {
  onClose: () => void;
}

interface FeedbackEntry {
  id: string;
  created_at: string;
  total_points_earned: number;
  completion_percentage: number;
  registration_pain_score: number;
  nps_score: number;
  respondent_email: string;
  respondent_organization: string;
  respondent_name: string;
  respondent_role: string;
  monthly_budget_range: string;
  decision_timeline: string;
  badges_earned: string[];
  most_valuable_ai_concept: string;
  platform_resistance_reason: string;
  biggest_registration_headache: string;
}

export function FeedbackAdminDashboard({ onClose }: FeedbackAdminDashboardProps) {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<FeedbackEntry | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, [timeRange]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      let query = supabase.from('tiger_tank_feedback').select('*').order('created_at', { ascending: false });

      if (timeRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        switch (timeRange) {
          case 'day':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    if (feedback.length === 0) return { avgPain: 0, avgNPS: 0, completionRate: 0, totalResponses: 0 };

    const validPain = feedback.filter(f => f.registration_pain_score != null);
    const validNPS = feedback.filter(f => f.nps_score != null);

    return {
      avgPain: validPain.length ? validPain.reduce((sum, f) => sum + f.registration_pain_score, 0) / validPain.length : 0,
      avgNPS: validNPS.length ? validNPS.reduce((sum, f) => sum + f.nps_score, 0) / validNPS.length : 0,
      completionRate: feedback.filter(f => (f.completion_percentage || 0) >= 80).length / feedback.length * 100,
      totalResponses: feedback.length
    };
  };

  const metrics = calculateMetrics();

  const getBudgetDistribution = () => {
    const distribution: Record<string, number> = {};
    feedback.forEach(f => {
      if (f.monthly_budget_range) {
        distribution[f.monthly_budget_range] = (distribution[f.monthly_budget_range] || 0) + 1;
      }
    });
    return distribution;
  };

  const getTimelineDistribution = () => {
    const distribution: Record<string, number> = {};
    feedback.forEach(f => {
      if (f.decision_timeline) {
        distribution[f.decision_timeline] = (distribution[f.decision_timeline] || 0) + 1;
      }
    });
    return distribution;
  };

  const exportCSV = () => {
    const headers = ['Date', 'Name', 'Email', 'Organization', 'Role', 'Pain Score', 'NPS', 'Budget', 'Timeline', 'Completion %'];
    const rows = feedback.map(f => [
      new Date(f.created_at).toLocaleDateString(),
      f.respondent_name || '',
      f.respondent_email || '',
      f.respondent_organization || '',
      f.respondent_role || '',
      f.registration_pain_score?.toString() || '',
      f.nps_score?.toString() || '',
      f.monthly_budget_range || '',
      f.decision_timeline || '',
      f.completion_percentage?.toString() || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kairo-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const budgetData = getBudgetDistribution();
  const timelineData = getTimelineDistribution();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Feedback Analytics</h2>
            <p className="text-slate-400 text-sm">{feedback.length} total responses</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 pr-10 appearance-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <MetricCard
                  icon={<Users className="w-5 h-5" />}
                  label="Total Responses"
                  value={metrics.totalResponses.toString()}
                  color="text-blue-400"
                />
                <MetricCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Avg Pain Score"
                  value={metrics.avgPain.toFixed(1)}
                  color="text-red-400"
                />
                <MetricCard
                  icon={<Star className="w-5 h-5" />}
                  label="Avg NPS"
                  value={metrics.avgNPS.toFixed(1)}
                  color="text-amber-400"
                />
                <MetricCard
                  icon={<Clock className="w-5 h-5" />}
                  label="Completion Rate"
                  value={`${metrics.completionRate.toFixed(0)}%`}
                  color="text-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <h3 className="text-white font-medium mb-4">Budget Range Distribution</h3>
                  <div className="space-y-2">
                    {Object.entries(budgetData).map(([budget, count]) => (
                      <div key={budget} className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-600 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all"
                            style={{ width: `${(count / feedback.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-300 text-sm w-32 truncate">{budget}</span>
                        <span className="text-white font-medium w-8 text-right">{count}</span>
                      </div>
                    ))}
                    {Object.keys(budgetData).length === 0 && (
                      <p className="text-slate-500 text-sm">No data available</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-xl p-4">
                  <h3 className="text-white font-medium mb-4">Decision Timeline</h3>
                  <div className="space-y-2">
                    {Object.entries(timelineData).map(([timeline, count]) => (
                      <div key={timeline} className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-600 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${(count / feedback.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-300 text-sm w-32 truncate">{timeline}</span>
                        <span className="text-white font-medium w-8 text-right">{count}</span>
                      </div>
                    ))}
                    {Object.keys(timelineData).length === 0 && (
                      <p className="text-slate-500 text-sm">No data available</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-600">
                  <h3 className="text-white font-medium">Recent Responses</h3>
                </div>
                <div className="divide-y divide-slate-600">
                  {feedback.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 hover:bg-slate-600/50 transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-medium">
                          {(entry.respondent_name || entry.respondent_email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {entry.respondent_name || entry.respondent_email || 'Anonymous'}
                          </p>
                          <p className="text-slate-400 text-sm">
                            {entry.respondent_organization || 'No organization'} - {entry.respondent_role || 'Unknown role'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-white font-medium">{entry.registration_pain_score || '-'}</p>
                          <p className="text-slate-500 text-xs">Pain</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-medium">{entry.nps_score || '-'}</p>
                          <p className="text-slate-500 text-xs">NPS</p>
                        </div>
                        <div className="text-center">
                          <p className="text-amber-400 font-medium">{entry.total_points_earned || 0}</p>
                          <p className="text-slate-500 text-xs">Points</p>
                        </div>
                        <Eye className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                  {feedback.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      No feedback responses yet
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {selectedEntry && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4" onClick={() => setSelectedEntry(null)}>
            <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedEntry.respondent_name || 'Anonymous'}</h3>
                  <p className="text-slate-400 text-sm">{selectedEntry.respondent_email}</p>
                </div>
                <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-sm">Organization</p>
                    <p className="text-white font-medium">{selectedEntry.respondent_organization || '-'}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-sm">Role</p>
                    <p className="text-white font-medium">{selectedEntry.respondent_role || '-'}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-sm">Budget Range</p>
                    <p className="text-white font-medium">{selectedEntry.monthly_budget_range || '-'}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-sm">Timeline</p>
                    <p className="text-white font-medium">{selectedEntry.decision_timeline || '-'}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-sm">Points Earned</p>
                    <p className="text-amber-400 font-medium">{selectedEntry.total_points_earned || 0}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-sm">Completion</p>
                    <p className="text-emerald-400 font-medium">{selectedEntry.completion_percentage || 0}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{selectedEntry.registration_pain_score || '-'}</p>
                    <p className="text-slate-500 text-sm">Pain Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-400">{selectedEntry.nps_score || '-'}</p>
                    <p className="text-slate-500 text-sm">NPS</p>
                  </div>
                </div>
                {selectedEntry.badges_earned && selectedEntry.badges_earned.length > 0 && (
                  <div className="mb-6">
                    <p className="text-slate-400 text-sm mb-2">Badges Earned</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.badges_earned.map(badge => (
                        <span key={badge} className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-slate-400 text-sm mb-2">Submitted</p>
                  <p className="text-white">{new Date(selectedEntry.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-700/50 rounded-xl p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-slate-400 text-sm">{label}</p>
    </div>
  );
}
