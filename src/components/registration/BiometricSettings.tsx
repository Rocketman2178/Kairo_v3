import { Fingerprint, Shield } from 'lucide-react';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

interface BiometricSettingsProps {
  /** Parent email — required to register a new biometric credential */
  userEmail?: string;
  /** Parent display name — used as the WebAuthn credential display name */
  userName?: string;
}

/**
 * BiometricSettings
 *
 * Shows the current biometric (Face ID / Touch ID) status and lets the user
 * enable or disable it. Used on the RegistrationConfirmation page and any
 * future account-settings screen.
 *
 * - If biometrics are NOT registered: shows "Enable" button (requires email/name)
 * - If biometrics ARE registered: shows "Disable" button
 * - Hidden entirely on devices that do not support WebAuthn platform authenticators
 */
export function BiometricSettings({ userEmail, userName }: BiometricSettingsProps) {
  const {
    isSupported,
    isRegistered,
    isAuthenticating,
    error,
    register,
    clear,
  } = useBiometricAuth();

  if (!isSupported) return null;

  const canEnable = !isRegistered && Boolean(userEmail) && Boolean(userName);

  async function handleToggle() {
    if (isRegistered) {
      clear();
    } else if (canEnable) {
      await register(userEmail!, userName!);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Security Settings</p>
          <p className="text-xs text-gray-500">Manage biometric login for faster access</p>
        </div>
      </div>

      {/* Biometric row */}
      <div className="border-t border-gray-100">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Fingerprint className={`w-5 h-5 flex-shrink-0 ${isRegistered ? 'text-indigo-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm font-medium text-gray-900">Face ID / Touch ID</p>
              <p className="text-xs text-gray-500">
                {isRegistered
                  ? 'Enabled — sign in with biometrics next visit'
                  : userEmail
                    ? 'Tap to enable quick biometric login'
                    : 'Complete registration to enable biometrics'}
              </p>
            </div>
          </div>

          {/* Toggle pill */}
          <button
            onClick={handleToggle}
            disabled={isAuthenticating || (!isRegistered && !canEnable)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 ${
              isRegistered ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={isRegistered}
            aria-label="Toggle biometric login"
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                isRegistered ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Status messages */}
      {(error || isAuthenticating) && (
        <div className="px-4 pb-3">
          {isAuthenticating && (
            <p className="text-xs text-indigo-600">Setting up biometrics…</p>
          )}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
