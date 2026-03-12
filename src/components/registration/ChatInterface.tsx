import { useRef, useEffect, useState, useCallback } from 'react';
import { Send, AlertCircle, Star, Sparkles, RotateCcw } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { useConversation } from '../../hooks/useConversation';

interface ChatInterfaceProps {
  organizationId: string;
  familyId?: string;
  onComplete?: () => void;
}

export function ChatInterface({ organizationId, familyId }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [showFallbackForm, setShowFallbackForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hasAddedInitialMessage = useRef(false);
  const hasAddedFallbackMessage = useRef(false);

  const onErrorCallback = useCallback((err: Error) => {
    console.error('Conversation error:', err);
    const errorMessage = err.message || 'Something went wrong. Please try again.';
    setError(errorMessage);
  }, []);

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

  useEffect(() => {
    if (hasAddedInitialMessage.current) return;
    if (!isReady) return; // Wait for conversation init (may restore messages)
    if (messages.length === 0) {
      hasAddedInitialMessage.current = true;
      addAssistantMessageRef.current("Hi there! I'm Kai, your registration assistant for Soccer Stars. I can help you find the perfect soccer program for your child and get them signed up in just a few minutes. What would you like help with today?");
    } else {
      // Messages were restored from a previous session
      hasAddedInitialMessage.current = true;
    }
  }, [messages.length, isReady]);

  const [sessionEnded, setSessionEnded] = useState(false);
  const isSendingRef = useRef(false);

  const handleSendMessage = async (messageOverride?: string) => {
    const messageContent = messageOverride || inputValue;
    if (!messageContent.trim() || isLoading || !isReady || isSendingRef.current) return;

    isSendingRef.current = true;
    setInputValue('');
    setError(null);

    try {
      if (messageContent.toLowerCase() === "no, that's all") {
        addUserMessage(messageContent);
        const childName = context.childName || 'your child';
        setTimeout(() => {
          addAssistantMessage(
            `Thanks for registering ${childName}! If you need anything else in the future, I'm always here to help. Have a great day!`
          );
        }, 500);
        setSessionEnded(true);
        return;
      }

      if (messageContent.toLowerCase() === 'sign up another child') {
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
                    <h1 className="font-semibold text-sm">Complete Registration</h1>
                    <p className="text-emerald-100 text-xs">Just a few more details</p>
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
                  <span>Try Chat</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {fallbackSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-white font-medium mb-2">Registration Received!</p>
                  <p className="text-sm text-slate-400">We&apos;ll follow up with program details at {fallbackForm.parentEmail}</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400">Our chat assistant is temporarily unavailable. Complete this form and we&apos;ll get back to you.</p>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Child&apos;s Name *</label>
                    <input value={fallbackForm.childName} onChange={(e) => setFallbackForm(f => ({...f, childName: e.target.value}))} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="First name" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Child&apos;s Age</label>
                    <input value={fallbackForm.childAge} onChange={(e) => setFallbackForm(f => ({...f, childAge: e.target.value}))} type="number" min="2" max="18" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Age" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Preferred Program</label>
                    <input value={fallbackForm.preferredProgram} onChange={(e) => setFallbackForm(f => ({...f, preferredProgram: e.target.value}))} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Soccer Stars, Mini Stars" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">City</label>
                    <input value={fallbackForm.city} onChange={(e) => setFallbackForm(f => ({...f, city: e.target.value}))} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="City" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Schedule Preference</label>
                    <input value={fallbackForm.schedule} onChange={(e) => setFallbackForm(f => ({...f, schedule: e.target.value}))} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Saturdays morning" />
                  </div>
                  <div className="border-t border-slate-700 pt-3 mt-1">
                    <p className="text-xs text-slate-400 mb-2 font-medium">Parent Contact Info</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Your Name</label>
                    <input value={fallbackForm.parentName} onChange={(e) => setFallbackForm(f => ({...f, parentName: e.target.value}))} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Full name" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Email *</label>
                    <input value={fallbackForm.parentEmail} onChange={(e) => setFallbackForm(f => ({...f, parentEmail: e.target.value}))} type="email" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                    <input value={fallbackForm.parentPhone} onChange={(e) => setFallbackForm(f => ({...f, parentPhone: e.target.value}))} type="tel" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="(555) 123-4567" />
                  </div>
                  <button
                    onClick={handleFallbackSubmit}
                    disabled={!fallbackForm.childName || !fallbackForm.parentEmail || fallbackSubmitting}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity mt-2"
                  >
                    {fallbackSubmitting ? 'Submitting...' : 'Submit Registration'}
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
                  <span>New</span>
                </button>
              )}
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
                  onSelectSession={(sessionId, programName) => {
                    const childName = context.childName || 'your child';
                    addAssistantMessage(
                      `I've signed up ${childName} for ${programName}! Would you like to sign up another child?`,
                      ['Sign up another child', 'No, that\'s all']
                    );
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

          <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-3 border-t border-slate-800 bg-slate-900 flex-shrink-0">
            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                maxLength={500}
                disabled={isLoading || !isReady || sessionEnded}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading || !isReady || sessionEnded}
                className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Powered by Kairo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
