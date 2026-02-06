# N8N Webhook Setup Guide

Your n8n webhook URL is configured: `https://n8n.rockethub.ai/webhook/kai-conversation`

## Testing the Webhook

Visit `/test-n8n` in your application to test if your n8n webhook is responding correctly.

## Expected Request Format

Your n8n workflow will receive POST requests with this structure:

```json
{
  "message": "User's message text",
  "conversationId": "uuid-of-conversation",
  "context": {
    "organizationId": "org-uuid",
    "familyId": "family-uuid or null",
    "tempFamilyId": "temp-uuid",
    "tempChildId": "temp-uuid",
    "isAuthenticated": false,
    "currentState": "greeting",
    "childName": "Emma",
    "childAge": 5,
    "preferredDays": [6],
    "preferredTime": "morning",
    "preferredTimeOfDay": "morning",
    "preferredProgram": "Mini Soccer",
    "preferredLocation": "Irvine",
    "selectedSessionId": "session-uuid or null",
    "storedAlternatives": [],
    "storedRequestedSession": null,
    "messages": [
      { "role": "user", "content": "Previous message" },
      { "role": "assistant", "content": "Previous response" }
    ]
  }
}
```

## Required Response Format

Your n8n workflow MUST respond with this structure:

```json
{
  "success": true,
  "response": {
    "message": "Hi! I'd be happy to help you register your child for soccer. To find the perfect program, could you tell me your child's name and age?",
    "nextState": "collecting_preferences",
    "extractedData": {
      "childName": "Emma",
      "childAge": 5,
      "preferredDays": [6],
      "preferredTime": "morning"
    },
    "quickReplies": [
      "Tell you about my child",
      "Show me all programs",
      "I have questions"
    ],
    "progress": 25
  }
}
```

## Response Fields Explained

### Required Fields

- **success** (boolean): Whether the request was processed successfully
- **response.message** (string): The AI's response text to show the user
- **response.nextState** (string): The next conversation state

Valid states:
- `greeting` - Initial state
- `collecting_preferences` - Gathering child info and preferences
- `showing_recommendations` - Displaying session options
- `handling_objection` - Dealing with full classes or concerns
- `confirming_selection` - User has selected a session
- `processing_registration` - Finalizing registration
- `completed` - Registration complete

### Optional Fields

- **response.extractedData** (object): Data extracted from user's message
  - `childName` (string)
  - `childAge` (number)
  - `preferredDays` (number[]): Day of week (0=Sunday, 6=Saturday)
  - `preferredTime` (string): e.g., "09:00"
  - `preferredTimeOfDay` (string): "morning", "afternoon", "evening"
  - `preferredProgram` (string): Program name
  - `preferredLocation` (string): Location name or area

- **response.quickReplies** (string[]): Quick reply buttons to show
- **response.progress** (number): Progress percentage (0-100)
- **response.recommendations** (array): Session recommendations
- **response.alternatives** (array): Alternative sessions when preferred is full
- **response.requestedSession** (object): The full session user requested
- **response.sessionIssue** (string): "full" | "wrong_age" | "no_location_match" | null

## Session Recommendation Format

When returning recommendations or alternatives:

```json
{
  "sessionId": "uuid",
  "programName": "Mini Soccer",
  "programDescription": "Perfect for 4-6 year olds",
  "price": 22400,
  "durationWeeks": 8,
  "locationName": "Beacon Park",
  "locationAddress": "123 Main St, Irvine, CA",
  "locationRating": 4.8,
  "coachName": "Coach Sarah",
  "coachRating": 4.9,
  "sessionRating": 4.7,
  "dayOfWeek": "Saturday",
  "startTime": "09:00",
  "startDate": "2025-03-15",
  "capacity": 12,
  "enrolledCount": 8,
  "spotsRemaining": 4,
  "isFull": false
}
```

Note: Price is in cents (e.g., 22400 = $224.00)

## Error Response Format

If something goes wrong:

```json
{
  "success": false,
  "error": {
    "code": "PROCESSING_ERROR",
    "message": "I'm having trouble right now. Let me show you a form instead.",
    "fallbackToForm": true
  }
}
```

## Testing Checklist

1. ✅ Webhook URL is configured in `.env`
2. ⬜ N8N workflow is active and listening
3. ⬜ Workflow accepts POST requests with JSON body
4. ⬜ Workflow returns the correct response format
5. ⬜ Test using `/test-n8n` page shows success
6. ⬜ Chat interface receives and displays responses

## Common Issues

### Issue: Chat doesn't show responses

**Cause**: N8N webhook not responding or returning wrong format

**Solution**:
1. Check n8n workflow is active
2. Test using `/test-n8n` page
3. Verify response format matches exactly
4. Check browser console for errors

### Issue: "N8N_NOT_CONFIGURED" error

**Cause**: Environment variable not set

**Solution**: Ensure `VITE_N8N_WEBHOOK_URL` is in `.env` file

### Issue: Timeout errors

**Cause**: N8N taking too long to respond

**Solution**: Optimize workflow, timeout is 30 seconds

## Next Steps

1. Visit `/test-n8n` to test your webhook
2. Configure your n8n workflow to match the formats above
3. Test the full chat flow at `/`
4. Check browser console for detailed logs

## Example N8N Workflow

Your n8n workflow should:

1. **Webhook Node**: Receive POST request
2. **Function Node**: Process message and context
3. **AI Node (Gemini/OpenAI)**: Generate response
4. **Function Node**: Format response to match required structure
5. **Respond to Webhook**: Return formatted JSON

Need help? Check the existing edge function at `supabase/functions/kai-conversation/` for reference implementation.
