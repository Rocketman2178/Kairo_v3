import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { message, context } = await req.json();

    console.log('Received message:', message);
    console.log('Current context:', JSON.stringify(context, null, 2));

    const messageLower = message.toLowerCase().trim();

    if (messageLower === 'view alternatives' && context.storedAlternatives && context.storedAlternatives.length > 0) {
      console.log('Returning stored alternatives:', context.storedAlternatives.length);
      return new Response(
        JSON.stringify({
          success: true,
          response: {
            message: `Here are the alternative options for ${context.childName || 'your child'}:`,
            nextState: 'showing_recommendations',
            extractedData: {},
            quickReplies: ['Show other programs', 'Start over'],
            progress: calculateProgress(context),
            recommendations: context.storedAlternatives,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isWaitlistRequest = messageLower === 'join waitlist' ||
                              messageLower.startsWith('join waitlist for') ||
                              context.joinWaitlist === true;

    const waitlistSessionId = context.selectedSessionId || context.storedRequestedSession?.sessionId;
    const waitlistSession = context.storedRequestedSession ||
                            (context.selectedSessionId ? await fetchSessionById(supabaseClient, context.selectedSessionId) : null);

    if (isWaitlistRequest && waitlistSessionId) {
      console.log('Adding to waitlist for session:', waitlistSessionId);

      const waitlistResult = await addToWaitlist(
        supabaseClient,
        waitlistSessionId,
        context.childName,
        context.childAge,
        context.familyId
      );

      const sessionInfo = waitlistSession || {};
      const programName = sessionInfo.programName || 'the program';
      const dayOfWeek = sessionInfo.dayOfWeek || '';
      const startTime = sessionInfo.startTime || '';

      if (waitlistResult.success) {
        return new Response(
          JSON.stringify({
            success: true,
            response: {
              message: `Done! ${context.childName || 'Your child'} is now on the waitlist for ${programName}${dayOfWeek ? ` on ${dayOfWeek}s` : ''}${startTime ? ` at ${startTime}` : ''}. You're #${waitlistResult.position} on the list. We'll notify you when a spot opens up!`,
              nextState: 'confirmed',
              extractedData: {},
              quickReplies: ['Register for another program', 'View alternatives'],
              progress: 100,
              recommendations: null,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: true,
            response: {
              message: `I'll add ${context.childName || 'your child'} to the waitlist for ${programName}. You'll be notified when a spot opens up!`,
              nextState: 'confirmed',
              extractedData: {},
              quickReplies: ['Register for another program', 'View alternatives'],
              progress: 100,
              recommendations: null,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let conversationHistory = context.messages || [];

    if (
      conversationHistory.length > 0 &&
      conversationHistory[conversationHistory.length - 1].role === 'user' &&
      conversationHistory[conversationHistory.length - 1].content === message
    ) {
      conversationHistory = conversationHistory.slice(0, -1);
    }

    console.log('=== BUILDING SYSTEM PROMPT ===');
    console.log('Context being passed to buildSystemContext:', JSON.stringify(context, null, 2));
    const systemContext = await buildSystemContext(context, conversationHistory);
    console.log('System prompt first 500 chars:', systemContext.substring(0, 500));
    console.log('==============================');

    const geminiResponse = await callGeminiAPI(systemContext, conversationHistory, message);

    console.log('=== GEMINI FULL RESPONSE ===');
    console.log(JSON.stringify(geminiResponse, null, 2));
    console.log('============================');

    const extractedData = geminiResponse.extractedData || {};
    console.log('=== EXTRACTING DATA FROM GEMINI ===');
    console.log('ExtractedData from Gemini:', JSON.stringify(extractedData, null, 2));
    console.log('Current context before merge:', JSON.stringify(context, null, 2));

    const updatedContext = { ...context, ...extractedData };
    console.log('Updated context after merge:', JSON.stringify(updatedContext, null, 2));
    console.log('Updated context fields:', {
      childName: updatedContext.childName,
      childAge: updatedContext.childAge,
      preferredDays: updatedContext.preferredDays,
      preferredProgram: updatedContext.preferredProgram,
      preferredTime: updatedContext.preferredTime,
      preferredTimeOfDay: updatedContext.preferredTimeOfDay,
    });
    console.log('===================================');

    if (context.selectedSessionId) {
      console.log('User selected specific session:', context.selectedSessionId);

      const selectedSessionDetails = await fetchSessionById(
        supabaseClient,
        context.selectedSessionId
      );

      if (selectedSessionDetails) {
        return new Response(
          JSON.stringify({
            success: true,
            response: {
              message: `Perfect! I'll register ${updatedContext.childName || 'your child'} for ${selectedSessionDetails.programName} on ${selectedSessionDetails.dayOfWeek}s at ${selectedSessionDetails.startTime}. This is a ${selectedSessionDetails.durationWeeks}-week program for $${(selectedSessionDetails.price / 100).toFixed(0)}.`,
              nextState: 'confirming_selection',
              extractedData: updatedContext,
              quickReplies: ['Confirm registration', 'Choose different session'],
              progress: calculateProgress(updatedContext),
              recommendations: [selectedSessionDetails],
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error('Selected session not found:', context.selectedSessionId);
      }
    }

    let recommendations = null;
    let requestedSessionInfo = null;
    let sessionIssue = null;

    const resolvedCity = updatedContext.preferredCity || updatedContext.preferredLocation || null;

    if (updatedContext.childAge && updatedContext.preferredDays && updatedContext.preferredDays.length > 0) {
      console.log('Have enough info to fetch sessions');

      const requestedCheck = await findRequestedSession(
        supabaseClient,
        context.organizationId,
        updatedContext.childAge,
        updatedContext.preferredDays,
        updatedContext.preferredTimeOfDay,
        updatedContext.preferredProgram,
        updatedContext.preferredLocation
      );

      if (requestedCheck.found) {
        console.log('Found requested session:', requestedCheck.issue || 'available');
        requestedSessionInfo = requestedCheck.session;
        sessionIssue = requestedCheck.issue;

        if (sessionIssue) {
          const alternatives = await fetchAlternativeSessions(
            supabaseClient,
            context.organizationId,
            updatedContext.childAge,
            updatedContext.preferredProgram,
            updatedContext.preferredDays,
            updatedContext.preferredTimeOfDay,
            requestedSessionInfo?.locationId
          );

          const issuePrompt = buildUnavailableSessionPrompt(updatedContext, requestedSessionInfo, sessionIssue, alternatives);
          const issueResponse = await callGeminiWithPrompt(issuePrompt, message);

          let sessionToShow = null;
          let alternativesToShow = alternatives;

          if (sessionIssue === 'full') {
            sessionToShow = requestedSessionInfo;
          } else if (sessionIssue === 'no_location_match') {
            alternativesToShow = [requestedSessionInfo, ...alternatives].slice(0, 3);
          }

          return new Response(
            JSON.stringify({
              success: true,
              response: {
                message: issueResponse.message,
                nextState: 'showing_unavailable_session',
                extractedData: updatedContext,
                quickReplies: issueResponse.quickReplies || [],
                progress: calculateProgress(updatedContext),
                requestedSession: sessionToShow,
                sessionIssue: sessionIssue,
                alternatives: alternativesToShow,
              },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      recommendations = await fetchMatchingSessions(
        supabaseClient,
        context.organizationId,
        updatedContext.childAge,
        updatedContext.preferredDays,
        updatedContext.preferredTimeOfDay,
        updatedContext.preferredProgram,
        resolvedCity
      );

      console.log(`Found ${recommendations.length} recommendations`);

      if (recommendations.length === 0) {
        console.log('No exact matches, fetching broader results');
        recommendations = await fetchBroaderMatches(
          supabaseClient,
          context.organizationId,
          updatedContext.childAge,
          updatedContext.preferredDays,
          updatedContext.preferredProgram
        );
        console.log(`Found ${recommendations.length} broader matches`);
      }
    }

    let finalMessage = geminiResponse.message;
    let finalQuickReplies = geminiResponse.quickReplies || [];
    let finalNextState = geminiResponse.nextState || 'collecting_preferences';

    if (recommendations && recommendations.length > 0) {
      const childName = updatedContext.childName || 'your child';
      const sessionCount = recommendations.length;
      const cityText = updatedContext.preferredCity ? ` in ${updatedContext.preferredCity.charAt(0).toUpperCase() + updatedContext.preferredCity.slice(1)}` : '';
      finalMessage = `Great news! I found ${sessionCount} session${sessionCount > 1 ? 's' : ''} for ${childName}${cityText}. Here are the best options:`;
      finalNextState = 'showing_recommendations';
      finalQuickReplies = ['Show other programs', 'Different day/time'];
    } else if (recommendations !== null && recommendations.length === 0 && updatedContext.childAge && updatedContext.preferredDays?.length > 0) {
      const childName = updatedContext.childName || 'your child';
      finalMessage = `I wasn't able to find exact matches for ${childName} with those preferences. Would you like to try different days or times, or perhaps a different location?`;
      finalQuickReplies = ['Show all days', 'Show all locations', 'Start over'];
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: {
          message: finalMessage,
          nextState: finalNextState,
          extractedData: updatedContext,
          quickReplies: finalQuickReplies,
          progress: calculateProgress(updatedContext),
          recommendations: recommendations,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in kai-conversation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        response: {
          message: "I'm having trouble processing your request. Could you try rephrasing that?",
          nextState: 'error',
          extractedData: {},
          quickReplies: ['Start over', 'Try again'],
          progress: 0,
          recommendations: null,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function buildSystemContext(context: any, conversationHistory: any[]): string {
  const hasChildName = !!context.childName;
  const hasChildAge = !!context.childAge;
  const hasPreferences = !!(context.preferredDays && context.preferredDays.length > 0);
  const hasProgram = !!context.preferredProgram;
  const hasLocation = !!context.preferredCity;

  let conversationSummary = '';
  if (conversationHistory && conversationHistory.length > 0) {
    const userMessages = conversationHistory
      .filter((m: any) => m.role === 'user')
      .map((m: any) => m.content);
    if (userMessages.length > 0) {
      conversationSummary = `\n\n## IMPORTANT: Previous Messages from Parent\nThe parent has already said the following in this conversation:\n${userMessages.map((m: string, i: number) => `${i + 1}. "${m}"`).join('\n')}

CRITICAL: Review these messages carefully! If the parent already mentioned a sport, location, day, or time in ANY previous message, DO NOT ask about it again. Use that information!`;
    }
  }

  let systemPrompt = `You are Kai, a friendly AI assistant helping parents register their children for youth sports and activity programs.

## Your Personality
- Warm, conversational, and helpful
- Never robotic or overly formal
- Keep responses SHORT (1-3 sentences max)
- Ask ONE question at a time
- Use parent's language naturally
${conversationSummary}

## Current Registration Progress (what we have stored)`;

  if (!hasChildName) {
    systemPrompt += `\n- Need: Child's name`;
  } else {
    systemPrompt += `\n- Have: Child's name (${context.childName})`;
  }

  if (!hasChildAge) {
    systemPrompt += `\n- Need: Child's age`;
  } else {
    systemPrompt += `\n- Have: Child's age (${context.childAge})`;
  }

  if (!hasProgram) {
    systemPrompt += `\n- Need: Sport/activity preference (CHECK PREVIOUS MESSAGES - parent may have already mentioned this!)`;
  } else {
    systemPrompt += `\n- Have: Sport/activity (${context.preferredProgram})`;
  }

  if (!hasPreferences) {
    systemPrompt += `\n- Need: Schedule preferences (CHECK PREVIOUS MESSAGES - parent may have already mentioned day/time!)`;
  } else {
    const days = (context.preferredDays || []).map((d: number) =>
      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]
    ).join(', ');
    systemPrompt += `\n- Have: Schedule (${days}${context.preferredTimeOfDay ? ', ' + context.preferredTimeOfDay : ''})`;
  }

  if (!hasLocation) {
    systemPrompt += `\n- Optional: Location (CHECK PREVIOUS MESSAGES - parent may have already mentioned this!)`;
  } else {
    systemPrompt += `\n- Have: Location preference (${context.preferredCity})`;
  }

  systemPrompt += `

## CRITICAL: Data Extraction Rules
ALWAYS extract ALL structured data from the ENTIRE CONVERSATION!

**YOU MUST INCLUDE ALL EXTRACTED DATA IN EVERY RESPONSE**, even if it was extracted in previous turns!

Example conversation:
- Message #1: "My five-year-old wants soccer on Monday mornings"
  → Extract: childAge: 5, preferredDays: [1], preferredTimeOfDay: "morning", preferredProgram: "soccer"
- Message #2: "His name is Johnny"
  → Extract: childName: "Johnny", childAge: 5, preferredDays: [1], preferredTimeOfDay: "morning", preferredProgram: "soccer"
- Message #3: "And also Saturday mornings"
  → Extract: childName: "Johnny", childAge: 5, preferredDays: [1, 6], preferredTimeOfDay: "morning", preferredProgram: "soccer"

**ALWAYS RETURN extractedData WITH ALL KNOWN VALUES!** The system needs this data to search for sessions.

Response Format:
{
  "message": "Your conversational response here",
  "extractedData": {
    "childName": "name if known, otherwise OMIT this key entirely",
    "childAge": number if known, otherwise OMIT this key entirely,
    "preferredDays": [array of day numbers 0-6] if known, otherwise OMIT this key entirely,
    "preferredTimeOfDay": "morning|afternoon|evening|any" if known, otherwise OMIT this key entirely,
    "preferredProgram": "sport name" if known, otherwise OMIT this key entirely,
    "preferredCity": "city name in lowercase" if known (e.g., "irvine", "orange"), otherwise OMIT this key entirely,
    "preferredLocation": "specific venue name" if known (e.g., "Oakwood Recreation Center"), otherwise OMIT this key entirely
  },
  "nextState": "greeting|collecting_child_info|collecting_preferences|showing_recommendations",
  "quickReplies": ["suggestion 1", "suggestion 2"]
}

### Day Extraction
- Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6, Sunday=0
- "Weekdays" = [1,2,3,4,5]
- "Weekends" = [0,6]
- "Any day" / "Show all options" / "Flexible" = [0,1,2,3,4,5,6]

### Program Extraction
Look for sport/activity names: soccer, basketball, swim, tennis, art, dance, etc.

### Location Extraction
Extract TWO types of location data:
1. **preferredCity**: City name in lowercase (e.g., "irvine", "orange", "anaheim", "tustin")
   - Parent says: "We're in Irvine" → preferredCity: "irvine"
   - Parent says: "Near Orange" → preferredCity: "orange"
2. **preferredLocation**: Specific venue name if mentioned (e.g., "Oakwood Recreation Center")
   - Parent says: "at Oakwood Recreation Center" → preferredLocation: "Oakwood Recreation Center"

### Time of Day
- "night", "evening", "after 5" = "evening"
- "morning", "before noon" = "morning"
- "afternoon", "after lunch" = "afternoon"
- "Any time" / "Flexible" = "any"

## Conversation Guidelines
1. FIRST: Check if the parent already mentioned sport, day, time, or location in previous messages - DO NOT ask again!
2. If you don't have the child's name, ask for it warmly
3. Once you have name, ask for age if missing
4. Once you have name+age+sport+day/time, say "Let me search for [day] [time] [sport] sessions [in city] for [name]!" - the backend will handle the actual search
5. Keep it conversational - don't sound like a form
6. If parent provides multiple pieces of info, acknowledge ALL before asking next question
7. NEVER ask about something the parent has already told you!
8. CRITICAL: NEVER say "I couldn't find any sessions" or "no sessions available" - you do NOT have access to the database. The backend searches for sessions separately. Just say you're searching and the results will be shown automatically.
9. CRITICAL: You MUST ALWAYS include extractedData in your response with ALL known values. The backend uses extractedData to search. If you don't include it, the search won't run!

## Example: Parent provides info across multiple messages

Message 1: "Do you have Monday night basketball at the Oakwood Recreation Center?"
You should extract: preferredDays: [1], preferredTimeOfDay: "evening", preferredProgram: "basketball", preferredLocation: "Oakwood Recreation Center"
Response: Ask for child's name and age

Message 2: "Johnny age 9"
You should extract: childName: "Johnny", childAge: 9, preferredDays: [1], preferredTimeOfDay: "evening", preferredProgram: "basketball", preferredLocation: "Oakwood Recreation Center"
Response: "Great! Let me look for Monday evening basketball classes near Oakwood Recreation Center for Johnny (age 9)."
DO NOT ask about sport or location - parent already told you in message 1!

Message 3: "Hi, I'd like to sign up my son for soccer. His name is Liam and he's 3 years old. We're in Irvine, Saturday mornings work best"
You should extract: childName: "Liam", childAge: 3, preferredProgram: "soccer", preferredCity: "irvine", preferredDays: [6], preferredTimeOfDay: "morning"
Response: Search for Saturday morning soccer sessions in Irvine for 3-year-olds and show recommendations.`;

  return systemPrompt;
}

async function callGeminiAPI(systemContext: string, conversationHistory: any[], userMessage: string): Promise<any> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const messages = conversationHistory.map((msg: any) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  messages.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemContext }]
      },
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const data = await response.json();
  const textResponse = data.candidates[0].content.parts[0].text;

  try {
    return JSON.parse(textResponse);
  } catch (e) {
    console.error('Failed to parse Gemini response as JSON:', textResponse);
    return {
      message: textResponse,
      extractedData: {},
      nextState: 'collecting_preferences',
      quickReplies: []
    };
  }
}

async function callGeminiWithPrompt(prompt: string, userMessage: string): Promise<any> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: prompt }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: userMessage }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const data = await response.json();
  const textResponse = data.candidates[0].content.parts[0].text;

  try {
    return JSON.parse(textResponse);
  } catch (e) {
    return {
      message: textResponse,
      quickReplies: []
    };
  }
}

function calculateProgress(context: any): number {
  let progress = 0;
  if (context.childName) progress += 33;
  if (context.childAge) progress += 33;
  if (context.preferredDays && context.preferredDays.length > 0) progress += 34;
  return progress;
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let hour = parseInt(parts[0], 10);
  const minute = parts[1] || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

async function fetchMatchingSessions(
  supabase: any,
  organizationId: string,
  childAge: number,
  preferredDays: number[],
  preferredTimeOfDay?: string,
  preferredProgram?: string,
  preferredCity?: string
): Promise<any[]> {
  console.log('Fetching sessions with criteria:', {
    organizationId,
    childAge,
    preferredDays,
    preferredTimeOfDay,
    preferredProgram,
    preferredCity
  });

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id,
      day_of_week,
      start_time,
      start_date,
      end_date,
      capacity,
      enrolled_count,
      status,
      program:programs!inner (
        id,
        name,
        description,
        age_range,
        price_cents,
        duration_weeks,
        organization_id
      ),
      location:locations (
        id,
        name,
        address,
        city
      ),
      coach:staff (
        id,
        name,
        rating
      )
    `)
    .eq('status', 'active')
    .gte('start_date', new Date().toISOString().split('T')[0]);

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  if (!sessions || sessions.length === 0) {
    console.log('No sessions found in database');
    return [];
  }

  console.log(`Found ${sessions.length} total sessions, now filtering...`);

  const filtered = sessions.filter((session: any) => {
    const reasons: string[] = [];

    if (session.enrolled_count >= session.capacity) {
      reasons.push('FULL');
      console.log(`Session ${session.id} filtered: ${reasons.join(', ')}`);
      return false;
    }

    const program = session.program;
    if (!program || !program.age_range) {
      reasons.push('NO_PROGRAM_DATA');
      console.log(`Session ${session.id} filtered: ${reasons.join(', ')}`);
      return false;
    }

    if (program.organization_id !== organizationId) {
      reasons.push(`WRONG_ORG (${program.organization_id} !== ${organizationId})`);
      console.log(`Session ${session.id} filtered: ${reasons.join(', ')}`);
      return false;
    }

    const ageRangeMatch = program.age_range.match(/\[(\d+),(\d+)\)/);
    if (!ageRangeMatch) {
      reasons.push('INVALID_AGE_RANGE');
      console.log(`Session ${session.id} filtered: ${reasons.join(', ')}`);
      return false;
    }

    const minAge = parseInt(ageRangeMatch[1]);
    const maxAge = parseInt(ageRangeMatch[2]);

    if (childAge < minAge || childAge >= maxAge) {
      reasons.push(`AGE_MISMATCH (child ${childAge}, program ${minAge}-${maxAge})`);
      console.log(`Session ${session.id} filtered: ${reasons.join(', ')}`);
      return false;
    }

    if (!preferredDays.includes(session.day_of_week)) {
      reasons.push(`DAY_MISMATCH (session day ${session.day_of_week}, preferred ${preferredDays.join(',')})`);
      console.log(`Session ${session.id} filtered: ${reasons.join(', ')}`);
      return false;
    }

    if (preferredProgram) {
      const programNameMatch = program.name.toLowerCase().includes(preferredProgram.toLowerCase());
      if (!programNameMatch) {
        reasons.push(`PROGRAM_MISMATCH (looking for ${preferredProgram}, found ${program.name})`);
        console.log(`Session ${session.id} filtered: ${reasons.join(', ')}`);
        return false;
      }
    }

    if (preferredTimeOfDay && preferredTimeOfDay !== 'any') {
      const startTime = session.start_time;
      const hour = parseInt(startTime.split(':')[0]);

      if (preferredTimeOfDay === 'morning' && hour >= 12) {
        reasons.push(`TIME_MISMATCH (morning but hour is ${hour})`);
        console.log(`Session ${session.id} filtered: ${reasons.join(', ')}`);
        return false;
      }
      if (preferredTimeOfDay === 'afternoon' && (hour < 12 || hour >= 17)) {
        reasons.push(`TIME_MISMATCH (afternoon but hour is ${hour})`);
        console.log(`Session ${session.id} filtered: ${reasons.join(', ')}`);
        return false;
      }
      if (preferredTimeOfDay === 'evening' && hour < 17) {
        reasons.push(`TIME_MISMATCH (evening but hour is ${hour})`);
        console.log(`Session ${session.id} filtered: ${reasons.join(', ')}`);
        return false;
      }
    }

    if (preferredCity && session.location?.city) {
      const sessionCity = session.location.city.toLowerCase();
      const preferredCityLower = preferredCity.toLowerCase();
      if (!sessionCity.includes(preferredCityLower)) {
        reasons.push(`CITY_MISMATCH (session in ${session.location.city}, preferred ${preferredCity})`);
        console.log(`Session ${session.id} filtered: ${reasons.join(', ')}`);
        return false;
      }
    }

    console.log(` Session ${session.id} (${program.name}) PASSED all filters`);
    return true;
  });

  console.log(`After filtering: ${filtered.length} sessions matched`);

  const topSessions = filtered.slice(0, 3);
  const mapped = await Promise.all(topSessions.map(async (session: any) => {
    const ratings = await fetchSessionRatings(supabase, session.id);

    return {
      sessionId: session.id,
      programName: session.program?.name || 'Unknown Program',
      programDescription: session.program?.description || '',
      ageRange: session.program?.age_range || '[0,18)',
      price: session.program?.price_cents || 0,
      durationWeeks: session.program?.duration_weeks || 0,
      locationId: session.location?.id || null,
      locationName: session.location?.name || 'TBD',
      locationAddress: session.location?.address || '',
      locationRating: ratings.locationRating,
      coachId: session.coach?.id || null,
      coachName: session.coach?.name || 'TBD',
      coachRating: session.coach?.rating || null,
      sessionRating: ratings.sessionRating,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][session.day_of_week],
      startTime: formatTime(session.start_time),
      startDate: session.start_date,
      endDate: session.end_date,
      capacity: session.capacity,
      enrolledCount: session.enrolled_count,
      spotsRemaining: session.capacity - session.enrolled_count,
    };
  }));

  console.log(`Found ${mapped.length} matching sessions`);
  return mapped;
}

async function fetchSessionRatings(supabase: any, sessionId: string): Promise<{ sessionRating: number | null; locationRating: number | null }> {
  const { data: reviews } = await supabase
    .from('session_reviews')
    .select('overall_rating, location_rating')
    .eq('session_id', sessionId);

  if (!reviews || reviews.length === 0) {
    return { sessionRating: null, locationRating: null };
  }

  const sessionRating = reviews.reduce((sum: number, r: any) => sum + parseFloat(r.overall_rating || '0'), 0) / reviews.length;
  const locationRating = reviews.reduce((sum: number, r: any) => sum + parseFloat(r.location_rating || '0'), 0) / reviews.length;

  return {
    sessionRating: Math.round(sessionRating * 10) / 10,
    locationRating: Math.round(locationRating * 10) / 10
  };
}

async function fetchAlternativeSessions(
  supabase: any,
  organizationId: string,
  childAge: number,
  preferredProgram?: string,
  preferredDays?: number[],
  preferredTimeOfDay?: string,
  preferredLocationId?: string
): Promise<any[]> {

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id,
      day_of_week,
      start_time,
      start_date,
      end_date,
      capacity,
      enrolled_count,
      status,
      location_id,
      program:programs!inner (
        id,
        name,
        description,
        age_range,
        price_cents,
        duration_weeks,
        organization_id
      ),
      location:locations (
        id,
        name,
        address,
        city
      ),
      coach:staff (
        id,
        name,
        rating
      )
    `)
    .eq('status', 'active')
    .gte('start_date', new Date().toISOString().split('T')[0]);

  if (error || !sessions) {
    console.log('Error fetching alternative sessions:', error);
    return [];
  }

  console.log(`Fetching alternatives: ${sessions.length} total sessions to evaluate`);

  interface ScoredAlternative {
    session: any;
    matchScore: number;
    alternativeType: 'adjacent_day' | 'alternative_time' | 'alternative_location' | 'similar_program';
  }

  const scoredAlternatives: ScoredAlternative[] = [];
  const primaryDay = preferredDays?.[0];

  for (const session of sessions) {
    const program = session.program;
    if (!program) continue;
    if (program.organization_id !== organizationId) continue;

    const spotsRemaining = session.capacity - (session.enrolled_count || 0);
    if (spotsRemaining <= 0) continue;

    const ageRangeMatch = program.age_range?.match(/\[(\d+),(\d+)\)/);
    if (!ageRangeMatch) continue;

    const minAge = parseInt(ageRangeMatch[1]);
    const maxAge = parseInt(ageRangeMatch[2]);
    if (childAge < minAge || childAge >= maxAge) continue;

    const programMatches = preferredProgram
      ? program.name.toLowerCase().includes(preferredProgram.toLowerCase())
      : true;

    if (!programMatches) continue;

    const sessionHour = parseInt(session.start_time.split(':')[0]);
    const sessionTimeOfDay = sessionHour < 12 ? 'morning' : sessionHour < 17 ? 'afternoon' : 'evening';

    let alternativeType: ScoredAlternative['alternativeType'] = 'similar_program';
    let matchScore = 50;

    if (primaryDay !== undefined) {
      const dayDiff = Math.abs(primaryDay - session.day_of_week);
      const isAdjacentDay = dayDiff === 1 || dayDiff === 6;

      if (isAdjacentDay && (!preferredTimeOfDay || sessionTimeOfDay === preferredTimeOfDay || preferredTimeOfDay === 'any')) {
        alternativeType = 'adjacent_day';
        matchScore = 90;
      } else if (session.day_of_week === primaryDay) {
        if (preferredTimeOfDay && sessionTimeOfDay !== preferredTimeOfDay && preferredTimeOfDay !== 'any') {
          alternativeType = 'alternative_time';
          matchScore = 85;
        } else if (preferredLocationId && session.location_id !== preferredLocationId) {
          alternativeType = 'alternative_location';
          matchScore = 80;
        }
      }
    }

    if (session.coach?.rating) {
      matchScore += Math.min(parseFloat(session.coach.rating) || 0, 5);
    }

    const percentFull = ((session.enrolled_count || 0) / session.capacity) * 100;
    if (percentFull < 50) {
      matchScore += 5;
    }

    scoredAlternatives.push({ session, matchScore, alternativeType });
  }

  scoredAlternatives.sort((a, b) => b.matchScore - a.matchScore);

  console.log(`Found ${scoredAlternatives.length} scored alternatives`);
  if (scoredAlternatives.length > 0) {
    console.log('Top alternatives by type:',
      scoredAlternatives.slice(0, 5).map(a => `${a.alternativeType}: ${a.matchScore}`)
    );
  }

  const topAlternatives = scoredAlternatives.slice(0, 3);
  const mappedAlternatives = await Promise.all(topAlternatives.map(async ({ session, matchScore, alternativeType }) => {
    const ratings = await fetchSessionRatings(supabase, session.id);
    const program = session.program;

    return {
      sessionId: session.id,
      programName: program.name,
      programDescription: program.description || '',
      ageRange: program.age_range,
      price: program.price_cents || 0,
      durationWeeks: program.duration_weeks || 0,
      locationId: session.location?.id || null,
      locationName: session.location?.name || 'TBD',
      locationAddress: session.location?.address || '',
      locationRating: ratings.locationRating,
      coachId: session.coach?.id || null,
      coachName: session.coach?.name || 'TBD',
      coachRating: session.coach?.rating || null,
      sessionRating: ratings.sessionRating,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][session.day_of_week],
      startTime: formatTime(session.start_time),
      startDate: session.start_date,
      endDate: session.end_date,
      capacity: session.capacity,
      enrolledCount: session.enrolled_count,
      spotsRemaining: session.capacity - session.enrolled_count,
      matchScore,
      alternativeType,
    };
  }));

  console.log(`Returning ${mappedAlternatives.length} alternative sessions with scores`);
  return mappedAlternatives;
}

function buildFullSessionPrompt(context: any, fullSession: any, alternatives: any[]): string {
  const hasAlternatives = alternatives.length > 0;

  const alternativesText = hasAlternatives
    ? alternatives.map((alt: any) => `${alt.programName} on ${alt.dayOfWeek}s at ${alt.startTime}`).join(', ')
    : 'none at this time';

  return `You are Kai, a friendly AI helping parents register their children for youth sports programs.

## SITUATION:
A parent requested: ${fullSession.programName} on ${fullSession.dayOfWeek}s at ${fullSession.startTime}
For ${context.childName || 'their child'} (age ${context.childAge})

Unfortunately, THIS SPECIFIC CLASS IS FULL (${fullSession.enrolledCount}/${fullSession.capacity} enrolled).

${hasAlternatives ? `## AVAILABLE ALTERNATIVES:
${alternativesText}

Your job: Acknowledge the full class, then suggest these alternatives enthusiastically.` : `## NO ALTERNATIVES AVAILABLE
Your job: Acknowledge the full class and offer to add them to the waitlist.`}

## YOUR RESPONSE (JSON format):
{
  "message": "Your 1-2 sentence response acknowledging the full class and ${hasAlternatives ? 'suggesting alternatives' : 'offering waitlist'}",
  "quickReplies": ${hasAlternatives ? '["View alternatives", "Join waitlist"]' : '["Join waitlist", "Show other programs"]'}
}

Keep it friendly and helpful. Don't apologize excessively.`;
}

async function findRequestedSession(
  supabase: any,
  organizationId: string,
  childAge: number,
  preferredDays?: number[],
  preferredTimeOfDay?: string,
  preferredProgram?: string,
  preferredLocation?: string
): Promise<{ found: boolean; session: any | null; issue: string | null; requestedLocationName?: string }> {

  if (!preferredProgram || !preferredDays || preferredDays.length === 0) {
    return { found: false, session: null, issue: null };
  }

  console.log('Looking for requested session:', { preferredProgram, preferredDays, preferredTimeOfDay, childAge, preferredLocation });

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id,
      day_of_week,
      start_time,
      start_date,
      end_date,
      capacity,
      enrolled_count,
      status,
      program:programs!inner (
        id,
        name,
        description,
        age_range,
        price_cents,
        duration_weeks,
        organization_id
      ),
      location:locations (
        id,
        name,
        address,
        city
      ),
      coach:staff (
        id,
        name,
        rating
      )
    `)
    .in('status', ['active', 'full'])
    .gte('start_date', new Date().toISOString().split('T')[0]);

  if (error || !sessions) {
    console.log('Error fetching sessions:', error);
    return { found: false, session: null, issue: null };
  }

  let foundAtOtherLocation = false;
  let bestAlternativeSession = null;

  for (const session of sessions) {
    const program = session.program;
    if (!program) continue;

    if (program.organization_id !== organizationId) continue;

    const programNameMatch = program.name.toLowerCase().includes(preferredProgram.toLowerCase());
    if (!programNameMatch) continue;

    if (!preferredDays.includes(session.day_of_week)) continue;

    if (preferredTimeOfDay && preferredTimeOfDay !== 'any') {
      const startTime = session.start_time;
      const hour = parseInt(startTime.split(':')[0]);

      if (preferredTimeOfDay === 'morning' && hour >= 12) continue;
      if (preferredTimeOfDay === 'afternoon' && (hour < 12 || hour >= 17)) continue;
      if (preferredTimeOfDay === 'evening' && hour < 17) continue;
    }

    const ageRangeMatch = program.age_range?.match(/\[(\d+),(\d+)\)/);
    if (ageRangeMatch) {
      const minAge = parseInt(ageRangeMatch[1]);
      const maxAge = parseInt(ageRangeMatch[2]);
      if (childAge < minAge || childAge >= maxAge) {
        continue;
      }
    }

    if (preferredLocation) {
      const locationName = session.location?.name?.toLowerCase() || '';
      const locationCity = session.location?.city?.toLowerCase() || '';
      const prefLower = preferredLocation.toLowerCase();
      const locationMatches = locationName.includes(prefLower) ||
                              prefLower.includes(locationName) ||
                              locationCity.includes(prefLower) ||
                              prefLower.includes(locationCity);

      if (!locationMatches) {
        foundAtOtherLocation = true;
        if (!bestAlternativeSession) {
          bestAlternativeSession = session;
        }
        continue;
      }
    }

    console.log('Found exact match:', session.id, program.name);

    const ratings = await fetchSessionRatings(supabase, session.id);

    const sessionData = {
      sessionId: session.id,
      programName: program.name,
      programDescription: program.description || '',
      ageRange: program.age_range,
      price: program.price_cents || 0,
      durationWeeks: program.duration_weeks || 0,
      locationId: session.location?.id || null,
      locationName: session.location?.name || 'TBD',
      locationAddress: session.location?.address || '',
      locationRating: ratings.locationRating,
      coachId: session.coach?.id || null,
      coachName: session.coach?.name || 'TBD',
      coachRating: session.coach?.rating || null,
      sessionRating: ratings.sessionRating,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][session.day_of_week],
      startTime: formatTime(session.start_time),
      startDate: session.start_date,
      endDate: session.end_date,
      capacity: session.capacity,
      enrolledCount: session.enrolled_count,
      spotsRemaining: session.capacity - session.enrolled_count,
    };

    if (session.status === 'full' || session.enrolled_count >= session.capacity) {
      return { found: true, session: sessionData, issue: 'full' };
    }

    return { found: true, session: sessionData, issue: null };
  }

  if (preferredLocation && foundAtOtherLocation && bestAlternativeSession) {
    const ratings = await fetchSessionRatings(supabase, bestAlternativeSession.id);
    const program = bestAlternativeSession.program;

    const alternativeData = {
      sessionId: bestAlternativeSession.id,
      programName: program.name,
      programDescription: program.description || '',
      ageRange: program.age_range,
      price: program.price_cents || 0,
      durationWeeks: program.duration_weeks || 0,
      locationId: bestAlternativeSession.location?.id || null,
      locationName: bestAlternativeSession.location?.name || 'TBD',
      locationAddress: bestAlternativeSession.location?.address || '',
      locationRating: ratings.locationRating,
      coachId: bestAlternativeSession.coach?.id || null,
      coachName: bestAlternativeSession.coach?.name || 'TBD',
      coachRating: bestAlternativeSession.coach?.rating || null,
      sessionRating: ratings.sessionRating,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][bestAlternativeSession.day_of_week],
      startTime: formatTime(bestAlternativeSession.start_time),
      startDate: bestAlternativeSession.start_date,
      endDate: bestAlternativeSession.end_date,
      capacity: bestAlternativeSession.capacity,
      enrolledCount: bestAlternativeSession.enrolled_count,
      spotsRemaining: bestAlternativeSession.capacity - bestAlternativeSession.enrolled_count,
    };

    return {
      found: true,
      session: alternativeData,
      issue: 'no_location_match',
      requestedLocationName: preferredLocation
    };
  }

  return { found: false, session: null, issue: null };
}

function buildUnavailableSessionPrompt(context: any, requestedSession: any, issue: string, alternatives: any[]): string {
  const hasAlternatives = alternatives.length > 0 || (issue === 'no_location_match' && requestedSession);
  const childName = context.childName || 'your child';
  const childAge = context.childAge;
  const requestedLocation = context.preferredLocation || '';

  let issueDescription = '';
  if (issue === 'full') {
    issueDescription = `THIS SPECIFIC CLASS IS FULL (${requestedSession.enrolledCount}/${requestedSession.capacity} enrolled).`;
  } else if (issue === 'wrong_age') {
    const ageRange = requestedSession.ageRange || '';
    const match = ageRange.match(/\[(\d+),(\d+)\)/);
    const ageText = match ? `ages ${match[1]}-${parseInt(match[2])-1}` : 'a different age group';
    issueDescription = `This ${requestedSession.programName} class is for ${ageText}, but ${childName} is ${childAge} years old.`;
  } else if (issue === 'no_location_match') {
    issueDescription = `We don't have ${requestedSession.programName} at ${requestedLocation} on the requested day/time. However, we found the same program at ${requestedSession.locationName}.`;
  }

  let alternativesDescription = '';
  if (issue === 'no_location_match' && requestedSession) {
    alternativesDescription = `\n### BEST MATCH - Same program at different location:`;
    alternativesDescription += `\n- ${requestedSession.programName} at ${requestedSession.locationName} on ${requestedSession.dayOfWeek}s at ${requestedSession.startTime} (${requestedSession.spotsRemaining} spots available)`;
  } else if (alternatives.length > 0) {
    const adjacentDays = alternatives.filter((a: any) => a.alternativeType === 'adjacent_day');
    const altTimes = alternatives.filter((a: any) => a.alternativeType === 'alternative_time');
    const altLocations = alternatives.filter((a: any) => a.alternativeType === 'alternative_location');
    const similarPrograms = alternatives.filter((a: any) => a.alternativeType === 'similar_program');

    if (adjacentDays.length > 0) {
      alternativesDescription += `\n### BEST MATCH - Adjacent Day (same time, different day):`;
      adjacentDays.forEach((alt: any) => {
        alternativesDescription += `\n- ${alt.programName} on ${alt.dayOfWeek}s at ${alt.startTime} (${alt.spotsRemaining} spots, score: ${alt.matchScore})`;
      });
    }

    if (altTimes.length > 0) {
      alternativesDescription += `\n### Alternative Time (same day, different time):`;
      altTimes.forEach((alt: any) => {
        alternativesDescription += `\n- ${alt.programName} on ${alt.dayOfWeek}s at ${alt.startTime} (${alt.spotsRemaining} spots, score: ${alt.matchScore})`;
      });
    }

    if (altLocations.length > 0) {
      alternativesDescription += `\n### Alternative Location (same day/time):`;
      altLocations.forEach((alt: any) => {
        alternativesDescription += `\n- ${alt.programName} at ${alt.locationName} on ${alt.dayOfWeek}s at ${alt.startTime} (${alt.spotsRemaining} spots)`;
      });
    }

    if (similarPrograms.length > 0) {
      alternativesDescription += `\n### Other Options:`;
      similarPrograms.forEach((alt: any) => {
        alternativesDescription += `\n- ${alt.programName} on ${alt.dayOfWeek}s at ${alt.startTime} (${alt.spotsRemaining} spots)`;
      });
    }
  }

  const quickRepliesForLocation = '["View alternatives", "Show other programs"]';
  const quickRepliesForFull = '["View alternatives", "Join waitlist", "Show other programs"]';
  const quickRepliesNoAlts = '["Show all programs"]';

  let quickReplies = quickRepliesNoAlts;
  if (issue === 'no_location_match') {
    quickReplies = quickRepliesForLocation;
  } else if (hasAlternatives) {
    quickReplies = quickRepliesForFull;
  }

  return `You are Kai, a friendly AI helping parents register their children for youth sports programs.

## SITUATION:
Parent requested: ${requestedSession.programName}${requestedLocation ? ` at ${requestedLocation}` : ''} on ${requestedSession.dayOfWeek}s at ${requestedSession.startTime}
For ${childName} (age ${childAge})

${issueDescription}

${hasAlternatives ? `## AVAILABLE ALTERNATIVES (ranked by match quality):
${alternativesDescription}

Your job: ${issue === 'no_location_match' ? 'Explain that the requested location doesn\'t have this program on this day/time, but enthusiastically present the alternative location option.' : 'Acknowledge the issue clearly and briefly, then enthusiastically present the BEST alternative first (highest score). If it\'s an adjacent day, mention it\'s the same time just a different day. If it\'s alternative time, mention it\'s the same day.'}` : `## NO SUITABLE ALTERNATIVES FOUND
Your job: Acknowledge the issue and suggest looking at other programs. Be empathetic but helpful.`}

## YOUR RESPONSE (JSON format):
{
  "message": "1-2 sentences ${issue === 'no_location_match' ? 'explaining the location situation and suggesting the alternative' : (hasAlternatives ? 'acknowledging the issue and presenting the best alternative option enthusiastically' : 'acknowledging the situation and suggesting other programs')}",
  "quickReplies": ${quickReplies}
}

Be direct, enthusiastic about alternatives, and helpful. Don't over-apologize.`;
}

async function fetchBroaderMatches(
  supabase: any,
  organizationId: string,
  childAge: number,
  preferredDays?: number[],
  preferredProgram?: string
): Promise<any[]> {

  console.log('Fetching broader matches for:', { organizationId, childAge, preferredDays, preferredProgram });

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id,
      day_of_week,
      start_time,
      start_date,
      end_date,
      capacity,
      enrolled_count,
      status,
      program:programs!inner (
        id,
        name,
        description,
        age_range,
        price_cents,
        duration_weeks,
        organization_id
      ),
      location:locations (
        id,
        name,
        address,
        city
      ),
      coach:staff (
        id,
        name,
        rating
      )
    `)
    .eq('status', 'active')
    .gte('start_date', new Date().toISOString().split('T')[0]);

  if (error || !sessions) {
    console.log('Error fetching broader sessions:', error);
    return [];
  }

  const filtered = sessions.filter((session: any) => {
    const program = session.program;
    if (!program || !program.age_range) return false;
    if (program.organization_id !== organizationId) return false;
    if (session.enrolled_count >= session.capacity) return false;

    const ageRangeMatch = program.age_range.match(/\[(\d+),(\d+)\)/);
    if (!ageRangeMatch) return false;

    const minAge = parseInt(ageRangeMatch[1]);
    const maxAge = parseInt(ageRangeMatch[2]);

    if (childAge < minAge || childAge >= maxAge) return false;

    if (preferredDays && preferredDays.length > 0 && preferredDays.length < 7) {
      if (!preferredDays.includes(session.day_of_week)) return false;
    }

    return true;
  });

  console.log(`Found ${filtered.length} broader matches`);

  const topSessions = filtered.slice(0, 5);
  const mapped = await Promise.all(topSessions.map(async (session: any) => {
    const ratings = await fetchSessionRatings(supabase, session.id);

    return {
      sessionId: session.id,
      programName: session.program?.name || 'Unknown Program',
      programDescription: session.program?.description || '',
      ageRange: session.program?.age_range || '[0,18)',
      price: session.program?.price_cents || 0,
      durationWeeks: session.program?.duration_weeks || 0,
      locationId: session.location?.id || null,
      locationName: session.location?.name || 'TBD',
      locationAddress: session.location?.address || '',
      locationRating: ratings.locationRating,
      coachId: session.coach?.id || null,
      coachName: session.coach?.name || 'TBD',
      coachRating: session.coach?.rating || null,
      sessionRating: ratings.sessionRating,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][session.day_of_week],
      startTime: formatTime(session.start_time),
      startDate: session.start_date,
      endDate: session.end_date,
      capacity: session.capacity,
      enrolledCount: session.enrolled_count,
      spotsRemaining: session.capacity - session.enrolled_count,
    };
  }));

  return mapped;
}

async function fetchSessionById(supabase: any, sessionId: string): Promise<any | null> {
  console.log('Fetching session by ID:', sessionId);

  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      id,
      day_of_week,
      start_time,
      start_date,
      end_date,
      capacity,
      enrolled_count,
      status,
      program:programs!inner (
        id,
        name,
        description,
        age_range,
        price_cents,
        duration_weeks
      ),
      location:locations (
        id,
        name,
        address,
        city
      ),
      coach:staff (
        id,
        name,
        rating
      )
    `)
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !session) {
    console.error('Error fetching session by ID:', error);
    return null;
  }

  const ratings = await fetchSessionRatings(supabase, session.id);

  return {
    sessionId: session.id,
    programName: session.program?.name || 'Unknown Program',
    programDescription: session.program?.description || '',
    ageRange: session.program?.age_range || '[0,18)',
    price: session.program?.price_cents || 0,
    durationWeeks: session.program?.duration_weeks || 0,
    locationId: session.location?.id || null,
    locationName: session.location?.name || 'TBD',
    locationAddress: session.location?.address || '',
    locationRating: ratings.locationRating,
    coachId: session.coach?.id || null,
    coachName: session.coach?.name || 'TBD',
    coachRating: session.coach?.rating || null,
    sessionRating: ratings.sessionRating,
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][session.day_of_week],
    startTime: formatTime(session.start_time),
    startDate: session.start_date,
    endDate: session.end_date,
    capacity: session.capacity,
    enrolledCount: session.enrolled_count,
    spotsRemaining: session.capacity - session.enrolled_count,
  };
}

async function addToWaitlist(
  supabase: any,
  sessionId: string,
  childName?: string,
  childAge?: number,
  familyId?: string
): Promise<{ success: boolean; position?: number; error?: string }> {
  try {
    console.log('Adding to waitlist:', { sessionId, childName, childAge, familyId });

    const { count: currentCount } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('status', 'active');

    const position = (currentCount || 0) + 1;

    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        session_id: sessionId,
        family_id: familyId || null,
        child_id: null,
        position: position,
        alternatives_shown: null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding to waitlist:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully added to waitlist:', data);
    return { success: true, position };

  } catch (error) {
    console.error('Waitlist error:', error);
    return { success: false, error: 'Failed to add to waitlist' };
  }
}