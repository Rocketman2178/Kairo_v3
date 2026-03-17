/**
 * useBiometricAuth
 *
 * WebAuthn-based biometric authentication for returning families.
 * Supports Face ID (iOS), Touch ID (macOS/iOS), and Android fingerprint.
 *
 * Security notes:
 * - NO biometric data is ever sent to or stored on the server
 * - Device-level security only: WebAuthn credentials stay on device
 * - The credential ID is stored in localStorage to identify returning users
 * - Server only receives a signed challenge, never raw biometric data
 *
 * Flow:
 * 1. First time: `register()` — creates a WebAuthn credential, stores credential ID in localStorage
 * 2. Returning: `authenticate()` — presents biometric prompt, returns true on success
 * 3. `isSupported()` — check before rendering biometric UI
 */

import { useState, useCallback } from 'react';

const CREDENTIAL_KEY = 'kairo_biometric_credential_id';

export interface BiometricAuthState {
  isSupported: boolean;
  isRegistered: boolean;
  isAuthenticating: boolean;
  error: string | null;
}

export interface UseBiometricAuthReturn extends BiometricAuthState {
  register: (userEmail: string, userName: string) => Promise<boolean>;
  authenticate: () => Promise<boolean>;
  clear: () => void;
}

function isBiometricSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined' &&
    typeof navigator.credentials.create === 'function'
  );
}

function getStoredCredentialId(): string | null {
  try {
    return localStorage.getItem(CREDENTIAL_KEY);
  } catch {
    return null;
  }
}

function storeCredentialId(id: string): void {
  try {
    localStorage.setItem(CREDENTIAL_KEY, id);
  } catch {
    // localStorage unavailable — silent failure, biometrics just won't persist
  }
}

function clearStoredCredential(): void {
  try {
    localStorage.removeItem(CREDENTIAL_KEY);
  } catch {
    // silent
  }
}

/** Convert ArrayBuffer to base64url string */
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** Generate a random 32-byte challenge */
function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/** Convert string to Uint8Array for WebAuthn user.id */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const supported = isBiometricSupported();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(() => !!getStoredCredentialId());

  /**
   * Register a new biometric credential for the user.
   * Call this after the user successfully completes a registration for the first time.
   * Returns true if successful.
   */
  const register = useCallback(async (userEmail: string, userName: string): Promise<boolean> => {
    if (!supported) {
      setError('Biometric authentication is not supported on this device.');
      return false;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const challenge = generateChallenge();

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Kairo',
            id: window.location.hostname,
          },
          user: {
            id: stringToUint8Array(userEmail),
            name: userEmail,
            displayName: userName,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Use built-in authenticator (Face ID, Touch ID)
            userVerification: 'required',         // Require biometric or PIN
            residentKey: 'preferred',
          },
          timeout: 60000,
          attestation: 'none', // We don't need attestation for this use case
        },
      }) as PublicKeyCredential | null;

      if (!credential) {
        setError('Biometric registration was cancelled.');
        setIsAuthenticating(false);
        return false;
      }

      // Store the credential ID (base64url) locally — this is NOT sensitive data
      const credentialId = bufferToBase64url(credential.rawId);
      storeCredentialId(credentialId);
      setIsRegistered(true);
      setIsAuthenticating(false);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof DOMException
          ? err.name === 'NotAllowedError'
            ? 'Biometric authentication was denied or cancelled.'
            : err.name === 'NotSupportedError'
              ? 'This device does not support biometric authentication.'
              : 'Biometric registration failed. Please try again.'
          : 'Biometric registration failed. Please try again.';

      setError(errorMessage);
      setIsAuthenticating(false);
      return false;
    }
  }, [supported]);

  /**
   * Authenticate with biometrics.
   * Presents Face ID / Touch ID prompt.
   * Returns true if the user successfully authenticates.
   */
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!supported) {
      setError('Biometric authentication is not supported on this device.');
      return false;
    }

    const storedCredentialId = getStoredCredentialId();
    if (!storedCredentialId) {
      setError('No biometric credential registered. Please set up biometrics first.');
      return false;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const challenge = generateChallenge();

      // Decode the stored credential ID back to ArrayBuffer
      const credentialIdBase64 = storedCredentialId
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const credentialIdBytes = Uint8Array.from(atob(credentialIdBase64), (c) => c.charCodeAt(0));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [
            {
              id: credentialIdBytes,
              type: 'public-key',
            },
          ],
          userVerification: 'required',
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!assertion) {
        setError('Biometric authentication was cancelled.');
        setIsAuthenticating(false);
        return false;
      }

      setIsAuthenticating(false);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof DOMException
          ? err.name === 'NotAllowedError'
            ? 'Biometric authentication was denied or cancelled.'
            : err.name === 'InvalidStateError'
              ? 'Biometric credential not found. Please register again.'
              : 'Authentication failed. Please try again.'
          : 'Authentication failed. Please try again.';

      setError(errorMessage);
      setIsAuthenticating(false);

      // If credential not found, clear the stored ID so user can re-register
      if (err instanceof DOMException && err.name === 'InvalidStateError') {
        clearStoredCredential();
        setIsRegistered(false);
      }

      return false;
    }
  }, [supported]);

  /** Remove stored credential (user disables biometrics or logs out) */
  const clear = useCallback(() => {
    clearStoredCredential();
    setIsRegistered(false);
    setError(null);
  }, []);

  return {
    isSupported: supported,
    isRegistered,
    isAuthenticating,
    error,
    register,
    authenticate,
    clear,
  };
}
