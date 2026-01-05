import { useRef, useEffect, useState, useCallback } from 'react';
import { Send, AlertCircle, Star, Phone, Sparkles } from 'lucide-react';
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
  const lastAssistantMessageRef = useRef<string | null>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const {
    messages,
    isLoading,
    sendMessage,
    addAssistantMessage,
  } = useConversation({
    organizationId,
    familyId,
    onError: (err) => {
      console.error('Conversation error:', err);
      const errorMessage = err.message || 'Something went wrong. Please try again.';
      setError(errorMessage);
    },
    onFallbackToForm: () => {
      setShowFallbackForm(true);
    },
  });

  useEffect(() => {
    if (showFallbackForm) {
      addAssistantMessage('Let me show you a form to complete your registration.');
    }
  }, [showFallbackForm, addAssistantMessage]);

  const setMessageRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      messageRefs.current.set(id, el);
    } else {
      messageRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (lastMessage.role === 'assistant' && lastMessage.id !== lastAssistantMessageRef.current) {
      lastAssistantMessageRef.current = lastMessage.id;

      requestAnimationFrame(() => {
        const messageEl = messageRefs.current.get(lastMessage.id);
        if (messageEl && messagesContainerRef.current) {
          const containerRect = messagesContainerRef.current.getBoundingClientRect();
          const messageRect = messageEl.getBoundingClientRect();
          const scrollTop = messagesContainerRef.current.scrollTop + (messageRect.top - containerRect.top) - 16;

          messagesContainerRef.current.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        }
      });
    } else if (lastMessage.role === 'user') {
      requestAnimationFrame(() => {
        const messageEl = messageRefs.current.get(lastMessage.id);
        if (messageEl && messagesContainerRef.current) {
          const containerRect = messagesContainerRef.current.getBoundingClientRect();
          const messageRect = messageEl.getBoundingClientRect();
          const scrollTop = messagesContainerRef.current.scrollTop + (messageRect.top - containerRect.top) - 16;

          messagesContainerRef.current.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        }
      });
    }
  }, [messages]);

  const hasAddedInitialMessage = useRef(false);

  useEffect(() => {
    if (hasAddedInitialMessage.current) return;

    if (messages.length === 0) {
      addAssistantMessage("Hi there! I'm Kai, your registration assistant for Soccer Stars. I can help you find the perfect soccer program for your child and get them signed up in just a few minutes. What would you like help with today?");
      hasAddedInitialMessage.current = true;
    }
  }, [messages.length, addAssistantMessage]);

  const handleSendMessage = async (messageOverride?: string) => {
    const messageContent = messageOverride || inputValue;
    if (!messageContent.trim() || isLoading) return;

    setInputValue('');
    setError(null);

    await sendMessage(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (showFallbackForm) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center bg-slate-900 py-4 px-4">
        <div className="relative w-[390px] h-[780px] bg-slate-950 rounded-[3rem] shadow-2xl border-[14px] border-slate-950 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-slate-950 rounded-b-2xl z-50"></div>
          <div className="relative h-full flex flex-col bg-slate-900 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-3 py-2 text-white pt-8 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600">
                  <Star className="w-5 h-5 fill-emerald-600" />
                </div>
                <div>
                  <h1 className="font-semibold text-sm">Complete Registration</h1>
                  <p className="text-emerald-100 text-xs">Just a few more details</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-center py-12">
                <p className="text-slate-300 mb-4">Form fallback coming soon...</p>
                <p className="text-sm text-slate-500">For now, please refresh to start over.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center bg-slate-900 py-4 px-4">
      <div className="relative w-[390px] h-[780px] bg-slate-950 rounded-[3rem] shadow-2xl border-[14px] border-slate-950 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-slate-950 rounded-b-2xl z-50"></div>

        <div ref={messagesContainerRef} className="relative h-full flex flex-col bg-slate-900 overflow-hidden">
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
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors">
                <Phone className="w-3 h-3" />
                <span>Talk with Kai</span>
              </button>
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
                    const sessionMessage = `I'd like to register for ${programName}`;
                    sendMessage(sessionMessage, { selectedSessionId: sessionId });
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

          <div className="p-3 border-t border-slate-800 bg-slate-900 flex-shrink-0">
            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
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
