import {
  Bot, Database, MessageSquare, Smartphone, Monitor, PhoneCall,
  Zap, Clock, Users, Brain, Globe, Mic, MessageCircle, ArrowRight,
  CheckCircle2, Sparkles, Heart, Shield, TrendingUp
} from 'lucide-react';

export function DemoKaiAgent() {
  const agentCapabilities = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Always On',
      description: '24/7 availability without breaks, holidays, or sick days',
      color: 'emerald'
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Infinitely Scalable',
      description: 'Handle 1 or 10,000 conversations simultaneously',
      color: 'blue'
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: 'Personalized Service',
      description: 'Remembers preferences, children, and past interactions',
      color: 'rose'
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: 'Multi-Channel',
      description: 'Same experience via app, website, or phone',
      color: 'amber'
    }
  ];

  const channels = [
    { icon: <Smartphone className="w-8 h-8" />, label: 'Mobile App', desc: 'Native chat experience' },
    { icon: <Monitor className="w-8 h-8" />, label: 'Website', desc: 'Embedded widget' },
    { icon: <PhoneCall className="w-8 h-8" />, label: 'Phone', desc: 'Voice conversations' }
  ];

  const inputModes = [
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Text Chat', active: true },
    { icon: <Mic className="w-5 h-5" />, label: 'Voice Input', active: true },
    { icon: <MessageCircle className="w-5 h-5" />, label: 'Quick Replies', active: true }
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>NEW</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Meet Kai - Your AI Registration Agent</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            A sophisticated AI agent powered by n8n workflows that delivers human-like conversations,
            intelligent recommendations, and seamless registration completion.
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">How Kai Works</h2>
                <p className="text-slate-400 text-sm">Real-time AI agent architecture</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid lg:grid-cols-5 gap-4 items-center">
              <div className="lg:col-span-1 flex flex-col items-center text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">Parent</h3>
                <p className="text-slate-500 text-xs">Sends message via chat, voice, or phone</p>
              </div>

              <div className="hidden lg:flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-slate-600" />
              </div>

              <div className="lg:col-span-1 flex flex-col items-center text-center p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/30">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-1">Kai AI Agent</h3>
                <p className="text-slate-400 text-xs">Processes intent and context intelligently</p>
              </div>

              <div className="hidden lg:flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-slate-600" />
              </div>

              <div className="lg:col-span-1 flex flex-col items-center text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-3">
                  <Database className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">Database</h3>
                <p className="text-slate-500 text-xs">Sessions, families, history</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
              <h4 className="text-slate-300 font-medium mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-400" />
                What Kai Does In Real-Time
              </h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  'Understands natural language questions',
                  'Accesses conversation history for context',
                  'Queries database for availability',
                  'Returns personalized recommendations',
                  'Handles objections intelligently',
                  'Processes registration actions',
                  'Sends confirmations automatically',
                  'Escalates to human when needed'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {agentCapabilities.map((cap, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-xl border ${
                cap.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
                cap.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' :
                cap.color === 'rose' ? 'bg-rose-500/10 border-rose-500/20' :
                'bg-amber-500/10 border-amber-500/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                cap.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                cap.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                cap.color === 'rose' ? 'bg-rose-500/20 text-rose-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {cap.icon}
              </div>
              <h3 className="text-white font-semibold mb-1">{cap.title}</h3>
              <p className="text-slate-400 text-sm">{cap.description}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Multi-Channel Delivery
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Kai delivers the same intelligent, personalized experience regardless of how parents choose to interact.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {channels.map((channel, idx) => (
                <div key={idx} className="p-4 bg-slate-700/50 rounded-xl text-center border border-slate-600 hover:border-blue-500/50 transition-colors">
                  <div className="text-blue-400 flex justify-center mb-2">{channel.icon}</div>
                  <h4 className="text-white font-medium text-sm">{channel.label}</h4>
                  <p className="text-slate-500 text-xs mt-1">{channel.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              Input Flexibility
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Parents can communicate however is most convenient - typing, talking, or tapping quick replies.
            </p>
            <div className="space-y-3">
              {inputModes.map((mode, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                      {mode.icon}
                    </div>
                    <span className="text-white font-medium">{mode.label}</span>
                  </div>
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Enterprise-Ready Architecture</h3>
              <p className="text-blue-100 mb-4">
                Kai is built on proven infrastructure that scales with your business. The n8n workflow engine
                processes thousands of concurrent conversations while maintaining sub-second response times.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: 'Response Time', value: '< 2 seconds' },
                  { label: 'Uptime SLA', value: '99.9%' },
                  { label: 'Concurrent Users', value: 'Unlimited' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-blue-200 text-xs uppercase font-medium">{stat.label}</p>
                    <p className="text-white text-xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Conversation Flow Example
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="bg-slate-700/50 rounded-xl rounded-tl-sm p-3 max-w-md">
                <p className="text-slate-300 text-sm">"Hi, I want to sign up my 5-year-old for soccer near downtown"</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl rounded-tr-sm p-3 max-w-md">
                <p className="text-slate-300 text-sm">
                  "Great! I found 3 Mini Kickers classes for ages 4-6 near downtown. The Saturday 9am class at Lincoln Park
                  has 4 spots left and gets excellent reviews. Would you like me to tell you more about it?"
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                  <Database className="w-3 h-3" />
                  <span>Queried: sessions, locations, reviews</span>
                </div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="bg-slate-700/50 rounded-xl rounded-tl-sm p-3 max-w-md">
                <p className="text-slate-300 text-sm">"Yes, and can I get my other kid Emma in too? She's 8"</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl rounded-tr-sm p-3 max-w-md">
                <p className="text-slate-300 text-sm">
                  "Perfect! For Emma at 8, I'd recommend our Junior Stars program at the same location.
                  There's a Saturday 10:30am class right after the Mini Kickers - convenient for you!
                  I can register both children and apply a 10% sibling discount. Ready to proceed?"
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                  <Database className="w-3 h-3" />
                  <span>Accessed: family profile, discount rules, scheduling</span>
                </div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
