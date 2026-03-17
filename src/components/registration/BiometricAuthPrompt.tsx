/**
 * BiometricAuthPrompt
 *
 * Displays a biometric authentication option on the payment step for returning families.
 * Shows only when:
 * - Device supports WebAuthn platform authenticator
 * - A biometric credential is already registered (returning user)
 *
 * For new users completing registration, an opt-in prompt appears post-confirmation
 * to save biometrics for next time (handled in RegistrationConfirmation).
 */

import { Fingerprint, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

interface BiometricAuthPromptProps {
  /** Called when biometric auth succeeds — parent can skip re-entering card details */
  onAuthSuccess: () => void;
  /** Called when user dismisses the prompt */
  onDismiss: () => void;
  /** User's email — used to display personalized prompt */
  userEmail?: string;
  className?: string;
}

export default function BiometricAuthPrompt({
  onAuthSuccess,
  onDismiss,
  userEmail,
  className = '',
}: BiometricAuthPromptProps) {
  const { isSupported, isRegistered, isAuthenticating, error, authenticate } = useBiometricAuth();

  // Don't render if not supported or no credential registered
  if (!isSupported || !isRegistered) return null;

  async function handleBiometricAuth() {
    const success = await authenticate();
    if (success) {
      onAuthSuccess();
    }
  }

  return (
    <div
      className={`relative bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 ${className}`}
    >
      <button
        onClick={onDismiss}
        aria-label="Dismiss biometric prompt"
        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/60 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
          {isAuthenticating ? (
            <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
          ) : (
            <Fingerprint className="h-6 w-6 text-indigo-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-indigo-900 text-sm">
            Quick checkout with biometrics
          </h3>
          <p className="text-indigo-700 text-xs mt-0.5">
            {userEmail
              ? `Authenticate as ${userEmail} using Face ID or Touch ID`
              : 'Use Face ID or Touch ID to verify your identity'}
          </p>

          {error && (
            <div className="mt-2 flex items-center gap-1.5 text-red-600">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          <button
            onClick={handleBiometricAuth}
            disabled={isAuthenticating}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px]"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4" />
                Authenticate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * BiometricSetupPrompt
 *
 * Shown on RegistrationConfirmation to let new users opt into biometrics for next time.
 */
interface BiometricSetupPromptProps {
  userEmail: string;
  userName: string;
  onSetupComplete: () => void;
  onSkip: () => void;
  className?: string;
}

export function BiometricSetupPrompt({
  userEmail,
  userName,
  onSetupComplete,
  onSkip,
  className = '',
}: BiometricSetupPromptProps) {
  const { isSupported, isRegistered, isAuthenticating, error, register } = useBiometricAuth();

  // Don't show if not supported, already registered, or (edge case) no email
  if (!isSupported || isRegistered || !userEmail) return null;

  async function handleSetup() {
    const success = await register(userEmail, userName);
    if (success) {
      onSetupComplete();
    }
  }

  return (
    <div
      className={`bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
          {isAuthenticating ? (
            <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
          ) : (
            <Fingerprint className="h-6 w-6 text-purple-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-purple-900 text-sm">
            Save your biometrics for faster checkout
          </h3>
          <p className="text-purple-700 text-xs mt-0.5">
            Next time you register, verify instantly with Face ID or Touch ID — no need to re-enter your details.
          </p>

          {error && (
            <div className="mt-2 flex items-center gap-1.5 text-red-600">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleSetup}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all duration-200 min-h-[44px]"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4" />
                  Enable Biometrics
                </>
              )}
            </button>

            <button
              onClick={onSkip}
              className="px-3 py-2 text-purple-600 text-sm hover:text-purple-800 transition-colors min-h-[44px]"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * BiometricSuccess
 *
 * Brief success state shown after biometric auth completes.
 */
export function BiometricSuccess({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 ${className}`}
    >
      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-green-900">Identity verified</p>
        <p className="text-xs text-green-700">Biometric authentication successful</p>
      </div>
    </div>
  );
}
