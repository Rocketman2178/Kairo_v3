import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy, Check, ChevronDown, ChevronRight, ArrowLeft,
  Users, MapPin, Clock, AlertTriangle, Star, Zap,
  HelpCircle, Target, MessageSquare, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import {
  fetchAllSessions,
  generateScenariosFromSessions,
  type TestScenario,
  type ScenarioCategory as DataCategory
} from '@/services/testScenarios/sessionDataFetcher';

interface DisplayCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  scenarios: TestScenario[];
}

const iconMap: Record<string, React.ReactNode> = {
  'users': <Users className="w-5 h-5" />,
  'map-pin': <MapPin className="w-5 h-5" />,
  'clock': <Clock className="w-5 h-5" />,
  'alert-triangle': <AlertTriangle className="w-5 h-5" />,
  'star': <Star className="w-5 h-5" />,
  'zap': <Zap className="w-5 h-5" />,
  'help-circle': <HelpCircle className="w-5 h-5" />,
  'target': <Target className="w-5 h-5" />,
  'message-square': <MessageSquare className="w-5 h-5" />,
};

function toDisplay(cat: DataCategory): DisplayCategory {
  return { ...cat, icon: iconMap[cat.icon] || <HelpCircle className="w-5 h-5" /> };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-slate-600 transition-colors flex-shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400" />
      )}
    </button>
  );
}

function ScenarioCard({ scenario }: { scenario: TestScenario }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allPrompts = scenario.prompts.join('\n\n');
    navigator.clipboard.writeText(allPrompts);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-700/30 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white">{scenario.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{scenario.description}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {scenario.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-[10px] rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-700/50 pt-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Test Prompts (send in order)
              </h5>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded-md transition-colors"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy All Prompts
                  </>
                )}
              </button>
            </div>
            <div className="space-y-2">
              {scenario.prompts.map((prompt, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2"
                >
                  <span className="text-xs text-slate-500 font-mono w-5 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <p className="text-sm text-emerald-300 flex-1 font-mono">
                    "{prompt}"
                  </p>
                  <CopyButton text={prompt} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Expected Behavior
            </h5>
            <p className="text-sm text-slate-300 bg-slate-900/60 rounded-lg px-3 py-2.5 leading-relaxed">
              {scenario.expectedBehavior}
            </p>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Relevant Data Points
            </h5>
            <ul className="space-y-1">
              {scenario.dataPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-slate-600 mt-0.5">-</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function CategorySection({ category }: { category: DisplayCategory }) {
  const [expanded, setExpanded] = useState(true);

  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
    slate: 'from-slate-500/20 to-slate-500/5 border-slate-500/30',
    teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/30',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30',
  };

  const iconColorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
    slate: 'text-slate-400',
    teal: 'text-teal-400',
    rose: 'text-rose-400',
  };

  return (
    <div className="rounded-xl border border-slate-700/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-5 py-4 flex items-center gap-3 text-left bg-gradient-to-r ${colorMap[category.color]} hover:brightness-110 transition-all`}
      >
        <div className={iconColorMap[category.color]}>{category.icon}</div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white">{category.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{category.description}</p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full">
          {category.scenarios.length} scenarios
        </span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="p-3 space-y-2 bg-slate-900/30">
          {category.scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TestScenarios() {
  const [categories, setCategories] = useState<DisplayCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sessionStats, setSessionStats] = useState({ programs: 0, sessions: 0, full: 0, locations: 0 });

  const loadScenarios = async () => {
    try {
      setLoading(true);
      setError(false);
      const sessions = await fetchAllSessions();

      if (sessions.length === 0) {
        setError(true);
        return;
      }

      setSessionStats({
        programs: new Set(sessions.map(s => s.program_name)).size,
        sessions: sessions.length,
        full: sessions.filter(s => s.urgency_level === 'full').length,
        locations: new Set(sessions.map(s => s.location_name)).size
      });

      const dataCategories = generateScenariosFromSessions(sessions);
      setCategories(dataCategories.map(toDisplay));
    } catch (err) {
      console.error('Error loading scenarios:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  const totalScenarios = categories.reduce((sum, cat) => sum + cat.scenarios.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a2332] to-[#0f1419]">
      <header className="sticky top-0 z-50 bg-[#0f1419]/95 border-b border-slate-800 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">Test Scenarios</h1>
              <p className="text-xs text-slate-400">
                {loading
                  ? 'Loading scenarios from database...'
                  : error
                    ? 'Failed to load from database'
                    : `${totalScenarios} scenarios across ${categories.length} categories - based on live Supabase data`
                }
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors"
          >
            Open Chat
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
          <h2 className="text-sm font-semibold text-white mb-2">How to Use</h2>
          <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
            <li>Open the chat interface by clicking "Open Chat" above</li>
            <li>Pick a scenario category below and expand a test case</li>
            <li>Click "Copy All Prompts" to copy all prompts at once, or copy individual prompts one at a time</li>
            <li>Paste prompts into the chat and send them (send each prompt separately in order)</li>
            <li>Compare Kai's responses against the "Expected Behavior" section</li>
            <li>Verify that the correct sessions, prices, and availability are shown</li>
          </ol>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading session data from Supabase...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <div className="text-center">
              <p className="text-sm text-white font-medium">Failed to load session data</p>
              <p className="text-xs text-slate-400 mt-1">Could not connect to the database to generate test scenarios.</p>
            </div>
            <button
              onClick={loadScenarios}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-3 text-center">
                <p className="text-2xl font-bold text-white">{sessionStats.programs}</p>
                <p className="text-xs text-slate-400">Programs</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-3 text-center">
                <p className="text-2xl font-bold text-white">{sessionStats.sessions}</p>
                <p className="text-xs text-slate-400">Active Sessions</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-3 text-center">
                <p className="text-2xl font-bold text-white">{sessionStats.full}</p>
                <p className="text-xs text-slate-400">Full Sessions</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-3 text-center">
                <p className="text-2xl font-bold text-white">{sessionStats.locations}</p>
                <p className="text-xs text-slate-400">Locations</p>
              </div>
            </div>

            {categories.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))}
          </>
        )}
      </main>
    </div>
  );
}
