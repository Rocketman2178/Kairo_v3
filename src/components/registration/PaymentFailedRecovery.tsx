/**
 * PaymentFailedRecovery — Full-page recovery UI when a payment fails
 *
 * Shows a friendly error explanation with contextual guidance based on
 * the failure reason, and offers actionable recovery paths.
 *
 * Stage 3.1 — Failed Payment Recovery
 */

import { AlertCircle, RefreshCw, CreditCard, MessageCircle, ChevronRight, PhoneCall } from 'lucide-react';
import type { PaymentFailureReason } from './PaymentForm';

interface PaymentFailedRecoveryProps {
  reason: PaymentFailureReason;
  /** Raw Stripe error message for display when reason is generic */
  stripeMessage?: string;
  programName: string;
  amountCents: number;
  /** Called when user wants to retry with the same card */
  onRetry: () => void;
  /** Called when user wants to try a different card (resets payment intent) */
  onUseDifferentCard: () => void;
  /** Called when user wants to go back to chat */
  onGoBack: () => void;
}

interface FailureConfig {
  headline: string;
  description: string;
  tip: string;
  icon: 'decline' | 'funds' | 'expired' | 'cvc' | 'auth' | 'processing';
}

const FAILURE_CONFIGS: Record<PaymentFailureReason, FailureConfig> = {
  card_declined: {
    headline: 'Card Declined',
    description: 'Your card issuer declined the payment. This can happen for various reasons.',
    tip: 'Try using a different card, or contact your bank to authorize the transaction.',
    icon: 'decline',
  },
  insufficient_funds: {
    headline: 'Insufficient Funds',
    description: 'Your card does not have enough funds to complete this payment.',
    tip: 'Try a different payment method or contact your bank to resolve the balance issue.',
    icon: 'funds',
  },
  expired_card: {
    headline: 'Card Expired',
    description: 'The card you used has expired and can no longer be used for payments.',
    tip: 'Please use a different, non-expired card to complete your registration.',
    icon: 'expired',
  },
  incorrect_cvc: {
    headline: 'Incorrect Card Details',
    description: 'The card number or security code you entered does not match our records.',
    tip: 'Double-check your card number, expiry date, and CVC, then try again.',
    icon: 'cvc',
  },
  authentication_required: {
    headline: 'Verification Required',
    description: 'Your bank requires additional identity verification to approve this payment.',
    tip: 'Please complete the verification step requested by your bank and try again.',
    icon: 'auth',
  },
  processing_error: {
    headline: 'Processing Error',
    description: 'A temporary issue occurred while processing your payment. No charge was made.',
    tip: 'This is usually a temporary problem. Please wait a moment and try again.',
    icon: 'processing',
  },
  generic: {
    headline: 'Payment Unsuccessful',
    description: 'We were unable to process your payment at this time.',
    tip: 'Please check your card details and try again, or use a different payment method.',
    icon: 'decline',
  },
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PaymentFailedRecovery({
  reason,
  stripeMessage,
  programName,
  amountCents,
  onRetry,
  onUseDifferentCard,
  onGoBack,
}: PaymentFailedRecoveryProps) {
  const config = FAILURE_CONFIGS[reason];

  return (
    <div className="space-y-6 py-4">
      {/* Error header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{config.headline}</h2>
        <p className="text-gray-600 text-sm">{config.description}</p>
        {reason === 'generic' && stripeMessage && (
          <p className="text-gray-500 text-xs mt-2 italic">{stripeMessage}</p>
        )}
      </div>

      {/* What was being paid for */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Registration</p>
          <p className="font-semibold text-gray-900 mt-0.5">{programName}</p>
        </div>
        <p className="font-bold text-gray-900">{formatPrice(amountCents)}</p>
      </div>

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Tip: </span>
          {config.tip}
        </p>
      </div>

      {/* Recovery actions */}
      <div className="space-y-3">
        {/* Retry with same payment details */}
        {reason !== 'expired_card' && reason !== 'insufficient_funds' && (
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm min-h-[52px]"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">Try Again</p>
                <p className="text-blue-100 text-xs">Use the same payment details</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </button>
        )}

        {/* Use a different card */}
        <button
          onClick={onUseDifferentCard}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-gray-200 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors min-h-[52px]"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 flex-shrink-0 text-gray-600" />
            <div className="text-left">
              <p className="font-semibold text-sm">Use a Different Card</p>
              <p className="text-gray-500 text-xs">Enter new payment details</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        {/* Contact support */}
        <button
          onClick={() => {
            window.open('mailto:support@kairo.app?subject=Payment%20Issue&body=I%20had%20trouble%20completing%20my%20registration%20payment.', '_blank');
          }}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-gray-200 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors min-h-[52px]"
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 flex-shrink-0 text-gray-600" />
            <div className="text-left">
              <p className="font-semibold text-sm">Contact Support</p>
              <p className="text-gray-500 text-xs">We&apos;ll help you complete registration</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        {/* Go back to start */}
        <button
          onClick={onGoBack}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Start a New Registration</span>
        </button>
      </div>

      {/* Reassurance */}
      <p className="text-xs text-gray-400 text-center">
        Your spot is still reserved. No charge was made to your card.
      </p>
    </div>
  );
}
