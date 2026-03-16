/**
 * CartRecoveryBanner — Stage 3.4
 *
 * Displayed when the user has an abandoned in-progress registration.
 * Shows the program and child name, and provides a deep link back to
 * the registration form pre-loaded with their data.
 *
 * Mobile-first: bottom-anchored on mobile, top banner on desktop.
 */

import { ArrowRight, X, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CartRecoveryData } from '../../hooks/useCartRecovery';

interface CartRecoveryBannerProps {
  cart: CartRecoveryData;
  recoveryUrl: string;
  onDismiss: () => void;
}

function formatAmount(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function stepLabel(step: string | undefined): string {
  switch (step) {
    case 'session_review': return 'reviewing your session';
    case 'info_entry': return 'entering your details';
    case 'payment': return 'on the payment step';
    default: return 'mid-registration';
  }
}

export default function CartRecoveryBanner({
  cart,
  recoveryUrl,
  onDismiss,
}: CartRecoveryBannerProps) {
  const navigate = useNavigate();

  function handleContinue() {
    navigate(recoveryUrl);
  }

  return (
    <>
      {/* Desktop: top notification bar */}
      <div className="hidden sm:block w-full bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <ShoppingCart className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900 truncate">
                You left off {stepLabel(cart.stepAbandoned)}
                {cart.childName ? ` for ${cart.childName}` : ''}
              </p>
              {cart.programName && (
                <p className="text-xs text-amber-700 truncate">
                  {cart.programName}
                  {cart.amountCents ? ` · ${formatAmount(cart.amountCents)}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleContinue}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors min-h-[44px]"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onDismiss}
              aria-label="Dismiss cart recovery"
              className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: sticky bottom sheet */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-amber-200 shadow-2xl px-4 py-4 safe-area-inset-bottom">
        <div className="flex items-start gap-3">
          <ShoppingCart className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              Continue your registration
              {cart.childName ? ` for ${cart.childName}` : ''}
            </p>
            {cart.programName && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {cart.programName}
                {cart.amountCents ? ` · ${formatAmount(cart.amountCents)}` : ''}
              </p>
            )}

            <button
              onClick={handleContinue}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors min-h-[44px]"
            >
              Pick up where you left off
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={onDismiss}
            aria-label="Dismiss cart recovery"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
