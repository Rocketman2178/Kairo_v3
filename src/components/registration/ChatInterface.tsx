import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, AlertCircle, Star, Sparkles, RotateCcw, Mic, Volume2, VolumeX, AudioWaveform } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { useConversation } from '../../hooks/useConversation';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useTtsOutput } from '../../hooks/useTtsOutput';
import { VoiceIndicator } from './VoiceIndicator';
import {
  getStoredLanguage,
  setStoredLanguage,
  getStrings,
  t,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  type LanguageCode,
} from '../../services/ai/languageService';

interface ChatInterfaceProps {
  organizationId: string;
  familyId?: string;
  onComplete?: () => void;
  initialSessionId?: string;
  /** Optional: exposes a send function for demo/external control. Called once on mount. */
  onReady?: (handle: { send: (text: string) => void; reset: () => void }) => void;
}

export function ChatInterface({ organizationId, familyId, initialSessionId, onReady }: ChatInterfaceProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [showFallbackForm, setShowFallbackForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialSessionName, setInitialSessionName] = useState<string | null>(null);
  // True when session lookup is done (or not needed) so we don't show a greeting too early
  const [initialSessionReady, setInitialSessionReady] = useState(!initialSessionId);
  const [language, setLanguage] = useState<LanguageCode>(getStoredLanguage);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hasAddedInitialMessage = useRef(false);
  const hasAddedFallbackMessage = useRef(false);
  const lastSpokenMessageId = useRef<string | null>(null);

  const strings = getStrings(language);

  const onErrorCallback = useCallback((err: Error) => {
    console.error('Conversation error:', err);
    const errorMessage = err.message || strings.errorGeneric;
    setError(errorMessage);
  }, [strings.errorGeneric]);

  const onFallbackCallback = useCallback(() => {
    setShowFallbackForm(true);
  }, []);

  const {
    conversationId,
    messages,
    isLoading,
    context,
    sendMessage,
    addUserMessage,
    addAssistantMessage,
    resetChildContext,
    resetConversation,
  } = useConversation({
    organizationId,
    familyId,
    onError: onErrorCallback,
    onFallbackToForm: onFallbackCallback,
  });

  const handleLanguageToggle = useCallback(() => {
    const currentIdx = SUPPORTED_LANGUAGES.indexOf(language);
    const nextLang = SUPPORTED_LANGUAGES[(currentIdx + 1) % SUPPORTED_LANGUAGES.length];
    setLanguage(nextLang);
    setStoredLanguage(nextLang);
    // Reset conversation so Kai re-greets in the new language
    hasAddedInitialMessage.current = false;
    setSessionEnded(false);
    resetConversation();
  }, [language, resetConversation]);

  const addAssistantMessageRef = useRef(addAssistantMessage);
  useEffect(() => {
    addAssistantMessageRef.current = addAssistantMessage;
  }, [addAssistantMessage]);

  useEffect(() => {
    if (showFallbackForm && !hasAddedFallbackMessage.current) {
      hasAddedFallbackMessage.current = true;
      addAssistantMessageRef.current('Let me show you a form to complete your registration.');
    }
  }, [showFallbackForm]);

  const setMessageRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      messageRefs.current.set(id, el);
    } else {
      messageRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;

    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        const scrollContainer = messagesContainerRef.current.querySelector('.overflow-y-auto');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    };

    requestAnimationFrame(() => {
      setTimeout(scrollToBottom, 100);
    });
  }, [messages]);

  useEffect(() => {
    if (isLoading) return;

    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        const scrollContainer = messagesContainerRef.current.querySelector('.overflow-y-auto');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    };

    requestAnimationFrame(() => {
      setTimeout(scrollToBottom, 100);
    });
  }, [isLoading]);

  const isReady = Boolean(conversationId);

  const greetingRef = useRef(strings.greeting);
  useEffect(() => {
    greetingRef.current = strings.greeting;
  }, [strings.greeting]);

  // Fetch session name so we can greet parents with the specific class they came from
  useEffect(() => {
    if (!initialSessionId) return;
    let cancelled = false;
    async function fetchSession() {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data } = await supabase
          .from('sessions')
          .select('programs(name)')
          .eq('id', initialSessionId)
          .single();
        if (cancelled) return;
        if (data) {
          const prog = (data as unknown as { programs: { name: string } | null }).programs;
          if (prog?.name) setInitialSessionName(prog.name);
        }
      } catch {
        // Non-critical — fall back to generic session greeting
      } finally {
        if (!cancelled) setInitialSessionReady(true);
      }
    }
    void fetchSession();
    return () => { cancelled = true; };
  }, [initialSessionId]);

  useEffect(() => {
    if (hasAddedInitialMessage.current) return;
    if (!isReady) return;
    if (!initialSessionReady) return;
    if (messages.length === 0) {
      hasAddedInitialMessage.current = true;
      const greeting = initialSessionId
        ? initialSessionName
          ? `Hi! I see you're interested in ${initialSessionName} — great choice! What's your child's name and age so I can help you register?`
          : "Hi! I see you're interested in registering for a class — great choice! What's your child's name and age so I can get you set up?"
        : greetingRef.current;
      addAssistantMessageRef.current(greeting);
    } else if (messages.length > 1) {
      // Restored conversation with history — surface it to the parent
      hasAddedInitialMessage.current = true;
      addAssistantMessageRef.current("Welcome back! I can see where we left off. Ready to continue, or would you like to start fresh?");
    } else {
      hasAddedInitialMessage.current = true;
    }
  }, [messages.length, isReady, initialSessionId, initialSessionName, initialSessionReady]);

  // ── TTS — speak new Kai messages when TTS is enabled ─────────────────────
  const { isSupported: ttsSupported, isSpeaking, speak: ttsSpeak, stop: ttsStop } = useTtsOutput({ language });

  useEffect(() => {
    if (!ttsEnabled || !ttsSupported || isLoading) return;
    // Find the most recent assistant message that hasn't been spoken yet
    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    if (assistantMessages.length === 0) return;
    const latest = assistantMessages[assistantMessages.length - 1];
    if (latest.id === lastSpokenMessageId.current) return;
    lastSpokenMessageId.current = latest.id;
    ttsSpeak(latest.content);
  }, [messages, isLoading, ttsEnabled, ttsSupported, ttsSpeak]);

  const handleTtsToggle = useCallback(() => {
    if (isSpeaking) {
      ttsStop();
    }
    setTtsEnabled((prev) => !prev);
  }, [isSpeaking, ttsStop]);
  // ─────────────────────────────────────────────────────────────────────────

  const [sessionEnded, setSessionEnded] = useState(false);
  const [showVoiceIndicator, setShowVoiceIndicator] = useState(false);
  const isSendingRef = useRef(false);

  // ── Voice input ────────────────────────────────────────────────────────────
  const handleVoiceFinal = useCallback((text: string) => {
    setShowVoiceIndicator(false);
    if (text.trim() && !isSendingRef.current) {
      isSendingRef.current = true;
      setError(null);
      sendMessage(text.trim()).finally(() => {
        isSendingRef.current = false;
      });
    }
  }, [sendMessage]);

  const {
    isSupported: voiceSupported,
    isListening,
    interimTranscript,
    error: voiceError,
    fullTranscript: voiceFullTranscript,
    startListening,
    stopListening,
  } = useVoiceInput(handleVoiceFinal);

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      setShowVoiceIndicator(true);
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleVoiceCancel = useCallback(() => {
    stopListening();
    setShowVoiceIndicator(false);
  }, [stopListening]);
  // ──────────────────────────────────────────────────────────────────────────

  const handleSendMessage = async (messageOverride?: string) => {
    const messageContent = messageOverride || inputValue;
    if (!messageContent.trim() || isLoading || !isReady || isSendingRef.current) return;

    isSendingRef.current = true;
    setInputValue('');
    setError(null);

    try {
      if (messageContent.toLowerCase() === strings.noThanks.toLowerCase() || messageContent.toLowerCase() === "no, that's all") {
        addUserMessage(messageContent);
        const childName = context.childName || 'your child';
        setTimeout(() => {
          addAssistantMessage(t(strings.sessionEndedMessage, { childName }));
        }, 500);
        setSessionEnded(true);
        return;
      }

      if (messageContent.toLowerCase() === 'sign up another child' || messageContent.toLowerCase() === strings.signUpAnotherChild.toLowerCase()) {
        const cleanOverride: Partial<typeof context> = {
          childName: undefined,
          childAge: undefined,
          preferredDays: undefined,
          preferredTime: undefined,
          preferredTimeOfDay: undefined,
          preferredProgram: undefined,
          preferredCity: undefined,
          preferredLocation: undefined,
          selectedSessionId: undefined,
          storedAlternatives: undefined,
          storedRequestedSession: undefined,
          selectedSession: undefined,
          children: undefined,
          preferences: undefined,
          currentState: 'collecting_child_info' as const,
        };
        resetChildContext();
        await sendMessage(messageContent, cleanOverride);
        return;
      }

      await sendMessage(messageContent);
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Expose send/reset handlers to external controllers (e.g. SalesDemo page)
  const onReadyCalled = useRef(false);
  useEffect(() => {
    if (onReady && !onReadyCalled.current) {
      onReadyCalled.current = true;
      onReady({
        send: (text: string) => { handleSendMessage(text); },
        reset: () => { resetConversation(); hasAddedInitialMessage.current = false; },
      });
    }
  }, [onReady]);

  const [fallbackForm, setFallbackForm] = useState({
    childName: context.childName || '',
    childAge: context.childAge?.toString() || '',
    preferredProgram: context.preferredProgram || '',
    city: context.preferredCity || '',
    schedule: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
  });
  const [fallbackSubmitted, setFallbackSubmitted] = useState(false);
  const [fallbackSubmitting, setFallbackSubmitting] = useState(false);

  const handleFallbackSubmit = async () => {
    if (!fallbackForm.childName || !fallbackForm.parentEmail) return;
    setFallbackSubmitting(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      await supabase.from('kairo_chat').insert({
        conversation_id: conversationId || 'fallback-' + crypto.randomUUID(),
        organization_id: organizationId,
        temp_family_id: context.tempFamilyId,
        temp_child_id: context.tempChildId,
        role: 'system',
        content: 'Fallback form submission',
        metadata: { fallbackForm: fallbackForm },
        conversation_state: 'fallback_form',
      });
      setFallbackSubmitted(true);
    } catch (e) {
      console.error('Fallback form submit error:', e);
    } finally {
      setFallbackSubmitting(false);
    }
  };

  if (showFallbackForm) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center sm:bg-slate-900 sm:py-4 sm:px-4">
        <div className="relative w-full h-[100dvh] sm:w-[390px] sm:h-[780px] bg-slate-950 sm:rounded-[3rem] sm:shadow-2xl sm:border-[14px] sm:border-slate-950 overflow-hidden">
          <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-slate-950 rounded-b-2xl z-50"></div>
          <div className="relative h-full flex flex-col bg-slate-900 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-3 py-2 text-white pt-[env(safe-area-inset-top,0.5rem)] sm:pt-8 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600">
                    <Star className="w-5 h-5 fill-emerald-600" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-sm">{strings.fallbackTitle}</h1>
                    <p className="text-emerald-100 text-xs">{strings.fallbackSubtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowFallbackForm(false);
                    hasAddedFallbackMessage.current = false;
                    hasAddedInitialMessage.current = false;
                    setSessionEnded(false);
                    resetConversation();
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{strings.tryChat}</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {fallbackSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-white font-medium mb-2">{strings.fallbackSuccessTitle}</p>
                  <p className="text-sm text-slate-400">{strings.fallbackSuccessMessage} {fallbackForm.parentEmail}</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400">{strings.fallbackUnavailableNote}</p>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{strings.fallbackChildName}</label>
                    <input value={fallbackForm.childName} onChange={(e) => setFallbackForm(f => ({...f, childName: e.target.value}))} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder={strings.fallbackChildNamePlaceholder} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{strings.fallbackChildAge}</label>
                    <input value={fallbackForm.childAge} onChange={(e) => setFallbackForm(f => ({...f, childAge: e.target.value}))} type="number" min="2" max="18" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Age" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{strings.fallbackProgram}</label>
                    <input value={fallbackForm.preferredProgram} onChange={(e) => setFallbackForm(f => ({...f, preferredProgram: e.target.value}))} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder={strings.fallbackProgramPlaceholder} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{strings.fallbackCity}</label>
                    <input value={fallbackForm.city} onChange={(e) => setFallbackForm(f => ({...f, city: e.target.value}))} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="City" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{strings.fallbackSchedule}</label>
                    <input value={fallbackForm.schedule} onChange={(e) => setFallbackForm(f => ({...f, schedule: e.target.value}))} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder={strings.fallbackSchedulePlaceholder} />
                  </div>
                  <div className="border-t border-slate-700 pt-3 mt-1">
                    <p className="text-xs text-slate-400 mb-2 font-medium">{strings.fallbackParentContact}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{strings.fallbackParentName}</label>
                    <input value={fallbackForm.parentName} onChange={(e) => setFallbackForm(f => ({...f, parentName: e.target.value}))} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Full name" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{strings.fallbackEmail}</label>
                    <input value={fallbackForm.parentEmail} onChange={(e) => setFallbackForm(f => ({...f, parentEmail: e.target.value}))} type="email" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{strings.fallbackPhone}</label>
                    <input value={fallbackForm.parentPhone} onChange={(e) => setFallbackForm(f => ({...f, parentPhone: e.target.value}))} type="tel" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="(555) 123-4567" />
                  </div>
                  <button
                    onClick={handleFallbackSubmit}
                    disabled={!fallbackForm.childName || !fallbackForm.parentEmail || fallbackSubmitting}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity mt-2"
                  >
                    {fallbackSubmitting ? strings.fallbackSubmitting : strings.fallbackSubmit}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center sm:bg-slate-900 sm:py-4 sm:px-4">
      <div className="relative w-full h-[100dvh] sm:w-[390px] sm:h-[780px] bg-slate-950 sm:rounded-[3rem] sm:shadow-2xl sm:border-[14px] sm:border-slate-950 overflow-hidden">
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-slate-950 rounded-b-2xl z-50"></div>

        <div ref={messagesContainerRef} className="relative h-full flex flex-col bg-slate-900 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-3 py-2 text-white pt-[env(safe-area-inset-top,0.5rem)] sm:pt-8 flex-shrink-0">
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
              <div className="flex items-center gap-1.5">
                {/* Language toggle */}
                <button
                  onClick={handleLanguageToggle}
                  title={`Switch language (current: ${LANGUAGE_LABELS[language]})`}
                  className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors min-w-[32px] text-center"
                >
                  {LANGUAGE_LABELS[language]}
                </button>
                {/* TTS toggle — only shown if supported */}
                {ttsSupported && (
                  <button
                    onClick={handleTtsToggle}
                    title={ttsEnabled ? strings.stopSpeaking : strings.speakResponses}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      ttsEnabled
                        ? 'bg-white/30 text-white'
                        : 'bg-white/20 hover:bg-white/30 text-white/80'
                    }`}
                  >
                    {ttsEnabled && isSpeaking ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                {messages.length > 1 && (
                  <button
                    onClick={() => {
                      hasAddedInitialMessage.current = false;
                      setSessionEnded(false);
                      resetConversation();
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
                    title="Start new conversation"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{strings.startNew}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border-l-4 border-red-500 p-3 mx-3 mt-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-900">
            {messages.map((message) => (
              <div key={message.id} ref={(el) => setMessageRef(message.id, el)}>
                <MessageBubble
                  message={message}
                  onQuickReply={(reply) => {
                    handleSendMessage(reply);
                  }}
                  onSelectSession={async (sessionId, programName) => {
                    const childName = context.childName || '';
                    addAssistantMessage(
                      `Great choice! Let me set up the registration for ${programName}...`
                    );
                    try {
                      const { supabase } = await import('../../lib/supabase');
                      const { data, error: rpcError } = await supabase.rpc('create_pending_registration', {
                        p_session_id: sessionId,
                        p_temp_child_id: context.tempChildId || crypto.randomUUID(),
                        p_temp_family_id: context.tempFamilyId || crypto.randomUUID(),
                        p_child_name: childName || 'Child',
                        p_child_age: context.childAge || 0,
                      });
                      if (rpcError || data?.error) {
                        addAssistantMessage(data?.message || rpcError?.message || 'Something went wrong creating the registration. Please try again.');
                        return;
                      }
                      const token = data.registration_token;
                      navigate(`/register?token=${token}`);
                    } catch (err) {
                      console.error('Registration error:', err);
                      addAssistantMessage('Something went wrong. Please try again or start a new chat.');
                    }
                  }}
                  onJoinWaitlist={(sessionId, programName) => {
                    const waitlistMessage = `Join waitlist for ${programName}`;
                    sendMessage(waitlistMessage, { selectedSessionId: sessionId, joinWaitlist: true });
                  }}
                  organizationId={organizationId}
                  onSignUp={(sessionId, programName) => {
                    const sessionMessage = `I'd like to register for ${programName}`;
                    handleSendMessage(sessionMessage);
                  }}
                />
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-md px-3 py-2 max-w-[70%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Voice input overlay */}
          {showVoiceIndicator && (
            <VoiceIndicator
              isListening={isListening}
              interimTranscript={interimTranscript}
              fullTranscript={voiceFullTranscript}
              error={voiceError}
              onStop={stopListening}
              onCancel={handleVoiceCancel}
            />
          )}

          <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-3 border-t border-slate-800 bg-slate-900 flex-shrink-0">
            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? 'Kai is thinking...' : strings.chatPlaceholder}
                maxLength={500}
                disabled={!isReady || sessionEnded}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {voiceSupported && (
                <button
                  onClick={handleVoiceToggle}
                  disabled={isLoading || !isReady || sessionEnded}
                  title={isListening ? strings.stopRecording : strings.speakMessage}
                  className={`px-3 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowVoiceMode(true)}
                disabled={!isReady || sessionEnded}
                title="Voice conversation mode"
                className="px-3 py-2 rounded-lg bg-slate-700 text-emerald-400 hover:bg-slate-600 hover:text-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AudioWaveform className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading || !isReady || sessionEnded}
                className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              {strings.poweredBy}
            </p>
          </div>
        </div>
      </div>

      {/* Voice Mode Overlay */}
      {showVoiceMode && (
        <VoiceModeOverlay
          onClose={() => setShowVoiceMode(false)}
          onEndSession={(transcriptEntries) => {
            // Add voice transcript entries as chat messages
            for (const entry of transcriptEntries) {
              if (entry.text.trim() && entry.text !== 'Looking that up for you...') {
                if (entry.role === 'user') {
                  addUserMessage(entry.text);
                } else {
                  addAssistantMessage(entry.text);
                }
              }
            }
            setShowVoiceMode(false);
          }}
        />
      )}
    </div>
  );
}

// Lazy-loaded Voice Mode overlay
import { lazy, Suspense } from 'react';
const LazyVoiceModePage = lazy(() => import('../voice/VoiceModePage'));

function VoiceModeOverlay({ onClose, onEndSession }: { onClose: () => void; onEndSession: (t: Array<{ role: 'user' | 'agent'; text: string; timestamp: Date }>) => void }) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center">
        <div className="text-white">Loading Voice Mode...</div>
      </div>
    }>
      <LazyVoiceModePage onClose={onClose} onEndSession={onEndSession} />
    </Suspense>
  );
}
