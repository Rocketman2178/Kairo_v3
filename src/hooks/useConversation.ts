import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ConversationContext, ConversationState, Message, RegistrationRedirect } from '../types/conversation';
import { sendMessageToN8N, isN8NConfigured } from '../services/ai/n8nWebhook';

const TEMP_IDS_STORAGE_KEY = 'kairo_temp_ids';

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

  useEffect(() => {
    initializeConversation();
  }, [organizationId, familyId]);

  const initializeConversation = useCallback(async () => {
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
        setConversationId(data.id);
        setContext({
          conversationId: data.id,
          ...initialContext,
        });
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      onError?.(error as Error);
    }
  }, [organizationId, familyId, tempIds, isAuthenticated, onError]);

  const sendMessage = useCallback(
    async (userMessage: string, contextOverride?: Partial<ConversationContext>): Promise<Message | null> => {
      if (!conversationId) {
        console.error('No conversation ID');
        return null;
      }

      setIsLoading(true);

      try {
        const userMsg: Message = {
          id: Date.now().toString(),
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

        const messageHistory = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const updatedContext = {
          ...context,
          ...contextOverride,
          messages: messageHistory,
        };

        const isUsingN8N = isN8NConfigured();
        console.log('=== SENDING TO N8N WEBHOOK ===');
        console.log('N8N Configured:', isUsingN8N);
        console.log('Message:', userMessage);
        console.log('Context being sent:', JSON.stringify(updatedContext, null, 2));
        console.log('Message History Count:', messageHistory.length);
        console.log('==============================');

        const response = await sendMessageToN8N({
          message: userMessage,
          conversationId,
          context: updatedContext,
        });

        console.log('=== N8N WEBHOOK RESPONSE ===');
        console.log('Success:', response.success);
        console.log('Next State:', response.response?.nextState);
        console.log('Extracted Data:', JSON.stringify(response.response?.extractedData, null, 2));
        console.log('Has Recommendations:', !!response.response?.recommendations);
        console.log('Recommendations Count:', response.response?.recommendations?.length || 0);
        if (response.response?.recommendations && response.response.recommendations.length > 0) {
          console.log('First Recommendation:', JSON.stringify(response.response.recommendations[0], null, 2));
        }
        console.log('============================');

        if (response.success && response.response) {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
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

          saveToKairoChat({
            conversation_id: conversationId,
            organization_id: organizationId,
            family_id: familyId || null,
            temp_family_id: tempIds.tempFamilyId,
            temp_child_id: tempIds.tempChildId,
            role: 'assistant',
            content: response.response.message,
            extracted_data: response.response.extractedData || {},
            metadata: {
              quickReplies: response.response.quickReplies,
              recommendations: response.response.recommendations,
              alternatives: response.response.alternatives,
              requestedSession: response.response.requestedSession,
              sessionIssue: response.response.sessionIssue,
            },
            conversation_state: newState,
          });

          const newContext: ConversationContext = {
            ...context,
            currentState: newState,
          };

          if (response.response.extractedData) {
            if (response.response.extractedData.childName) {
              newContext.childName = response.response.extractedData.childName;
            }
            if (response.response.extractedData.childAge) {
              newContext.childAge = response.response.extractedData.childAge;
            }
            if (response.response.extractedData.preferredDays) {
              newContext.preferredDays = response.response.extractedData.preferredDays;
            }
            if (response.response.extractedData.preferredTime) {
              newContext.preferredTime = response.response.extractedData.preferredTime;
            }
            if (response.response.extractedData.preferredTimeOfDay) {
              newContext.preferredTimeOfDay = response.response.extractedData.preferredTimeOfDay;
            }
            if (response.response.extractedData.preferredProgram) {
              newContext.preferredProgram = response.response.extractedData.preferredProgram;
            }
          }

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
              messages: [...messages, userMsg, aiMsg] as any,
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
          console.error('N8N Webhook error response:', response.error);
          if (response.error.fallbackToForm) {
            console.log('Triggering form fallback. Error:', response.error.message);
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
    [conversationId, context, messages, organizationId, familyId, tempIds, state, onError, onFallbackToForm, onRegistrationRedirect]
  );

  const addSystemMessage = useCallback((content: string) => {
    const systemMsg: Message = {
      id: Date.now().toString(),
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

  const addAssistantMessage = useCallback((content: string) => {
    const assistantMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
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

  const resetConversation = useCallback(() => {
    setMessages([]);
    setState('greeting');
    setRegistrationRedirect(null);
    setContext({
      conversationId: '',
      organizationId,
      familyId,
      tempChildId: tempIds.tempChildId,
      tempFamilyId: tempIds.tempFamilyId,
      isAuthenticated: isAuthenticated || false,
      currentState: 'greeting',
    });
    initializeConversation();
  }, [organizationId, familyId, tempIds, isAuthenticated, initializeConversation]);

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
    addSystemMessage,
    addAssistantMessage,
    resetConversation,
    clearRegistrationState,
  };
}
