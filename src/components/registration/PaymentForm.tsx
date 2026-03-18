import { useState, useEffect } from 'react';
import {
  PaymentElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { PaymentRequest } from '@stripe/stripe-js';
import { Loader2, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import PaymentPlanSelector from './PaymentPlanSelector';
import PaymentSummary from './PaymentSummary';
import BiometricAuthPrompt, { BiometricSuccess } from './BiometricAuthPrompt';
import { calculateDiscount } from '../../utils/discountCalculator';
import type { PlanType, PaymentFeeConfig } from '../../utils/paymentPlans';

interface PaymentFormProps {
  amountCents: number;
  programName: string;
  sessionStartDate?: string;
  sessionWeeks?: number;
  hasOtherRegistrations: boolean;
  isReturningFamily: boolean;
  clientSecret: string | null;
  isDemo: boolean;
  onPaymentPlanChange: (plan: PlanType) => void;
  onDemoSubmit: () => void;
  registrationToken: string;
  feeConfig?: PaymentFeeConfig;
  /** Parent email — passed to biometric prompt for personalization */
  parentEmail?: string;
}

export default function PaymentForm({
  amountCents,
  programName,
  parentEmail,
  sessionStartDate,
  sessionWeeks = 9,
  hasOtherRegistrations,
  isReturningFamily,
  clientSecret,
  isDemo,
  onPaymentPlanChange,
  onDemoSubmit,
  registrationToken,
  feeConfig,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('full');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  const discount = calculateDiscount(amountCents, {
    hasOtherRegistrations,
    isReturningFamily,
    sessionStartDate: sessionStartDate ? new Date(sessionStartDate) : undefined,
  });

  // ── Apple Pay / Google Pay via Payment Request API ────────────────────────
  useEffect(() => {
    if (!stripe || isDemo || !clientSecret) return;

    const finalAmountCents = discount.finalPrice;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: programName,
        amount: finalAmountCents,
      },
      requestPayerName: false,
      requestPayerEmail: false,
    });

    // Only show the button if Apple Pay / Google Pay is available
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      // Confirm the payment without redirecting — we handle the UX ourselves
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: ev.paymentMethod.id },
        { handleActions: false },
      );

      if (confirmError) {
        ev.complete('fail');
        setError(confirmError.message ?? 'Express payment failed. Please try again.');
      } else if (paymentIntent?.status === 'requires_action') {
        // 3D Secure required — fall back to the standard card flow
        ev.complete('success');
        const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
        if (actionError) {
          setError(actionError.message ?? 'Payment authentication failed.');
        } else {
          window.location.href = `${window.location.origin}/register?token=${registrationToken}&payment_status=success`;
        }
      } else {
        ev.complete('success');
        window.location.href = `${window.location.origin}/register?token=${registrationToken}&payment_status=success`;
      }
    });

    return () => {
      // Clean up listener on re-render (e.g. plan or discount changes)
      pr.off('paymentmethod');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe, isDemo, clientSecret, discount.finalPrice, programName, registrationToken]);
  // ──────────────────────────────────────────────────────────────────────────

  function handlePlanChange(plan: PlanType) {
    setSelectedPlan(plan);
    onPaymentPlanChange(plan);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isDemo) {
      onDemoSubmit();
      return;
    }

    if (!stripe || !elements) {
      setError('Payment system is loading. Please wait a moment.');
      return;
    }

    setProcessing(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Please check your payment details.');
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/register?token=${registrationToken}&payment_status=success`,
      },
    });

    if (confirmError) {
      if (confirmError.type === 'card_error' || confirmError.type === 'validation_error') {
        setError(confirmError.message || 'Payment failed. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Biometric quick-auth for returning families */}
      {isReturningFamily && !isDemo && !biometricVerified && showBiometricPrompt && (
        <BiometricAuthPrompt
          userEmail={parentEmail}
          onAuthSuccess={() => setBiometricVerified(true)}
          onDismiss={() => setShowBiometricPrompt(false)}
        />
      )}

      {biometricVerified && (
        <BiometricSuccess />
      )}

      <PaymentPlanSelector
        amountCents={amountCents}
        sessionWeeks={sessionWeeks}
        sessionStartDate={sessionStartDate}
        selectedPlan={selectedPlan}
        onSelectPlan={handlePlanChange}
        feeConfig={feeConfig}
      />

      <PaymentSummary
        programName={programName}
        originalAmountCents={amountCents}
        discount={discount.discountPercent > 0 ? discount : null}
        selectedPlanType={selectedPlan}
        sessionWeeks={sessionWeeks}
        sessionStartDate={sessionStartDate}
        feeConfig={feeConfig}
      />

      {!isDemo && clientSecret && (
        <div className="space-y-3">
          {/* Express checkout — Apple Pay / Google Pay */}
          {paymentRequest && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Express Checkout</h3>
              <PaymentRequestButtonElement
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      theme: 'dark',
                      height: '48px',
                      type: 'buy',
                    },
                  },
                }}
              />
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or pay with card</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
            </div>
          )}

          <h3 className="font-semibold text-gray-900">Payment Details</h3>
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <PaymentElement
              options={{
                layout: 'tabs',
                defaultValues: {
                  billingDetails: {
                    address: { country: 'US' },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {isDemo && (
        <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 bg-blue-50">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900">Demo Mode</p>
              <p className="text-sm text-blue-700 mt-0.5">
                Stripe is not configured yet. Click below to complete a demo registration.
                Payment processing will be enabled once Stripe keys are added.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={processing || (!isDemo && !stripe)}
        className="w-full py-3.5 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md min-h-[44px]"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            {isDemo ? 'Complete Demo Registration' : 'Pay Securely'}
          </>
        )}
      </button>

      {!isDemo && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock className="h-3 w-3" />
          <span>Secured by Stripe. Your payment info is encrypted.</span>
        </div>
      )}
    </form>
  );
}
