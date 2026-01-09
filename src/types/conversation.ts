export type ConversationState =
  | 'idle'
  | 'greeting'
  | 'collecting_child_info'
  | 'collecting_preferences'
  | 'showing_recommendations'
  | 'showing_unavailable_session'
  | 'confirming_selection'
  | 'collecting_payment'
  | 'processing_payment'
  | 'confirmed'
  | 'error';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface SessionRecommendation {
  sessionId: string;
  programName: string;
  programDescription: string;
  price: number;
  durationWeeks: number;
  locationName: string;
  locationAddress: string;
  locationRating: number | null;
  coachName: string;
  coachRating: number | null;
  sessionRating: number | null;
  dayOfWeek: string;
  startTime: string;
  startDate: string;
  capacity: number;
  enrolledCount: number;
  spotsRemaining: number;
  isFull?: boolean;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    extractedData?: Record<string, unknown>;
    quickReplies?: string[];
    showFormFallback?: boolean;
    recommendations?: SessionRecommendation[];
    requestedFullSession?: SessionRecommendation;
    sessionIssue?: 'full' | 'wrong_age' | null;
  };
}

export interface ConversationContext {
  conversationId: string;
  familyId?: string;
  organizationId: string;
  currentState: ConversationState;
  tempChildId?: string;
  tempFamilyId?: string;
  isAuthenticated?: boolean;
  childName?: string;
  childAge?: number;
  preferredDays?: number[];
  preferredTime?: string;
  preferredTimeOfDay?: string;
  preferredProgram?: string;
  children?: Array<{
    firstName: string;
    age?: number;
    dateOfBirth?: string;
  }>;
  preferences?: {
    location?: string;
    dayOfWeek?: number[];
    timeOfDay?: string;
    radius?: number;
  };
  selectedSession?: {
    sessionId: string;
    programName: string;
    locationName: string;
    dayOfWeek: number;
    startTime: string;
    priceInCents: number;
  };
  selectedSessionId?: string;
  storedAlternatives?: SessionRecommendation[];
  storedRequestedSession?: SessionRecommendation;
}

export interface RegistrationRedirect {
  registrationToken: string;
  redirectUrl: string;
  expiresAt: string;
  amountCents: number;
}
