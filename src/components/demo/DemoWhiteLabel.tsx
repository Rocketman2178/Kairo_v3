import { useState } from 'react';
import {
  Palette, Type, Image, Globe, MessageCircle, Sparkles, Eye,
  Check, ChevronRight, Settings, Code, Webhook, Mic, Volume2, Languages
} from 'lucide-react';

interface BrandSettings {
  primaryColor: string;
  secondaryColor: string;
  agentName: string;
  logoUrl: string;
  welcomeMessage: string;
  businessName: string;
  voiceAccent: string;
  voiceLanguage: string;
}

const presets = [
  { name: 'Soccer Shots', primary: '#2563eb', secondary: '#10b981', agent: 'Kai' },
  { name: 'Splash Swim', primary: '#0891b2', secondary: '#06b6d4', agent: 'Splash' },
  { name: 'Tiny Dancers', primary: '#db2777', secondary: '#f472b6', agent: 'Grace' },
  { name: 'Little Ninjas', primary: '#dc2626', secondary: '#f97316', agent: 'Sensei' }
];

export function DemoWhiteLabel() {
  const [settings, setSettings] = useState<BrandSettings>({
    primaryColor: '#2563eb',
    secondaryColor: '#10b981',
    agentName: 'Kai',
    logoUrl: '',
    welcomeMessage: "Hi there! I'm {agent}, your registration assistant. I can help you find the perfect class for your child in just a few minutes!",
    businessName: 'Soccer Shots',
    voiceAccent: 'american',
    voiceLanguage: 'english'
  });

  const [activeTab, setActiveTab] = useState<'brand' | 'agent' | 'voice' | 'api'>('brand');
  const [showPreview, setShowPreview] = useState(false);

  const updateSetting = <K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setSettings(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      agentName: preset.agent,
      businessName: preset.name
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">White-Label Settings</h1>
          <p className="text-slate-600">Customize the platform to match your brand</p>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'brand', label: 'Brand & Colors', icon: <Palette className="w-4 h-4" /> },
          { id: 'agent', label: 'AI Agent', icon: <MessageCircle className="w-4 h-4" /> },
          { id: 'voice', label: 'Voice & Language', icon: <Mic className="w-4 h-4" /> },
          { id: 'api', label: 'API & Webhooks', icon: <Code className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          {activeTab === 'brand' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Quick Presets</h3>
                <div className="grid grid-cols-2 gap-3">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        settings.businessName === preset.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: preset.secondary }}
                        />
                      </div>
                      <p className="font-medium text-slate-900 text-sm">{preset.name}</p>
                      <p className="text-xs text-slate-500">Agent: {preset.agent}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Brand Colors</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="w-12 h-12 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                        className="w-12 h-12 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Business Identity</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      value={settings.businessName}
                      onChange={(e) => updateSetting('businessName', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Logo URL</label>
                    <input
                      type="text"
                      value={settings.logoUrl}
                      onChange={(e) => updateSetting('logoUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agent' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">AI Agent Persona</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Agent Name</label>
                    <input
                      type="text"
                      value={settings.agentName}
                      onChange={(e) => updateSetting('agentName', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      This is how the AI introduces itself to parents
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Welcome Message</label>
                    <textarea
                      rows={4}
                      value={settings.welcomeMessage}
                      onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg resize-none"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Use {'{agent}'} to insert the agent name dynamically
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Response Style</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Friendly & Casual', desc: 'Warm, conversational tone' },
                    { label: 'Professional', desc: 'Formal but approachable' },
                    { label: 'Energetic', desc: 'Enthusiastic and upbeat' }
                  ].map((style, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="style"
                        defaultChecked={idx === 0}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{style.label}</p>
                        <p className="text-sm text-slate-500">{style.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-2">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Mic className="w-5 h-5" />
                  <span className="font-semibold">Voice Customization</span>
                </div>
                <p className="text-sm text-blue-600">
                  Customize your AI agent's voice and accent to match your brand and connect with your customer base.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Regional Accent</h3>
                <div className="space-y-3">
                  {[
                    { id: 'american', label: 'American English', desc: 'Standard US accent - great for general audiences', flag: 'US' },
                    { id: 'british', label: 'British English', desc: 'Ideal for soccer/football organizations', flag: 'GB' },
                    { id: 'latin', label: 'Latin American Spanish', desc: 'Perfect for Miami and Hispanic markets', flag: 'MX' },
                    { id: 'australian', label: 'Australian English', desc: 'Friendly, approachable tone', flag: 'AU' }
                  ].map((accent) => (
                    <label
                      key={accent.id}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                        settings.voiceAccent === accent.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="accent"
                        value={accent.id}
                        checked={settings.voiceAccent === accent.id}
                        onChange={(e) => updateSetting('voiceAccent', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg font-bold">
                        {accent.flag}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{accent.label}</p>
                        <p className="text-sm text-slate-500">{accent.desc}</p>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Language Support</h3>
                <div className="space-y-3">
                  {[
                    { id: 'english', label: 'English', native: 'English', enabled: true },
                    { id: 'spanish', label: 'Spanish', native: 'Espanol', enabled: true },
                    { id: 'portuguese', label: 'Portuguese', native: 'Portugues', enabled: false },
                    { id: 'french', label: 'French', native: 'Francais', enabled: false }
                  ].map((lang) => (
                    <div
                      key={lang.id}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        lang.enabled ? 'border-slate-200' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Languages className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{lang.label}</p>
                          <p className="text-sm text-slate-500">{lang.native}</p>
                        </div>
                      </div>
                      {lang.enabled ? (
                        <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Coming Soon</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  Auto-detect parent language preference or let them choose during conversation.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Voice Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Voice Gender</label>
                    <div className="flex gap-3">
                      {['Female', 'Male', 'Neutral'].map((gender) => (
                        <button
                          key={gender}
                          className={`flex-1 py-2 px-4 rounded-lg border font-medium transition-colors ${
                            gender === 'Female'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Speaking Speed</label>
                    <input
                      type="range"
                      min="0.75"
                      max="1.25"
                      step="0.05"
                      defaultValue="1"
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Slower</span>
                      <span>Normal</span>
                      <span>Faster</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">API Credentials</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value="sk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                        readOnly
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-sm"
                      />
                      <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Organization ID</label>
                    <input
                      type="text"
                      value="org_soccer_shots_demo"
                      readOnly
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Webhooks</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    + Add Webhook
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { event: 'registration.completed', url: 'https://api.example.com/hooks/registration', status: 'active' },
                    { event: 'payment.successful', url: 'https://api.example.com/hooks/payment', status: 'active' },
                    { event: 'enrollment.cancelled', url: 'https://api.example.com/hooks/cancel', status: 'inactive' }
                  ].map((webhook, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Webhook className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{webhook.event}</p>
                          <p className="text-xs text-slate-500 font-mono">{webhook.url}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        webhook.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {webhook.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Custom Domain</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-900">register.soccershots.com</p>
                      <p className="text-sm text-emerald-700">SSL active, DNS verified</p>
                    </div>
                  </div>
                  <button className="w-full py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
                    Add Another Domain
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {showPreview && (
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-slate-900 rounded-t-2xl p-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="ml-4 text-slate-400 text-sm">Preview</span>
              </div>
            </div>
            <div className="border border-slate-200 rounded-b-2xl overflow-hidden bg-white">
              <div
                className="p-4"
                style={{ background: `linear-gradient(to right, ${settings.primaryColor}, ${settings.secondaryColor})` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-white">
                    <h3 className="font-semibold">Chat with {settings.agentName}</h3>
                    <p className="text-sm opacity-80">{settings.businessName}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-start gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    {settings.agentName[0]}
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-slate-800">
                      {settings.welcomeMessage.replace('{agent}', settings.agentName)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold">
                    S
                  </div>
                  <div
                    className="rounded-2xl rounded-tr-md px-4 py-3 max-w-[80%] text-white"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    <p className="text-sm">
                      Hi! My daughter Emma is 5 and wants to try soccer
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    {settings.agentName[0]}
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-slate-800">
                      That's wonderful! Emma is the perfect age to start. Our Mini Soccer program for ages 3-5 focuses on fun and fundamentals. What days work best for your family?
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-slate-100 rounded-full text-sm"
                    disabled
                  />
                  <button
                    className="p-2 rounded-full text-white"
                    style={{ backgroundColor: settings.primaryColor }}
                    disabled
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {!showPreview && (
        <div className="mt-8 flex items-center justify-end gap-3">
          <button className="px-6 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
            Reset to Defaults
          </button>
          <button
            className="px-6 py-2.5 text-white font-medium rounded-xl transition-colors"
            style={{ backgroundColor: settings.primaryColor }}
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
