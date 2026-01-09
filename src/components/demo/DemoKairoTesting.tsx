import { useState } from 'react';
import {
  CheckCircle, Database, Workflow, Code2, MessageSquare, Users,
  Calendar, MapPin, CreditCard, Clock, ArrowRight, ChevronDown,
  ChevronUp, Sparkles, Server, Zap, TestTube, FileCode, Bot
} from 'lucide-react';

interface TestCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'passed' | 'in_progress';
  description: string;
  tests: TestItem[];
}

interface TestItem {
  name: string;
  description: string;
  status: 'passed' | 'in_progress' | 'pending';
  details?: string[];
}

const testCategories: TestCategory[] = [
  {
    id: 'database',
    name: 'Database & Test Data',
    icon: <Database className="w-5 h-5" />,
    status: 'passed',
    description: '40+ migrations with comprehensive test data for realistic scenarios',
    tests: [
      {
        name: 'Core Tables Schema',
        description: '13 database tables with proper relationships',
        status: 'passed',
        details: ['Organizations', 'Programs', 'Sessions', 'Locations', 'Coaches', 'Families', 'Children', 'Registrations']
      },
      {
        name: 'Row Level Security',
        description: 'RLS policies for all tables',
        status: 'passed',
        details: ['Public read for sessions', 'Authenticated write', 'Organization scoping']
      },
      {
        name: 'Test Families & Children',
        description: '50+ test families with diverse scenarios',
        status: 'passed',
        details: ['Single child families', 'Multi-child families (2-4 kids)', 'Returning families', 'New families']
      },
      {
        name: 'Session Test Data',
        description: '100+ sessions across programs and locations',
        status: 'passed',
        details: ['Various capacity levels (20-100%)', 'Multiple age groups', 'Weekday and weekend options', 'Different coaches assigned']
      },
      {
        name: 'Registration Flow Tables',
        description: 'New tables for Kai conversation tracking',
        status: 'passed',
        details: ['kairo_chat_sessions', 'kairo_chat_messages', 'registration_intents', 'registration_cart']
      }
    ]
  },
  {
    id: 'n8n',
    name: 'n8n Workflow Architecture',
    icon: <Workflow className="w-5 h-5" />,
    status: 'in_progress',
    description: 'Complete n8n workflow for AI agent orchestration',
    tests: [
      {
        name: 'Webhook Trigger',
        description: 'Receives messages from frontend',
        status: 'passed',
        details: ['POST endpoint', 'JSON payload validation', 'Session ID tracking']
      },
      {
        name: 'Context Preparation',
        description: 'Builds context from database',
        status: 'passed',
        details: ['Session availability queries', 'Family history lookup', 'Discount eligibility check']
      },
      {
        name: 'AI Agent Node',
        description: 'Gemini 2.0 Flash integration',
        status: 'in_progress',
        details: ['System prompt configuration', 'Tool definitions', 'Response parsing']
      },
      {
        name: 'Database Tools',
        description: 'Supabase query tools for AI',
        status: 'passed',
        details: ['search_sessions', 'get_family_info', 'check_availability', 'calculate_pricing']
      },
      {
        name: 'Response Handler',
        description: 'Formats AI response for frontend',
        status: 'passed',
        details: ['Session cards', 'Quick replies', 'Error handling']
      }
    ]
  },
  {
    id: 'edge-functions',
    name: 'Edge Functions',
    icon: <Server className="w-5 h-5" />,
    status: 'passed',
    description: '3 deployed edge functions for Kai operations',
    tests: [
      {
        name: 'kai-conversation',
        description: 'Main conversation handler with Gemini',
        status: 'passed',
        details: ['CORS headers', 'Deno.serve pattern', 'Context file loading', 'Supabase client']
      },
      {
        name: 'session-recommendations',
        description: 'Fetches and ranks sessions',
        status: 'passed',
        details: ['Age filtering', 'Location proximity', 'Availability check', 'Coach preferences']
      },
      {
        name: 'find-alternatives',
        description: 'Suggests alternatives for full sessions',
        status: 'passed',
        details: ['Same day options', 'Same location options', 'Similar time slots', 'Waitlist option']
      }
    ]
  },
  {
    id: 'conversation',
    name: 'Conversation Scenarios',
    icon: <MessageSquare className="w-5 h-5" />,
    status: 'passed',
    description: '19 test scenarios covering diverse registration paths',
    tests: [
      {
        name: 'Basic Registration',
        description: 'Single child, new family flow',
        status: 'passed',
        details: ['Age extraction', 'Program recommendation', 'Session selection', 'Payment']
      },
      {
        name: 'Multi-Child Registration',
        description: 'Multiple children with sibling discount',
        status: 'passed',
        details: ['Multiple age handling', 'Sibling discount (25%)', 'Same day preferences', 'Combined checkout']
      },
      {
        name: 'Returning Family',
        description: 'Recognizes previous registrations',
        status: 'passed',
        details: ['History lookup', 'Loyalty discount (5%)', 'Same coach preference', 'Re-enrollment flow']
      },
      {
        name: 'Location-Based Search',
        description: 'ZIP code and proximity search',
        status: 'passed',
        details: ['92618 Irvine test', 'Distance sorting', 'Multiple location display', 'Availability status']
      },
      {
        name: 'Full Class Handling',
        description: 'Alternative suggestions when full',
        status: 'passed',
        details: ['Waitlist option', 'Same time alternatives', 'Same location alternatives', 'Next season']
      },
      {
        name: 'Discount Stacking',
        description: 'Early bird + sibling + loyalty',
        status: 'passed',
        details: ['Maximum 30% cap', 'Proper calculation', 'Discount breakdown display']
      }
    ]
  },
  {
    id: 'context-files',
    name: 'AI Context Files',
    icon: <FileCode className="w-5 h-5" />,
    status: 'passed',
    description: '6 markdown context files for Kai personality and rules',
    tests: [
      {
        name: 'business-rules.md',
        description: 'Pricing, discounts, capacity rules',
        status: 'passed',
        details: ['Session pricing tiers', 'Discount eligibility', 'Capacity warnings', 'Payment plans']
      },
      {
        name: 'communication-style.md',
        description: 'Kai personality and tone',
        status: 'passed',
        details: ['Friendly, helpful tone', 'Emoji usage guidelines', 'Response length limits', 'Error empathy']
      },
      {
        name: 'registration-flow.md',
        description: 'Step-by-step registration process',
        status: 'passed',
        details: ['Information gathering', 'Recommendation display', 'Cart management', 'Checkout']
      },
      {
        name: 'data-extraction.md',
        description: 'How to extract info from messages',
        status: 'passed',
        details: ['Child age patterns', 'Location detection', 'Schedule preferences', 'Intent classification']
      },
      {
        name: 'capacity-intelligence.md',
        description: 'Smart capacity management',
        status: 'passed',
        details: ['Low capacity warnings', 'Urgency messaging', 'Alternative triggers']
      },
      {
        name: 'error-handling.md',
        description: 'Graceful error recovery',
        status: 'passed',
        details: ['Missing info prompts', 'Invalid input handling', 'Fallback responses']
      }
    ]
  }
];

const architectureSteps = [
  { icon: <Users className="w-4 h-4" />, label: 'Parent sends message', sublabel: 'React frontend' },
  { icon: <Workflow className="w-4 h-4" />, label: 'n8n webhook receives', sublabel: 'Workflow trigger' },
  { icon: <Database className="w-4 h-4" />, label: 'Context prepared', sublabel: 'Supabase queries' },
  { icon: <Bot className="w-4 h-4" />, label: 'Gemini AI processes', sublabel: 'With tools' },
  { icon: <Zap className="w-4 h-4" />, label: 'Response formatted', sublabel: 'Session cards' },
  { icon: <MessageSquare className="w-4 h-4" />, label: 'Displayed to parent', sublabel: 'Chat UI' }
];

export function DemoKairoTesting() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('database');

  const totalTests = testCategories.reduce((sum, cat) => sum + cat.tests.length, 0);
  const passedTests = testCategories.reduce(
    (sum, cat) => sum + cat.tests.filter(t => t.status === 'passed').length,
    0
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-4">
            <TestTube className="w-4 h-4" />
            Testing Documentation
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Kairo Agent Testing</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Comprehensive testing infrastructure for the Kai registration AI, including database schemas,
            n8n workflows, edge functions, and conversation scenarios.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-white">{totalTests}</div>
            <div className="text-slate-400 text-sm">Total Test Cases</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-emerald-400">{passedTests}</div>
            <div className="text-slate-400 text-sm">Tests Passing</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-white">19</div>
            <div className="text-slate-400 text-sm">Chat Scenarios</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-white">40+</div>
            <div className="text-slate-400 text-sm">DB Migrations</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Workflow className="w-5 h-5 text-blue-400" />
            Architecture Flow
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {architectureSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-slate-300">
                    {step.icon}
                  </div>
                  <div className="text-center mt-1">
                    <div className="text-white text-xs font-medium">{step.label}</div>
                    <div className="text-slate-500 text-[10px]">{step.sublabel}</div>
                  </div>
                </div>
                {idx < architectureSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-600 mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {testCategories.map((category) => (
            <div
              key={category.id}
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    category.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {category.icon}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{category.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        category.status === 'passed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {category.status === 'passed' ? 'All Passing' : 'In Progress'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-sm">
                    {category.tests.filter(t => t.status === 'passed').length}/{category.tests.length} tests
                  </span>
                  {expandedCategory === category.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {expandedCategory === category.id && (
                <div className="px-5 pb-4 space-y-3">
                  {category.tests.map((test, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 rounded-lg p-4 border border-slate-700"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          test.status === 'passed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : test.status === 'in_progress'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {test.status === 'passed' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-medium">{test.name}</h4>
                          </div>
                          <p className="text-slate-400 text-sm mt-0.5">{test.description}</p>
                          {test.details && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {test.details.map((detail, dIdx) => (
                                <span
                                  key={dIdx}
                                  className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs"
                                >
                                  {detail}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">What's Being Tested</h3>
              <p className="text-slate-300 mb-4">
                The Kai registration agent uses a sophisticated architecture combining n8n workflows,
                Supabase edge functions, and Gemini 2.0 Flash AI. This testing infrastructure ensures
                reliable conversation handling across diverse registration scenarios.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Data Layer
                  </div>
                  <p className="text-slate-400 text-sm">
                    50+ families, 100+ sessions, realistic capacity patterns
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <Workflow className="w-4 h-4 text-blue-400" />
                    Orchestration
                  </div>
                  <p className="text-slate-400 text-sm">
                    n8n workflow with context prep, AI agent, and response handling
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <Bot className="w-4 h-4 text-amber-400" />
                    AI Agent
                  </div>
                  <p className="text-slate-400 text-sm">
                    Gemini 2.0 Flash with 6 context files and database tools
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
