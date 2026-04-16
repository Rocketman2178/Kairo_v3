import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Sparkles,
  MessageSquare,
  Calendar,
  CreditCard,
  AudioWaveform,
  Globe,
  TrendingUp,
  X,
  Clock,
  CheckCircle2,
  Users,
  CalendarDays,
  BarChart3,
  Megaphone,
  LineChart,
  Palette,
  UserCheck,
} from 'lucide-react';
import { ChatInterface } from '../components/registration/ChatInterface';
import { DemoCoachApp } from '../components/demo/DemoCoachApp';
import { DemoScheduling } from '../components/demo/DemoScheduling';
import { DemoAnalytics } from '../components/demo/DemoAnalytics';
import { DemoMarketing } from '../components/demo/DemoMarketing';
import { DemoDataInsights } from '../components/demo/DemoDataInsights';
import { DemoWhiteLabel } from '../components/demo/DemoWhiteLabel';

// Demo org (Soccer Stars seed data)
const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

interface ChatHandle {
  send: (text: string) => void;
  reset: () => void;
}

type SceneType = 'intro' | 'chat' | 'component';

interface Scene {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  feature: string;
  callout: string;
  talkingPoints: string[];
  type: SceneType;
  suggestedMessages?: string[];
  component?: React.ComponentType;
  autoReset?: boolean;
}

const SCENES: Scene[] = [
  // ========== ACT 1: PARENT JOURNEY ==========
  {
    id: 'problem',
    title: 'The Problem',
    subtitle: 'Youth sports registration is broken',
    icon: TrendingUp,
    feature: 'Market Context',
    callout: '',
    talkingPoints: [
      '40% of parents abandon online registration forms',
      'Average registration takes 8–12 minutes across legacy systems',
      'Operators lose 25%+ of potential revenue to friction',
      'Existing tools (iClassPro, NBC, Jackrabbit) treat registration as a form — not a conversation',
    ],
    type: 'intro',
  },
  {
    id: 'first-contact',
    title: 'First Contact',
    subtitle: 'Watch Kai greet a parent and collect info naturally',
    icon: MessageSquare,
    feature: 'Conversational AI',
    callout: 'Real AI — every response is unique',
    talkingPoints: [
      'Kai is a Gemini-powered AI agent trained on youth sports registration',
      'The intent classifier extracts child name, age, program, and preferences from any phrasing',
      'Notice: no form fields, no dropdowns, no friction',
      'Conversation history persists across messages automatically',
    ],
    suggestedMessages: [
      "Hi, I'd like to sign up my son for soccer",
      "My son Liam is 6 and loves soccer",
    ],
    type: 'chat',
    autoReset: true,
  },
  {
    id: 'session-search',
    title: 'Session Search',
    subtitle: 'Real sessions from the live database, rendered as interactive cards',
    icon: Calendar,
    feature: 'Live Data + Session Cards',
    callout: 'Live data from your program database',
    talkingPoints: [
      'Session cards render from real Supabase data — program, location, coach, capacity, price',
      'Filtered by age range, day preference, city, and time of day automatically',
      'Response time: ~5 seconds end-to-end (classifier + search + render)',
      'Cards are tappable — click Select to enter the registration flow',
    ],
    suggestedMessages: [
      "Saturdays in Irvine",
    ],
    type: 'chat',
  },
  {
    id: 'checkout',
    title: 'Checkout Flow',
    subtitle: 'From chat to payment in three clicks',
    icon: CreditCard,
    feature: 'Registration + Stripe',
    callout: 'Chat data flows into the form automatically',
    talkingPoints: [
      'Click Select on a session card — a pending registration token is generated',
      'Registration form is pre-filled with child data collected from chat',
      'Required field markers, smart DOB picker, combined medical/allergy field',
      'Stripe handles payment: full pay or 3-type installment plans',
      'Cart abandonment recovery catches drop-offs within 24 hours',
    ],
    type: 'chat',
  },
  {
    id: 'voice-mode',
    title: 'Voice Mode',
    subtitle: 'Real-time bidirectional voice — the future of registration',
    icon: AudioWaveform,
    feature: 'Gemini Live API',
    callout: 'Gemini Live API — real-time voice',
    talkingPoints: [
      'Click the waveform button in the chat input to launch Voice Mode',
      'Gemini Live API streams audio bidirectionally — no speech-to-text intermediary',
      'Server-side proxy keeps the API key secure (never exposed to browser)',
      'Auto-mute during agent response prevents echo',
      '18 voice options — pick warm, professional, or energetic tones per org',
    ],
    type: 'chat',
  },
  {
    id: 'spanish',
    title: 'Multi-Language',
    subtitle: 'Full Spanish support (and more coming)',
    icon: Globe,
    feature: 'i18n',
    callout: 'Full multi-language support',
    talkingPoints: [
      'Toggle the "ES" button in the chat header to switch to Spanish',
      'Classifier handles "mi hijo / mi hija" as child references (not the parent)',
      'Program names are mapped: fútbol → soccer, baloncesto → basketball, natación → swimming',
      '40% of US youth sports parents speak Spanish at home — this is a competitive moat',
    ],
    suggestedMessages: [
      "Hola, mi hijo tiene 5 años y quiere fútbol los sábados",
    ],
    type: 'chat',
    autoReset: true,
  },

  // ========== ACT 2: OPERATOR TOOLS ==========
  {
    id: 'coach-app',
    title: 'Coach App',
    subtitle: 'Mobile-first tools for coaches and staff',
    icon: UserCheck,
    feature: 'Staff Operations',
    callout: 'Built for the field — mobile-first',
    talkingPoints: [
      'Coaches see their schedule, roster, and attendance on their phone',
      'One-tap attendance check-in with QR code, phone number, or manual entry',
      'Medical notes and allergies surfaced at check-in — critical for safety',
      'Sub finder integration — coaches can request a sub with one click',
      'All attendance data flows to parents (notifications) and operators (analytics) in real-time',
    ],
    type: 'component',
    component: DemoCoachApp,
  },
  {
    id: 'scheduling',
    title: 'Smart Scheduling',
    subtitle: 'AI-assisted schedule builder with conflict detection',
    icon: CalendarDays,
    feature: 'Operational Intelligence',
    callout: 'AI helps operators build optimal schedules',
    talkingPoints: [
      'Drag-and-drop schedule builder — no spreadsheets needed',
      'AI suggests optimal times based on historical enrollment patterns',
      'Conflict detection prevents double-booking coaches, locations, or age groups',
      'Bulk actions: reschedule entire seasons in seconds',
      'Capacity intelligence predicts fill rates before you publish',
    ],
    type: 'component',
    component: DemoScheduling,
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    subtitle: 'Real-time revenue, enrollment, and operational metrics',
    icon: BarChart3,
    feature: 'Business Intelligence',
    callout: 'Every KPI in one dashboard',
    talkingPoints: [
      'Revenue tracking — current period vs. last year, projected completions',
      'Registration funnel — see exactly where parents drop off',
      'Churn prediction flags families at risk before they leave',
      'Fill rate by location, program, and day — optimize capacity',
      'Custom reports exportable to Excel for board meetings',
    ],
    type: 'component',
    component: DemoAnalytics,
  },

  // ========== ACT 3: GROWTH & INSIGHTS ==========
  {
    id: 'marketing',
    title: 'Marketing Automation',
    subtitle: 'Track ad spend, attribution, and ROI in one place',
    icon: Megaphone,
    feature: 'Growth Engine',
    callout: 'Attribute every dollar to a conversion',
    talkingPoints: [
      'Ad spend tracking across Facebook, Google, local sponsorships',
      'UTM attribution connects ad clicks to registration completions',
      'Automated cart recovery emails and SMS — proven 15-20% recovery rate',
      'Win-back campaigns for lapsed families using ML-predicted churn scores',
      'A/B test offers, subject lines, and landing pages directly in the platform',
    ],
    type: 'component',
    component: DemoMarketing,
  },
  {
    id: 'data-insights',
    title: 'Peer Benchmarking',
    subtitle: 'See how you stack up against similar operators (anonymously)',
    icon: LineChart,
    feature: 'Competitive Intelligence',
    callout: 'Anonymous benchmarking across the network',
    talkingPoints: [
      'Compare your fill rates, pricing, retention to similar-sized operators',
      'All data anonymized and aggregated — no operator sees another\'s specifics',
      'Identify underperforming programs vs. market average',
      'Pricing intelligence: are you leaving money on the table?',
      'Only possible because Kairo powers multiple operators on one platform',
    ],
    type: 'component',
    component: DemoDataInsights,
  },
  {
    id: 'white-label',
    title: 'White-Label Branding',
    subtitle: 'Your brand, your domain, your logo — powered by Kairo',
    icon: Palette,
    feature: 'Brand Control',
    callout: 'Parents see YOUR brand, not Kairo',
    talkingPoints: [
      'Custom subdomain: register.yourbrand.com',
      'Full logo, color, font customization — match your existing brand book',
      'Email and SMS templates branded with your organization',
      'Franchise/multi-location support — each location can customize within brand guidelines',
      'Your customers never know it\'s Kairo underneath',
    ],
    type: 'component',
    component: DemoWhiteLabel,
  },

  // ========== CLOSE ==========
  {
    id: 'results',
    title: 'The Result',
    subtitle: 'Ready to see this with YOUR programs?',
    icon: CheckCircle2,
    feature: 'Close',
    callout: '',
    talkingPoints: [
      'In under 15 minutes you saw: AI chat, session search, checkout, voice, Spanish, coach app, scheduling, analytics, marketing, benchmarking, white-label',
      'All of this runs on YOUR data — sessions, programs, locations, coaches, pricing',
      'Setup: 1–2 weeks for single location, 3–6 months for multi-unit with phased rollout',
      'Pricing: $149–$499/month based on org size and features',
      'Next step: 30-minute deep dive on your specific operations',
    ],
    type: 'intro',
  },
];

export default function SalesDemo() {
  const navigate = useNavigate();
  const [sceneIdx, setSceneIdx] = useState(0);
  const chatHandleRef = useRef<ChatHandle | null>(null);
  const [timerStart] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const scene = SCENES[sceneIdx];
  const isFirst = sceneIdx === 0;
  const isLast = sceneIdx === SCENES.length - 1;

  // Elapsed time counter
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - timerStart) / 1000)), 1000);
    return () => clearInterval(id);
  }, [timerStart]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' && !isLast) setSceneIdx(i => i + 1);
      if (e.key === 'ArrowLeft' && !isFirst) setSceneIdx(i => i - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFirst, isLast]);

  // Auto-reset chat on scene transitions that require fresh conversation
  useEffect(() => {
    if (scene.autoReset && chatHandleRef.current) {
      chatHandleRef.current.reset();
    }
  }, [sceneIdx, scene.autoReset]);

  const handleSendSuggested = useCallback((text: string) => {
    if (chatHandleRef.current) {
      chatHandleRef.current.send(text);
    }
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const SceneIcon = scene.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Kairo Sales Demo</h1>
              <p className="text-xs text-slate-400">Scene {sceneIdx + 1} of {SCENES.length} · {scene.feature}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-mono text-slate-300">{formatTime(elapsed)}</span>
            </div>

            <button
              onClick={() => setSceneIdx(i => Math.max(0, i - 1))}
              disabled={isFirst}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous scene"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="hidden md:flex gap-0.5">
              {SCENES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSceneIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === sceneIdx
                      ? 'bg-cyan-400 w-5'
                      : i < sceneIdx
                        ? 'bg-cyan-700 w-1.5'
                        : 'bg-slate-700 hover:bg-slate-600 w-1.5'
                  }`}
                  aria-label={`Scene ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => setSceneIdx(i => Math.min(SCENES.length - 1, i + 1))}
              disabled={isLast}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity flex items-center gap-2 text-sm font-medium"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Exit demo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scene content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Scene intro */}
        <div className="mb-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <SceneIcon className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{scene.title}</h2>
            <p className="text-slate-400 mt-1">{scene.subtitle}</p>
          </div>
        </div>

        {/* Two-column layout: main content + talking points */}
        <div className={`grid gap-6 ${scene.type !== 'intro' ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : 'grid-cols-1'}`}>
          {/* Left: Chat, Component, or Intro */}
          <div>
            {scene.type === 'chat' ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                {/* ChatInterface has its own built-in iPhone frame */}
                <div className="flex justify-center">
                  <ChatInterface
                    organizationId={DEMO_ORG_ID}
                    onReady={(handle) => {
                      chatHandleRef.current = handle;
                    }}
                  />
                </div>

                {/* Suggested messages */}
                {scene.suggestedMessages && scene.suggestedMessages.length > 0 && (
                  <div className="mt-6 max-w-md mx-auto space-y-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-medium flex items-center gap-2">
                      <Play className="w-3 h-3" />
                      Click to send
                    </p>
                    {scene.suggestedMessages.map((msg, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendSuggested(msg)}
                        className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-gradient-to-r hover:from-indigo-600/20 hover:to-cyan-600/20 hover:border-cyan-500/50 border border-slate-700 rounded-xl transition-all text-sm group"
                      >
                        <span className="text-slate-300 group-hover:text-white">"{msg}"</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : scene.type === 'component' && scene.component ? (
              // Component scene — render existing Demo component
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden">
                <div className="max-h-[80vh] overflow-y-auto">
                  <scene.component />
                </div>
              </div>
            ) : (
              // Intro/outro scene
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12">
                <div className="max-w-2xl mx-auto">
                  {scene.id === 'problem' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl">
                          <div className="text-4xl font-bold text-red-400">40%</div>
                          <p className="text-sm text-slate-400 mt-2">Cart abandonment on legacy platforms</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl">
                          <div className="text-4xl font-bold text-orange-400">8–12 min</div>
                          <p className="text-sm text-slate-400 mt-2">Avg time to complete a registration</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl">
                          <div className="text-4xl font-bold text-yellow-400">25%+</div>
                          <p className="text-sm text-slate-400 mt-2">Revenue lost to registration friction</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-xl">
                          <div className="text-4xl font-bold text-cyan-400">&lt;60s</div>
                          <p className="text-sm text-slate-400 mt-2">Kairo registration time (target)</p>
                        </div>
                      </div>
                      <p className="text-center text-slate-400 text-sm">
                        Let's show you how Kairo fixes this →
                      </p>
                    </div>
                  )}

                  {scene.id === 'results' && (
                    <div className="space-y-6 text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold mb-3">You just saw the future of youth sports software</h3>
                        <p className="text-slate-400">Parent-facing AI chat, coach app, smart scheduling, analytics, marketing, peer benchmarking — all in one platform.</p>
                      </div>
                      <div className="pt-6 space-y-3">
                        <button
                          onClick={() => navigate('/')}
                          className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                          Schedule Deep Dive →
                        </button>
                        <button
                          onClick={() => setSceneIdx(0)}
                          className="w-full py-3 px-6 bg-slate-800 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                        >
                          Restart Demo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Talking points (only when showing chat or component) */}
          {scene.type !== 'intro' && (
            <div className="space-y-4">
              {scene.callout && (
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-xl">
                  <p className="text-xs uppercase tracking-wide text-cyan-400 font-medium mb-1">Callout</p>
                  <p className="text-sm text-slate-200">{scene.callout}</p>
                </div>
              )}

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-3">Talking Points</p>
                <ul className="space-y-3">
                  {scene.talkingPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-cyan-400 mt-0.5 flex-shrink-0">›</span>
                      <span className="text-slate-300 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-xs text-slate-500 px-4 py-2">
                Tip: Use ← → arrow keys to navigate scenes
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
