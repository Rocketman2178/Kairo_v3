import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Sparkles, User, ChevronRight, Check, Phone, Star } from 'lucide-react';
import { SessionCard } from '../registration/SessionCard';
import { fetchSessionRecommendations, SessionRecommendation } from '../../services/demo/sessionFetcher';
import { DemoModalContext } from '../../contexts/DemoModalContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: SessionRecommendation[];
  quickReplies?: string[];
}

interface ScenarioOption {
  label: string;
  category: string;
  initialMessage: string;
}

const scenarioOptions: ScenarioOption[] = [
  {
    label: 'New parent - Single child',
    category: 'Basic',
    initialMessage: "My son Connor is 4 years old and he wants to play soccer"
  },
  {
    label: 'Multi-child registration',
    category: 'Advanced',
    initialMessage: "I have two kids - Emma is 4 and Liam is 6, both want to play soccer"
  },
  {
    label: 'Returning family',
    category: 'Advanced',
    initialMessage: "Hi! I registered my daughter last season at Beacon Park. I'd like to sign up again for Winter 2025"
  },
  {
    label: 'Sibling discount inquiry',
    category: 'Pricing',
    initialMessage: "Do you offer sibling discounts? I have 3 children I want to register"
  },
  {
    label: 'Early bird discount',
    category: 'Pricing',
    initialMessage: "I want to register early for the Spring season. Are there any discounts?"
  },
  {
    label: 'Payment plan options',
    category: 'Pricing',
    initialMessage: "Can I pay monthly instead of all at once? What are my payment options?"
  },
  {
    label: 'Saturday preference',
    category: 'Scheduling',
    initialMessage: "My daughter is 5 and we can only do Saturday mornings"
  },
  {
    label: 'Weekday preference',
    category: 'Scheduling',
    initialMessage: "Looking for weekday afternoon classes for my 6-year-old son"
  },
  {
    label: 'Location-specific request',
    category: 'Location',
    initialMessage: "I live near Irvine and need a class close to home for my 4-year-old"
  },
  {
    label: 'Specific coach request',
    category: 'Coach',
    initialMessage: "My friend's child loves Coach Mike. Can my son get into his class?"
  },
  {
    label: 'Class full - need alternatives',
    category: 'Problem Solving',
    initialMessage: "The Saturday 9am class at Lincoln Park is full. What other options do I have?"
  },
  {
    label: 'Special needs consideration',
    category: 'Special Needs',
    initialMessage: "My son is 5 and has ADHD. Do you have classes that work well for kids who need extra support?"
  },
  {
    label: 'Age eligibility question',
    category: 'Eligibility',
    initialMessage: "My daughter just turned 3. Is she old enough to start?"
  },
  {
    label: 'Season timing question',
    category: 'Scheduling',
    initialMessage: "When does the Winter season start and how many weeks is it?"
  },
  {
    label: 'Re-enrollment',
    category: 'Returning',
    initialMessage: "We loved the Fall season! How do I sign up for Winter with the same coach?"
  },
  {
    label: 'Compare programs',
    category: 'Programs',
    initialMessage: "What's the difference between Mini Soccer and Classic Soccer?"
  },
  {
    label: 'Preschool program',
    category: 'Preschool',
    initialMessage: "My daughter goes to Milestones Montessori in Irvine. They offer Soccer Shots - how do I register?"
  },
  {
    label: 'Quick pay in full',
    category: 'Pricing',
    initialMessage: "I just want to pay the full amount now. What's the total for my 4-year-old?"
  },
  {
    label: 'Zip code search',
    category: 'Location',
    initialMessage: "I'm in zip code 92618 - what classes are near me?"
  }
];

// Demo organization ID from test data
const DEMO_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

const demoResponses: Record<string, Omit<Message, 'id' | 'timestamp'>> = {
  'basic': {
    role: 'assistant',
    content: "Awesome! Connor sounds ready for some fun on the field! For a 4-year-old, our Mini Soccer program is perfect - it focuses on basic skills through games and activities. What days work best for you?",
    quickReplies: ['Weekday afternoons', 'Saturday mornings', 'Any day works']
  },
  'multichild': {
    role: 'assistant',
    content: "Wonderful! Registering both Emma and Liam together. Great news - you'll automatically get our 25% sibling discount on the 2nd child!\n\n• Emma (4) → Mini Soccer: $224\n• Liam (6) → Classic Soccer: $168 (25% off!)\n• **Total: $392** (save $56!)\n\nThat's just $24.50 per class for each child. What days work best for your family?",
    quickReplies: ['Same day for both', 'Saturdays work best', 'Show me all options']
  },
  'returning': {
    role: 'assistant',
    content: "Welcome back! I see you registered last season at Beacon Park on Saturday mornings. Great news - as a returning family, you qualify for our 5% loyalty discount!\n\nWould you like to continue with Saturday mornings at Beacon Park for Winter 2025?",
    quickReplies: ['Yes, same time slot', 'Show me other options', 'Tell me about the discount']
  },
  'sibling': {
    role: 'assistant',
    content: "Yes! We offer a 25% sibling discount on the 2nd and 3rd child. With 3 children, here's how it works:\n\n• 1st child: $224 (full price)\n• 2nd child: $168 (25% off - save $56!)\n• 3rd child: $168 (25% off - save $56!)\n• **Total: $560** (save $112!)\n\nPlus, you can stack this with our early bird discount if you register 30+ days before the season starts. What are your children's ages?",
    quickReplies: ['Tell me their ages', 'Show me the math', 'What about payment plans?']
  },
  'payment': {
    role: 'assistant',
    content: "Great choice! Most families prefer to pay in full and skip the hassle.\n\n**Pay in Full: $208**\nThat's just $26 per class for 8 weeks!\n\nWe also offer payment plans if needed:\n• $70/month x 3 months\n\nWould you like to complete your registration now?",
    quickReplies: ['Pay in full now', 'Show payment plans', 'Tell me about discounts']
  },
  'preschool': {
    role: 'assistant',
    content: "Great! Milestones Montessori is one of our partner preschools. Soccer Shots runs during school hours - so convenient!\n\n**Milestones Montessori - Classic Soccer**\n• Wednesdays during school hours\n• 8-week session: $208 ($26/class)\n• Jersey included (I'll auto-select size for your child's age)\n\n74% of our families are at preschool partners just like yours!",
    quickReplies: ['Register now', 'What size jersey?', 'See other preschools']
  },
  'payinfull': {
    role: 'assistant',
    content: "Perfect! For a 4-year-old, our Mini Soccer program is ideal.\n\n**Mini Soccer - 8 Week Session**\n• Total: $208 (just $26/class)\n• Jersey included\n• Age-appropriate curriculum\n\n86% of families pay in full - it's the easiest option! Ready to complete your registration?",
    quickReplies: ['Complete registration', 'Show me class times', 'Any discounts?']
  },
  'zipcode': {
    role: 'assistant',
    content: "Great! I found 3 locations near 92618 (Irvine):\n\n**1. Beacon Park** - 0.8 miles\nSaturdays 9:00 AM | 4 spots left\n\n**2. Irvine Montessori** - 1.2 miles\nWednesdays (during school) | 6 spots left\n\n**3. Central Park Field** - 2.1 miles\nMondays 4:00 PM | 8 spots left\n\nWhich location works best for your family?",
    quickReplies: ['Beacon Park', 'Irvine Montessori', 'Show all options']
  }
};

export function DemoChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [showScenarios, setShowScenarios] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const screenContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const simulateTyping = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        ...msg,
        id: Math.random().toString(),
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleScenarioSelect = async (scenario: ScenarioOption) => {
    setShowScenarios(false);
    setSelectedScenario(scenario.label);

    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: scenario.initialMessage,
      timestamp: new Date()
    };
    setMessages([userMessage]);

    if (scenario.initialMessage.includes('two kids')) {
      simulateTyping(demoResponses.multichild);
    } else if (scenario.initialMessage.includes('last season') || scenario.initialMessage.includes('sign up again')) {
      simulateTyping(demoResponses.returning);
    } else if (scenario.initialMessage.includes('sibling discount')) {
      simulateTyping(demoResponses.sibling);
    } else if (scenario.initialMessage.includes('payment') || scenario.initialMessage.includes('monthly')) {
      simulateTyping(demoResponses.payment);
    } else if (scenario.initialMessage.includes('Connor is 4') || scenario.initialMessage.includes('wants to play')) {
      simulateTyping(demoResponses.basic);
    } else if (scenario.initialMessage.includes('Saturday mornings')) {
      await fetchAndShowSessions({ ageMin: 4, ageMax: 5, dayOfWeek: 'Saturday', limit: 5 });
    } else if (scenario.initialMessage.includes('weekday afternoon')) {
      await fetchAndShowSessions({ ageMin: 5, ageMax: 7, limit: 5 });
    } else if (scenario.initialMessage.includes('near Irvine')) {
      await fetchAndShowSessions({ ageMin: 4, ageMax: 4, location: 'Irvine', limit: 5 });
    } else if (scenario.initialMessage.includes('Coach Mike')) {
      await fetchAndShowSessions({ coachName: 'Mike', limit: 5 });
    } else {
      simulateTyping({
        role: 'assistant',
        content: "Thanks for that information! Let me find the perfect options for you.",
        quickReplies: ['Show me options', 'Tell me more', 'Start over']
      });
    }
  };

  const fetchAndShowSessions = async (criteria: any) => {
    setIsTyping(true);
    try {
      const sessions = await fetchSessionRecommendations(DEMO_ORG_ID, criteria);

      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Math.random().toString(),
          role: 'assistant',
          content: sessions.length > 0
            ? `Perfect! I found ${sessions.length} great options for you. Here are my top recommendations:`
            : "I'm having trouble finding sessions right now. Let me show you some other options!",
          timestamp: new Date(),
          recommendations: sessions.slice(0, 3),
          quickReplies: sessions.length > 0 ? ['Tell me more', 'Show other times', 'Start over'] : ['Show all options', 'Start over']
        }]);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setTimeout(() => {
        simulateTyping({
          role: 'assistant',
          content: "I found some great options for you! Let me show you what's available.",
          quickReplies: ['Show me options', 'Start over']
        });
      }, 1000);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedSession) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: input || `I'd like to book the ${selectedSession} session`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    if (currentInput.toLowerCase().includes('saturday')) {
      await fetchAndShowSessions({ ageMin: 4, ageMax: 5, dayOfWeek: 'Saturday', limit: 5 });
    } else if (selectedSession) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Math.random().toString(),
          role: 'assistant',
          content: `Perfect choice! I've reserved your spot in the ${selectedSession} class. The 10-week session is $299 (or $100/month). Ready to complete registration?`,
          timestamp: new Date(),
          quickReplies: ['Pay now ($299)', 'Set up payment plan', 'I have questions']
        }]);
        setIsTyping(false);
      }, 1500);
    } else {
      simulateTyping({
        role: 'assistant',
        content: "Great! Let me help you with that. This is a demo - in the real app, I'd continue the conversation to complete your registration!",
        quickReplies: ['Show scenarios', 'Try another scenario']
      });
    }
    setSelectedSession(null);
  };

  const handleReset = () => {
    setMessages([]);
    setShowScenarios(true);
    setSelectedScenario(null);
    setRegistrationComplete(false);
  };

  const handleQuickReply = async (reply: string) => {
    if (reply.includes('Start over') || reply.includes('Show scenarios') || reply.includes('Try another')) {
      handleReset();
      return;
    }
    if (reply.includes('Pay now') || reply.includes('payment plan')) {
      handlePayment();
      return;
    }

    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: reply,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    if (reply.toLowerCase().includes('saturday')) {
      await fetchAndShowSessions({ ageMin: 4, ageMax: 5, dayOfWeek: 'Saturday', limit: 5 });
    } else if (reply.toLowerCase().includes('weekday')) {
      await fetchAndShowSessions({ ageMin: 4, ageMax: 6, limit: 5 });
    } else if (reply.toLowerCase().includes('same day')) {
      await fetchAndShowSessions({ ageMin: 4, ageMax: 7, dayOfWeek: 'Saturday', limit: 5 });
    } else {
      simulateTyping({
        role: 'assistant',
        content: "Great! Let me help you with that. This is a demo - in the real app, I'd continue the conversation to complete your registration!",
        quickReplies: ['Show scenarios', 'Try another scenario']
      });
    }
  };

  const handleSelectSession = (sessionId: string) => {
    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: `I'd like to register for this session`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: 'assistant',
        content: `Perfect choice! This is one of our most popular sessions. Ready to complete registration?`,
        timestamp: new Date(),
        quickReplies: ['Pay now', 'Set up payment plan', 'I have questions']
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const handlePayment = () => {
    setIsTyping(true);
    setTimeout(() => {
      setRegistrationComplete(true);
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: 'assistant',
        content: "Registration complete! Connor is all set for Mini Soccer. You'll receive a confirmation email with all the details, plus a calendar invite. See you on the field!",
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 2000);
  };

  const groupedScenarios = scenarioOptions.reduce((acc, scenario) => {
    if (!acc[scenario.category]) {
      acc[scenario.category] = [];
    }
    acc[scenario.category].push(scenario);
    return acc;
  }, {} as Record<string, ScenarioOption[]>);

  return (
    <DemoModalContext.Provider value={{ containerRef: screenContainerRef, isDemo: true }}>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-900 py-4 px-8">
        {/* iPhone Frame */}
        <div className="relative w-[390px] h-[780px] bg-slate-950 rounded-[3rem] shadow-2xl border-[14px] border-slate-950 overflow-hidden">
          {/* iPhone Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-slate-950 rounded-b-2xl z-50"></div>

          {/* Screen Content */}
          <div ref={screenContainerRef} className="relative h-full flex flex-col bg-slate-900 overflow-hidden">
            {/* Soccer Stars Branded Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-3 py-2 text-white pt-8 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600">
                    <Star className="w-5 h-5 fill-emerald-600" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-sm">Soccer Stars</h1>
                    <p className="text-emerald-100 text-xs">Youth Soccer Programs</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Talk with Kai</span>
                  </button>
                  {!showScenarios && (
                    <button
                      onClick={handleReset}
                      className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-900">
              {showScenarios && messages.length === 0 && (
                <div className="space-y-3">
                  {/* Kai's Welcome Message */}
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="max-w-[85%] rounded-2xl rounded-tl-md px-3 py-2 bg-slate-800 text-slate-100 border border-slate-700">
                      <p className="text-sm">Hi there! I'm Kai, your registration assistant for Soccer Stars. I can help you find the perfect soccer program for your child and get them signed up in just a few minutes. What would you like help with today?</p>
                    </div>
                  </div>

                  {/* Scenario Selection */}
                  <div className="ml-9 space-y-2">
                    <p className="text-slate-500 text-xs px-1">
                      Try a scenario to see Kai in action:
                    </p>

                  {Object.entries(groupedScenarios).map(([category, scenarios]) => (
                    <div key={category} className="space-y-1.5">
                      <h3 className="text-xs uppercase font-semibold text-slate-500 px-1">{category}</h3>
                      <div className="grid grid-cols-1 gap-1.5">
                        {scenarios.map((scenario, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleScenarioSelect(scenario)}
                            className="text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 rounded-lg transition-all text-white text-sm group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{scenario.label}</span>
                              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                            </div>
                            <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{scenario.initialMessage}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id}>
                  <div className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      message.role === 'assistant' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {message.role === 'assistant' ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                      message.role === 'assistant'
                        ? 'bg-slate-800 text-slate-100 rounded-tl-md border border-slate-700'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-tr-md'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                  </div>

                  {message.recommendations && message.recommendations.length > 0 && (
                    <div className="mt-2 ml-9 space-y-2">
                      {message.recommendations.map((session) => (
                        <div key={session.sessionId} className="transform scale-[0.92] origin-top-left">
                          <SessionCard
                            session={session}
                            onSelect={handleSelectSession}
                            organizationId={DEMO_ORG_ID}
                            isFull={session.spotsRemaining === 0}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {message.quickReplies && !registrationComplete && (
                    <div className="mt-2 ml-9 flex flex-wrap gap-1.5">
                      {message.quickReplies.map((reply, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickReply(reply)}
                          className="px-3 py-1.5 bg-slate-800 border border-slate-600 text-emerald-400 rounded-full text-xs font-medium hover:bg-slate-700 hover:border-emerald-500 transition-colors"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-md px-3 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {registrationComplete && (
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-400 text-sm">Registration Complete!</h3>
                      <p className="text-emerald-300 text-xs">Total time: 2 minutes 34 seconds</p>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {!showScenarios && (
              <div className="border-t border-slate-800 p-2 bg-slate-900 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsListening(!isListening)}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isListening ? "Listening..." : "Type a message..."}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="p-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {isListening && (
                  <div className="mt-1 flex items-center justify-center gap-2 text-red-400">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs">Voice recording active</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DemoModalContext.Provider>
  );
}
