import { useState } from 'react';
import { Check, X, Loader, AlertCircle, ExternalLink } from 'lucide-react';

export function TestN8N() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

  const testWebhook = async () => {
    setTesting(true);
    setResult(null);

    try {
      const testPayload = {
        message: "Test message",
        conversationId: "test-conversation-id",
        context: {
          organizationId: "test-org",
          isAuthenticated: false,
          currentState: "greeting",
          messages: []
        }
      };

      console.log('Testing n8n webhook:', webhookUrl);
      console.log('Payload:', testPayload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (response.ok) {
        setResult({
          success: true,
          message: 'Webhook is working!',
          details: data
        });
      } else {
        setResult({
          success: false,
          message: `Webhook returned error: ${response.status}`,
          details: data
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h1 className="text-2xl font-bold text-white mb-6">N8N Webhook Test</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Webhook URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={webhookUrl || 'Not configured'}
                  readOnly
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-sm"
                />
                {webhookUrl ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-red-400" />
                )}
              </div>
            </div>

            {!webhookUrl && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-300 font-medium mb-1">
                      Webhook URL not configured
                    </p>
                    <p className="text-amber-200/70 text-sm">
                      Add VITE_N8N_WEBHOOK_URL to your .env file
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={testWebhook}
              disabled={!webhookUrl || testing}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <span>Test Webhook Connection</span>
              )}
            </button>

            {result && (
              <div className={`rounded-lg p-4 border ${
                result.success
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium mb-2 ${
                      result.success ? 'text-emerald-300' : 'text-red-300'
                    }`}>
                      {result.message}
                    </p>
                    {result.details && (
                      <div className="bg-slate-900 rounded-lg p-3 mt-3">
                        <p className="text-slate-400 text-xs mb-2">Response:</p>
                        <pre className="text-xs text-slate-300 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <h3 className="text-white font-medium mb-3">Expected Response Format</h3>
              <pre className="text-xs text-slate-300 overflow-auto">
{`{
  "success": true,
  "response": {
    "message": "Your AI response here",
    "nextState": "collecting_preferences",
    "extractedData": {
      "childName": "Emma",
      "childAge": 5
    },
    "quickReplies": ["Option 1", "Option 2"],
    "progress": 25
  }
}`}
              </pre>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-300 font-medium mb-1">
                    Next Steps
                  </p>
                  <ol className="text-blue-200/70 text-sm space-y-1 list-decimal list-inside">
                    <li>Configure your n8n workflow to respond to POST requests</li>
                    <li>Make sure it accepts the payload format shown above</li>
                    <li>Return a response matching the expected format</li>
                    <li>Test the webhook using this page</li>
                    <li>Once working, the chat interface will use it automatically</li>
                  </ol>
                  <a
                    href="https://n8n.rockethub.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    <span>Open N8N Dashboard</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/"
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                Back to Chat
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
