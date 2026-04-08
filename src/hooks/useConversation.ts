import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { ConversationContext, ConversationState, Message, RegistrationRedirect } from '../types/conversation';
import { sendMessageToN8N, isN8NConfigured } from '../services/ai/n8nWebhook';
import type { N8NMessageResponse } from '../services/ai/n8nWebhook';
import { sendMessageToKai } from '../services/ai/kaiAgent';

const isDev = import.meta.env.DEV;
const devLog = (...args: unknown[]) => { if (isDev) console.log(...args); };

const TEMP_IDS_STORAGE_KEY = 'kairo_temp_ids';
const CONVERSATION_ID_STORAGE_KEY = 'kairo_conversation_id';
const CONVERSATION_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

interface KairoChatMessage {
  conversation_id: string;
  organization_id: string;
  family_id?: string | null;
  temp_family_id?: string | null;
  temp_child_id?: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  extracted_data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  conversation_state?: string;
}

async function saveToKairoChat(message: KairoChatMessage): Promise<void> {
  try {
    const { error } = await supabase
      .from('kairo_chat')
      .insert(message);

    if (error) {
      console.error('Failed to save message to kairo_chat:', error);
    }
  } catch (err) {
    console.error('Error saving to kairo_chat:', err);
  }
}

interface TempIds {
  tempChildId: string;
  tempFamilyId: string;
}

function generateUUID(): string {
  return crypto.randomUUID();
}

function getTempIds(): TempIds {
  try {
    const stored = localStorage.getItem(TEMP_IDS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.tempChildId && parsed.tempFamilyId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored temp IDs:', e);
  }

  const newIds: TempIds = {
    tempChildId: generateUUID(),
    tempFamilyId: generateUUID(),
  };
  localStorage.setItem(TEMP_IDS_STORAGE_KEY, JSON.stringify(newIds));
  return newIds;
}

function clearTempIds(): void {
  localStorage.removeItem(TEMP_IDS_STORAGE_KEY);
}

interface UseConversationOptions {
  organizationId: string;
  familyId?: string;
  childId?: string;
  isAuthenticated?: boolean;
  onError?: (error: Error) => void;
  onFallbackToForm?: () => void;
  onRegistrationRedirect?: (redirect: RegistrationRedirect) => void;
}

export function useConversation(options: UseConversationOptions) {
  const { organizationId, familyId, childId, isAuthenticated, onError, onFallbackToForm, onRegistrationRedirect } = options;

  const [tempIds] = useState<TempIds>(() => getTempIds());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [state, setState] = useState<ConversationState>('greeting');
  const [context, setContext] = useState<ConversationContext>({
    conversationId: '',
    organizationId,
    familyId,
    tempChildId: tempIds.tempChildId,
    tempFamilyId: tempIds.tempFamilyId,
    isAuthenticated: isAuthenticated || false,
    currentState: 'greeting',
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationRedirect, setRegistrationRedirect] = useState<RegistrationRedirect | null>(null);

  const contextRef = useRef(context);
  const messagesRef = useRef(messages);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    const tryRestoreConversation = async (): Promise<boolean> => {
      try {
        const storedId = localStorage.getItem(CONVERSATION_ID_STORAGE_KEY);
        if (!storedId) return false;

        // Fetch the conversation record
        const { data: conv, error: convError } = await (supabase
          .from('conversations')
          .select('*')
          .eq('id', storedId)
          .single() as any);

        if (convError || !conv) return false;

        // Check if conversation is too old (30 min)
        const updatedAt = new Date(conv.updated_at || conv.created_at).getTime();
        if (Date.now() - updatedAt > CONVERSATION_MAX_AGE_MS) {
          localStorage.removeItem(CONVERSATION_ID_STORAGE_KEY);
          return false;
        }

        // Check if conversation is in a terminal state
        if (conv.state === 'confirmed' || conv.state === 'error') {
          localStorage.removeItem(CONVERSATION_ID_STORAGE_KEY);
          return false;
        }

        // Fetch chat messages for this conversation
        const { data: chatMessages, error: chatError } = await supabase
          .from('kairo_chat')
          .select('*')
          .eq('conversation_id', storedId)
          .order('created_at', { ascending: true });

        if (cancelled) return false;
        if (chatError || !chatMessages || chatMessages.length === 0) return false;

        // Restore messages
        const restoredMessages: Message[] = chatMessages.map((msg: any) => ({
          id: msg.id || crypto.randomUUID(),
          role: msg.role as Message['role'],
          content: msg.content,
          timestamp: new Date(msg.created_at),
          metadata: msg.metadata ? {
            quickReplies: msg.metadata.quickReplies,
            recommendations: msg.metadata.recommendations,
            requestedFullSession: msg.metadata.requestedSession,
            sessionIssue: msg.metadata.sessionIssue,
          } : undefined,
        }));

        // Restore context from conversation record
        const restoredContext = conv.context as ConversationContext;

        setConversationId(storedId);
        setMessages(restoredMessages);
        setState(conv.state as ConversationState);
        setContext({
          ...restoredContext,
          conversationId: storedId,
        });

        devLog('Restored conversation:', storedId, 'with', restoredMessages.length, 'messages');
        return true;
      } catch (e) {
        devLog('Failed to restore conversation:', e);
        return false;
      }
    };

    const createNewConversation = async () => {
      try {
        const initialContext = {
          organizationId,
          familyId,
          tempChildId: tempIds.tempChildId,
          tempFamilyId: tempIds.tempFamilyId,
          isAuthenticated: isAuthenticated || false,
          currentState: 'greeting',
        };

        const { data, error } = await (supabase
          .from('conversations')
          .insert({
            family_id: familyId || null,
            channel: 'web',
            state: 'greeting',
            context: initialContext as any,
            messages: [] as any,
          })
          .select()
          .single() as any);

        if (cancelled) return;
        if (error) throw error;

        if (data) {
          setConversationId(data.id);
          localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, data.id);
          setContext({
            conversationId: data.id,
            ...initialContext,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to initialize conversation:', error);
          onErrorRef.current?.(error as Error);
        }
      }
    };

    const init = async () => {
      const restored = await tryRestoreConversation();
      if (!cancelled && !restored) {
        await createNewConversation();
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [organizationId, familyId, tempIds, isAuthenticated]);

  const sendMessage = useCallback(
    async (userMessage: string, contextOverride?: Partial<ConversationContext>): Promise<Message | null> => {
      if (!conversationId) {
        console.error('No conversation ID');
        return null;
      }

      const currentContext = contextRef.current;
      const currentMessages = messagesRef.current;

      devLog('=== SEND MESSAGE CALLED ===');
      devLog('Current context from ref:', JSON.stringify(currentContext, null, 2));
      devLog('Context override:', JSON.stringify(contextOverride, null, 2));

      setIsLoading(true);

      try {
        const userMsg: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);

        saveToKairoChat({
          conversation_id: conversationId,
          organization_id: organizationId,
          family_id: familyId || null,
          temp_family_id: tempIds.tempFamilyId,
          temp_child_id: tempIds.tempChildId,
          role: 'user',
          content: userMessage,
          conversation_state: state,
        });

        const messageHistory = [
          ...currentMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          {
            role: 'user' as const,
            content: userMessage,
          }
        ];

        const updatedContext = {
          ...currentContext,
          ...contextOverride,
          messages: messageHistory,
        };

        devLog('Context after merge with override:', JSON.stringify(updatedContext, null, 2));

        const isUsingN8N = isN8NConfigured();
        devLog('=== SENDING MESSAGE ===');
        devLog('N8N Configured:', isUsingN8N);
        devLog('Message:', userMessage);

        let response: N8NMessageResponse;

        if (isUsingN8N) {
          response = await sendMessageToN8N({
            message: userMessage,
            conversationId,
            context: updatedContext,
          });
        } else {
          const edgeResponse = await sendMessageToKai({
            message: userMessage,
            conversationId,
            context: updatedContext,
          });

          response = {
            success: edgeResponse.success,
            response: edgeResponse.response ? {
              message: edgeResponse.response.message,
              nextState: edgeResponse.response.nextState,
              extractedData: edgeResponse.response.extractedData || {},
              quickReplies: edgeResponse.response.quickReplies,
              progress: edgeResponse.response.progress,
              recommendations: (edgeResponse.response as any).recommendations,
              alternatives: (edgeResponse.response as any).alternatives,
              requestedSession: (edgeResponse.response as any).requestedSession,
              sessionIssue: (edgeResponse.response as any).sessionIssue,
              registrationRedirect: (edgeResponse.response as any).registrationRedirect,
            } : undefined,
            error: edgeResponse.error,
          };
        }

        devLog('=== N8N WEBHOOK RESPONSE ===');
        devLog('Success:', response.success);
        devLog('Next State:', response.response?.nextState);
        devLog('Extracted Data:', JSON.stringify(response.response?.extractedData, null, 2));
        devLog('Has Recommendations:', !!response.response?.recommendations);
        devLog('Recommendations Count:', response.response?.recommendations?.length || 0);
        if (response.response?.recommendations && response.response.recommendations.length > 0) {
          devLog('First Recommendation:', JSON.stringify(response.response.recommendations[0], null, 2));
        }
        devLog('============================');

        if (response.success && response.response) {
          devLog('=== BUILDING NEW CONTEXT ===');
          const aiMsg: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.response.message,
            timestamp: new Date(),
            metadata: {
              quickReplies: response.response.quickReplies,
              extractedData: response.response.extractedData,
              recommendations: response.response.recommendations || response.response.alternatives,
              requestedFullSession: response.response.requestedFullSession || response.response.requestedSession,
              sessionIssue: response.response.sessionIssue,
            },
          };

          setMessages((prev) => [...prev, aiMsg]);

          const newState = response.response.nextState;
          setState(newState);

          const extractedData = response.response.extractedData || {};
          devLog('=== EXTRACTED DATA FROM AI ===');
          devLog('ExtractedData from response:', JSON.stringify(extractedData, null, 2));
          devLog('Context before extraction:', JSON.stringify(updatedContext, null, 2));

          const newContext: ConversationContext = {
            ...updatedContext,
            currentState: newState,
          };

          if (extractedData.childName !== undefined) {
            newContext.childName = String(extractedData.childName);
            devLog('Set childName:', newContext.childName);
          }
          if (extractedData.childAge !== undefined) {
            newContext.childAge = Number(extractedData.childAge);
            devLog('Set childAge:', newContext.childAge);
          }
          if (extractedData.preferredDays !== undefined) {
            if (Array.isArray(extractedData.preferredDays)) {
              newContext.preferredDays = extractedData.preferredDays.map(d => Number(d));
            } else {
              newContext.preferredDays = extractedData.preferredDays as number[];
            }
            devLog('Set preferredDays:', newContext.preferredDays);
          }
          if (extractedData.preferredTime !== undefined) {
            newContext.preferredTime = String(extractedData.preferredTime);
            devLog('Set preferredTime:', newContext.preferredTime);
          }
          if (extractedData.preferredTimeOfDay !== undefined) {
            newContext.preferredTimeOfDay = String(extractedData.preferredTimeOfDay);
            devLog('Set preferredTimeOfDay:', newContext.preferredTimeOfDay);
          }
          if (extractedData.preferredProgram !== undefined) {
            newContext.preferredProgram = String(extractedData.preferredProgram);
            devLog('Set preferredProgram:', newContext.preferredProgram);
          }
          if (extractedData.preferredCity !== undefined) {
            newContext.preferredCity = String(extractedData.preferredCity);
            devLog('Set preferredCity:', newContext.preferredCity);
          }
          if (extractedData.preferredLocation !== undefined) {
            newContext.preferredLocation = String(extractedData.preferredLocation);
            devLog('Set preferredLocation:', newContext.preferredLocation);
          }

          devLog('New context after extraction:', JSON.stringify(newContext, null, 2));
          devLog('Setting context state with new values...');

          saveToKairoChat({
            conversation_id: conversationId,
            organization_id: organizationId,
            family_id: familyId || null,
            temp_family_id: tempIds.tempFamilyId,
            temp_child_id: tempIds.tempChildId,
            role: 'assistant',
            content: response.response.message,
            extracted_data: extractedData,
            metadata: {
              quickReplies: response.response.quickReplies,
              recommendations: response.response.recommendations,
              alternatives: response.response.alternatives,
              requestedSession: response.response.requestedSession,
              sessionIssue: response.response.sessionIssue,
            },
            conversation_state: newState,
          });

          if (response.response.alternatives && response.response.alternatives.length > 0) {
            newContext.storedAlternatives = response.response.alternatives;
          }
          if (response.response.requestedSession) {
            newContext.storedRequestedSession = response.response.requestedSession;
          }

          // Clear selectedSessionId after processing to avoid re-use
          if (newContext.selectedSessionId) {
            delete newContext.selectedSessionId;
          }

          setContext(newContext);

          await supabase
            .from('conversations')
            .update({
              state: newState,
              context: newContext as any,
              messages: [...currentMessages, userMsg, aiMsg] as any,
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);

          if (response.response.registrationRedirect) {
            setRegistrationRedirect(response.response.registrationRedirect);
            onRegistrationRedirect?.(response.response.registrationRedirect);
          }

          setIsLoading(false);
          return aiMsg;
        } else if (response.error) {
          console.error('N8N Webhook error response:', response.error?.code, response.error?.message, JSON.stringify(response.error));
          if (response.error.fallbackToForm) {
            devLog('Triggering form fallback. Error:', response.error.message);
            onFallbackToForm?.();
          } else {
            throw new Error(response.error.message || 'N8N Webhook service error');
          }
          setIsLoading(false);
          return null;
        } else {
          throw new Error('Unknown error from N8N Webhook service');
        }
      } catch (error) {
        console.error('Send message error:', error);
        onError?.(error as Error);
        setIsLoading(false);
        return null;
      }
    },
    [conversationId, organizationId, familyId, tempIds, state, onError, onFallbackToForm, onRegistrationRedirect]
  );

  const addSystemMessage = useCallback((content: string) => {
    const systemMsg: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, systemMsg]);

    if (conversationId) {
      saveToKairoChat({
        conversation_id: conversationId,
        organization_id: organizationId,
        family_id: familyId || null,
        temp_family_id: tempIds.tempFamilyId,
        temp_child_id: tempIds.tempChildId,
        role: 'system',
        content,
        conversation_state: state,
      });
    }
  }, [conversationId, organizationId, familyId, tempIds, state]);

  const addAssistantMessage = useCallback((content: string, quickReplies?: string[]) => {
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata: quickReplies ? { quickReplies } : undefined,
    };
    setMessages((prev) => [...prev, assistantMsg]);

    if (conversationId) {
      saveToKairoChat({
        conversation_id: conversationId,
        organization_id: organizationId,
        family_id: familyId || null,
        temp_family_id: tempIds.tempFamilyId,
        temp_child_id: tempIds.tempChildId,
        role: 'assistant',
        content,
        conversation_state: state,
      });
    }
  }, [conversationId, organizationId, familyId, tempIds, state]);

  const addUserMessage = useCallback((content: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    if (conversationId) {
      saveToKairoChat({
        conversation_id: conversationId,
        organization_id: organizationId,
        family_id: familyId || null,
        temp_family_id: tempIds.tempFamilyId,
        temp_child_id: tempIds.tempChildId,
        role: 'user',
        content,
        conversation_state: state,
      });
    }
  }, [conversationId, organizationId, familyId, tempIds, state]);

  const resetConversation = useCallback(async () => {
    // Don't clear messages yet — wait until the new conversation is ready to
    // avoid a blank/white flash between clearing and the new greeting appearing.
    setState('greeting');
    setRegistrationRedirect(null);
    localStorage.removeItem(CONVERSATION_ID_STORAGE_KEY);

    try {
      const initialContext = {
        organizationId,
        familyId,
        tempChildId: tempIds.tempChildId,
        tempFamilyId: tempIds.tempFamilyId,
        isAuthenticated: isAuthenticated || false,
        currentState: 'greeting',
      };

      const { data, error } = await (supabase
        .from('conversations')
        .insert({
          family_id: familyId || null,
          channel: 'web',
          state: 'greeting',
          context: initialContext as any,
          messages: [] as any,
        })
        .select()
        .single() as any);

      if (error) throw error;

      if (data) {
        // Clear messages and set new conversation ID together so the greeting
        // effect fires in the same render cycle — no blank state flash.
        setMessages([]);
        setConversationId(data.id);
        localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, data.id);
        setContext({
          conversationId: data.id,
          ...initialContext,
        });
      }
    } catch (error) {
      setMessages([]);
      console.error('Failed to reset conversation:', error);
      onErrorRef.current?.(error as Error);
    }
  }, [organizationId, familyId, tempIds, isAuthenticated]);

  const resetChildContext = useCallback(() => {
    setContext((prev) => {
      const cleaned = { ...prev };
      delete cleaned.childName;
      delete cleaned.childAge;
      delete cleaned.preferredDays;
      delete cleaned.preferredTime;
      delete cleaned.preferredTimeOfDay;
      delete cleaned.preferredProgram;
      delete cleaned.preferredCity;
      delete cleaned.preferredLocation;
      delete cleaned.selectedSessionId;
      delete cleaned.storedAlternatives;
      delete cleaned.storedRequestedSession;
      delete cleaned.selectedSession;
      delete cleaned.children;
      delete cleaned.preferences;
      cleaned.currentState = 'collecting_child_info';
      return cleaned;
    });
    setState('collecting_child_info');
  }, []);

  const clearRegistrationState = useCallback(() => {
    clearTempIds();
    setRegistrationRedirect(null);
  }, []);

  return {
    conversationId,
    state,
    context,
    messages,
    isLoading,
    tempIds,
    registrationRedirect,
    sendMessage,
    addUserMessage,
    addSystemMessage,
    addAssistantMessage,
    resetConversation,
    resetChildContext,
    clearRegistrationState,
  };
}
