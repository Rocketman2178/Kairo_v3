import type { ConversationContext, ConversationState, SessionRecommendation, RegistrationRedirect } from '../../types/conversation';

export interface N8NMessageRequest {
  message: string;
  conversationId: string;
  context: ConversationContext & {
    messages?: Array<{ role: string; content: string }>;
  };
}

export interface N8NMessageResponse {
  success: boolean;
  response?: {
    message: string;
    nextState: ConversationState;
    extractedData: Record<string, unknown>;
    quickReplies?: string[];
    progress?: number;
    recommendations?: SessionRecommendation[];
    alternatives?: SessionRecommendation[];
    requestedSession?: SessionRecommendation;
    sessionIssue?: 'full' | 'wrong_age' | 'no_location_match' | null;
    registrationRedirect?: RegistrationRedirect;
  };
  error?: {
    code: string;
    message: string;
    fallbackToForm?: boolean;
  };
}

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const N8N_WEBHOOK_KEY = import.meta.env.VITE_N8N_WEBHOOK_KEY;
const N8N_TIMEOUT_MS = 30000;

export function isN8NConfigured(): boolean {
  return Boolean(N8N_WEBHOOK_URL && N8N_WEBHOOK_URL.length > 0);
}

export async function sendMessageToN8N(
  request: N8NMessageRequest
): Promise<N8NMessageResponse> {
  if (!isN8NConfigured()) {
    return {
      success: false,
      error: {
        code: 'N8N_NOT_CONFIGURED',
        message: 'N8N webhook is not configured. Please check environment variables.',
        fallbackToForm: true,
      },
    };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (N8N_WEBHOOK_KEY) {
      headers['X-N8N-API-Key'] = N8N_WEBHOOK_KEY;
    }

    const payload = {
      message: request.message,
      conversationId: request.conversationId,
      context: {
        organizationId: request.context.organizationId,
        familyId: request.context.familyId,
        tempChildId: request.context.tempChildId,
        tempFamilyId: request.context.tempFamilyId,
        isAuthenticated: request.context.isAuthenticated || false,
        currentState: request.context.currentState,
        childName: request.context.childName,
        childAge: request.context.childAge,
        preferredDays: request.context.preferredDays,
        preferredTime: request.context.preferredTime,
        preferredTimeOfDay: request.context.preferredTimeOfDay,
        preferredProgram: request.context.preferredProgram,
        preferredLocation: request.context.preferences?.location,
        selectedSessionId: request.context.selectedSessionId,
        storedAlternatives: request.context.storedAlternatives,
        storedRequestedSession: request.context.storedRequestedSession,
        messages: request.context.messages || [],
      },
    };

    console.log('=== SENDING TO N8N WEBHOOK ===');
    console.log('URL:', N8N_WEBHOOK_URL);
    console.log('Message:', request.message);
    console.log('Context:', JSON.stringify(payload.context, null, 2));
    console.log('CRITICAL - Extracted fields being sent:');
    console.log('  childName:', payload.context.childName);
    console.log('  childAge:', payload.context.childAge);
    console.log('  preferredDays:', payload.context.preferredDays);
    console.log('  preferredProgram:', payload.context.preferredProgram);
    console.log('  preferredTime:', payload.context.preferredTime);
    console.log('  preferredTimeOfDay:', payload.context.preferredTimeOfDay);
    console.log('==============================');

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('N8N Webhook error:', response.status, errorText);
      throw new Error(`N8N Webhook failed: ${response.status}`);
    }

    const data = await response.json();

    console.log('=== N8N WEBHOOK RESPONSE ===');
    console.log('Success:', data.success);
    console.log('Response:', JSON.stringify(data.response, null, 2));
    console.log('============================');

    return normalizeN8NResponse(data);
  } catch (error) {
    console.error('N8N Webhook service error:', error);

    if (error instanceof Error && error.name === 'TimeoutError') {
      return {
        success: false,
        error: {
          code: 'N8N_TIMEOUT',
          message: "I'm taking a bit longer than usual. Let me show you a form to continue.",
          fallbackToForm: true,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'N8N_NETWORK_ERROR',
        message: "I'm having trouble connecting right now. Let me show you the options directly.",
        fallbackToForm: true,
      },
    };
  }
}

function extractMessage(data: Record<string, unknown>): string {
  const possibleFields = [
    'message',
    'output',
    'text',
    'content',
    'response',
    'aiResponse',
    'ai_response',
    'reply',
    'answer',
  ];

  for (const field of possibleFields) {
    if (typeof data[field] === 'string' && data[field]) {
      return data[field] as string;
    }
  }

  if (data.response && typeof data.response === 'object') {
    const nested = data.response as Record<string, unknown>;
    for (const field of possibleFields) {
      if (typeof nested[field] === 'string' && nested[field]) {
        return nested[field] as string;
      }
    }
  }

  if (data.data && typeof data.data === 'object') {
    const nested = data.data as Record<string, unknown>;
    for (const field of possibleFields) {
      if (typeof nested[field] === 'string' && nested[field]) {
        return nested[field] as string;
      }
    }
  }

  return '';
}

function normalizeN8NResponse(data: unknown): N8NMessageResponse {
  console.log('=== NORMALIZING N8N RESPONSE ===');
  console.log('Raw data type:', typeof data);
  console.log('Raw data:', JSON.stringify(data, null, 2));

  if (!data || typeof data !== 'object') {
    console.log('Invalid data - not an object');
    return {
      success: false,
      error: {
        code: 'INVALID_RESPONSE',
        message: 'Received invalid response from AI service.',
        fallbackToForm: true,
      },
    };
  }

  const response = data as Record<string, unknown>;

  if (response.success === false) {
    console.log('Response indicates failure');
    return {
      success: false,
      error: {
        code: (response.error as Record<string, unknown>)?.code as string || 'UNKNOWN_ERROR',
        message: (response.error as Record<string, unknown>)?.message as string || 'An unknown error occurred.',
        fallbackToForm: (response.error as Record<string, unknown>)?.fallbackToForm as boolean || false,
      },
    };
  }

  const responseData = response.response as Record<string, unknown> || response;
  console.log('Response data to parse:', JSON.stringify(responseData, null, 2));

  const extractedMessage = extractMessage(response);
  console.log('Extracted message:', extractedMessage);

  const registrationRedirect = responseData.registrationRedirect || responseData.registration_redirect;

  const result = {
    success: true,
    response: {
      message: extractedMessage || "I'm here to help! What would you like to do?",
      nextState: (responseData.nextState as ConversationState) ||
                 (response.nextState as ConversationState) ||
                 'collecting_preferences',
      extractedData: (responseData.extractedData as Record<string, unknown>) ||
                     (response.extractedData as Record<string, unknown>) || {},
      quickReplies: (responseData.quickReplies as string[]) ||
                    (response.quickReplies as string[]) || [],
      progress: (responseData.progress as number) || (response.progress as number) || 0,
      recommendations: normalizeRecommendations(responseData.recommendations || response.recommendations),
      alternatives: normalizeRecommendations(responseData.alternatives || response.alternatives),
      requestedSession: (responseData.requestedSession || response.requestedSession) as SessionRecommendation | undefined,
      sessionIssue: (responseData.sessionIssue || response.sessionIssue) as N8NMessageResponse['response']['sessionIssue'],
      registrationRedirect: registrationRedirect ? {
        registrationToken: (registrationRedirect as Record<string, unknown>).registrationToken as string ||
                          (registrationRedirect as Record<string, unknown>).registration_token as string,
        redirectUrl: (registrationRedirect as Record<string, unknown>).redirectUrl as string ||
                    (registrationRedirect as Record<string, unknown>).redirect_url as string,
        expiresAt: (registrationRedirect as Record<string, unknown>).expiresAt as string ||
                  (registrationRedirect as Record<string, unknown>).expires_at as string,
        amountCents: (registrationRedirect as Record<string, unknown>).amountCents as number ||
                    (registrationRedirect as Record<string, unknown>).amount_cents as number,
      } : undefined,
    },
  };

  console.log('Final normalized result:', JSON.stringify(result, null, 2));
  console.log('================================');

  return result;
}

function normalizeRecommendations(data: unknown): SessionRecommendation[] | undefined {
  if (!data || !Array.isArray(data)) {
    return undefined;
  }

  return data.map((item: Record<string, unknown>) => ({
    sessionId: (item.sessionId || item.session_id) as string,
    programName: (item.programName || item.program_name) as string,
    programDescription: (item.programDescription || item.program_description || '') as string,
    price: (item.price || item.price_cents || 0) as number,
    durationWeeks: (item.durationWeeks || item.duration_weeks || 0) as number,
    locationName: (item.locationName || item.location_name || 'TBD') as string,
    locationAddress: (item.locationAddress || item.location_address || '') as string,
    locationRating: (item.locationRating || item.location_rating || null) as number | null,
    coachName: (item.coachName || item.coach_name || 'TBD') as string,
    coachRating: (item.coachRating || item.coach_rating || null) as number | null,
    sessionRating: (item.sessionRating || item.session_rating || null) as number | null,
    dayOfWeek: (item.dayOfWeek || item.day_of_week || item.day_name || '') as string,
    startTime: (item.startTime || item.start_time || item.formatted_start_time || '') as string,
    startDate: (item.startDate || item.start_date || '') as string,
    capacity: (item.capacity || 0) as number,
    enrolledCount: (item.enrolledCount || item.enrolled_count || 0) as number,
    spotsRemaining: (item.spotsRemaining || item.spots_remaining || 0) as number,
    isFull: (item.isFull || item.is_full || false) as boolean,
  }));
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function formatMonthlyPrice(totalCents: number, installments: number = 2): string {
  const monthlyAmount = totalCents / installments;
  return `$${Math.ceil(monthlyAmount / 100)}`;
}

export function formatTime(time24: string): string {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}

export function calculateUrgency(spotsRemaining: number, capacity: number): 'high' | 'medium' | 'low' {
  const percentRemaining = (spotsRemaining / capacity) * 100;
  if (percentRemaining <= 20) return 'high';
  if (percentRemaining <= 50) return 'medium';
  return 'low';
}
