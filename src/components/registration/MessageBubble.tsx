import { Sparkles, User } from 'lucide-react';
import { Message } from '../../types/conversation';
import { SessionCard } from './SessionCard';

interface MessageBubbleProps {
  message: Message;
  onQuickReply?: (reply: string) => void;
  onSelectSession?: (sessionId: string, programName: string) => void;
  onJoinWaitlist?: (sessionId: string, programName: string) => void;
  organizationId: string;
  onSignUp?: (sessionId: string, programName: string) => void;
}

function cleanMarkdownFormatting(content: string): string {
  let cleaned = content;
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
  cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/(?<!\n)\n((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s+\w+)?:)/g, '\n\n$1');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

export function MessageBubble({ message, onQuickReply, onSelectSession, onJoinWaitlist, organizationId, onSignUp }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const hasRecommendations = !isUser && message.metadata?.recommendations && message.metadata.recommendations.length > 0;
  const hasRequestedFullSession = !isUser && message.metadata?.requestedFullSession;

  let displayContent = cleanMarkdownFormatting(message.content);

  const displayQuickReplies = (() => {
    if (!message.metadata?.quickReplies) return undefined;
    if (hasRecommendations) {
      return ['Show alternatives', 'Change preferences'];
    }
    return message.metadata.quickReplies;
  })();

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-slate-800 text-slate-400 text-sm px-4 py-2 rounded-full border border-slate-700">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-slate-700 text-slate-300' : 'bg-emerald-600/20 text-emerald-400'
        }`}>
          {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
        </div>
        <div
          className={`
            max-w-[85%] rounded-2xl px-3 py-2
            ${isUser
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-tr-md'
              : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-md'
            }
          `}
        >
          <p className="text-sm whitespace-pre-line">
            {displayContent}
          </p>
          {displayQuickReplies && (
            <div className="flex flex-wrap gap-2 mt-2">
              {displayQuickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => onQuickReply?.(reply)}
                  className="px-2.5 py-1 bg-slate-900 text-emerald-400 rounded-full text-xs hover:bg-slate-700 transition-colors border border-emerald-500/30"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {hasRequestedFullSession && (
        <div className="ml-9 space-y-2">
          <SessionCard
            key={message.metadata!.requestedFullSession!.sessionId}
            session={message.metadata!.requestedFullSession!}
            onSelect={(sessionId) => onSelectSession?.(sessionId, message.metadata!.requestedFullSession!.programName)}
            onJoinWaitlist={onJoinWaitlist}
            organizationId={organizationId}
            onSignUp={onSignUp}
            isFull={true}
          />
        </div>
      )}

      {hasRecommendations && (
        <div className="ml-9 space-y-2">
          {message.metadata!.recommendations!.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              onSelect={(sessionId) => onSelectSession?.(sessionId, session.programName)}
              organizationId={organizationId}
              onSignUp={onSignUp}
            />
          ))}
        </div>
      )}
    </div>
  );
}
