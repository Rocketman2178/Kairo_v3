import { Tag, Percent, Gift, BookOpen, Info, CalendarClock } from 'lucide-react';
import type { DiscountResult } from '../../utils/discountCalculator';
import type { PlanType, PaymentFeeConfig } from '../../utils/paymentPlans';
import { calculatePaymentPlans } from '../../utils/paymentPlans';

interface PaymentSummaryProps {
  programName: string;
  originalAmountCents: number;
  discount: DiscountResult | null;
  selectedPlanType: PlanType;
  sessionWeeks?: number;
  sessionStartDate?: string;
  feeConfig?: PaymentFeeConfig;
}

/**
 * When a session has already started, compute how many full weeks remain
 * (including the current week) and the prorated price for those weeks.
 */
function computeProration(
  startDateStr: string,
  totalWeeks: number,
  totalPriceCents: number
): { remainingWeeks: number; proratedCents: number } | null {
  const start = new Date(startDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start >= today) return null; // session not yet started

  const msElapsed = today.getTime() - start.getTime();
  const weeksElapsed = Math.floor(msElapsed / (7 * 24 * 60 * 60 * 1000));
  const remainingWeeks = Math.max(0, totalWeeks - weeksElapsed);
  if (remainingWeeks <= 0 || remainingWeeks >= totalWeeks) return null;

  const proratedCents = Math.round(totalPriceCents * (remainingWeeks / totalWeeks));
  return { remainingWeeks, proratedCents };
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatPriceRounded(dollars: number): string {
  return `$${dollars.toFixed(0)}`;
}

export default function PaymentSummary({
  programName,
  originalAmountCents,
  discount,
  selectedPlanType,
  sessionWeeks = 9,
  sessionStartDate,
  feeConfig,
}: PaymentSummaryProps) {
  const hasDiscount = discount && discount.discountPercent > 0;
  const afterDiscount = hasDiscount ? discount.finalPrice : originalAmountCents;

  // Mid-season proration: compute if session already started
  const proration =
    sessionStartDate && sessionWeeks > 0
      ? computeProration(sessionStartDate, sessionWeeks, afterDiscount)
      : null;

  const startDate = sessionStartDate ? new Date(sessionStartDate) : undefined;
  const plans = calculatePaymentPlans(afterDiscount, sessionWeeks, startDate, feeConfig);
  const selectedPlan = plans.find((p) => p.id === selectedPlanType) ?? plans[0];

  // Determine the total due today and overall total
  const dueTodayCents = selectedPlan.billingSchedule?.[0]?.amountCents ?? selectedPlan.finalPrice ?? selectedPlan.total;
  const totalCents = selectedPlan.id === 'full'
    ? (selectedPlan.finalPrice ?? selectedPlan.total)
    : selectedPlan.total;

  const finalDollars = totalCents / 100;
  const perClassDollars = sessionWeeks > 0 ? finalDollars / sessionWeeks : finalDollars;

  // Calculate total savings
  const discountSavings = hasDiscount ? discount.savings : 0;
  const payFullSavings =
    selectedPlan.id === 'full' && selectedPlan.savings ? selectedPlan.savings : 0;
  const totalSavings = discountSavings + payFullSavings;

  // Fee amount for installment plans (processing fee)
  const planFee = selectedPlan.fee && selectedPlan.fee > 0 && feeConfig?.registrationFeeCents !== selectedPlan.fee
    ? selectedPlan.fee - (feeConfig?.registrationFeeCents ?? 0)
    : 0;
  const regFee = feeConfig?.registrationFeeCents ?? 0;

  return (
    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-gray-900">Order Summary</h3>

      <div className="space-y-2">
        {/* Program base price */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{programName}</span>
          <span className={`text-gray-900 ${proration ? 'line-through text-gray-400 text-sm' : ''}`}>
            {formatCents(originalAmountCents)}
          </span>
        </div>

        {/* Mid-season proration line */}
        {proration && (
          <div className="flex justify-between items-center text-indigo-700">
            <span className="flex items-center gap-1.5 text-sm">
              <CalendarClock className="h-3.5 w-3.5 text-indigo-500" />
              Prorated — {proration.remainingWeeks} of {sessionWeeks} weeks remaining
            </span>
            <span className="text-sm font-medium">{formatCents(proration.proratedCents)}</span>
          </div>
        )}

        {/* Discount line */}
        {hasDiscount && (
          <div className="flex justify-between items-center text-green-600">
            <span className="flex items-center gap-1.5 text-sm">
              <Tag className="h-3.5 w-3.5" />
              {discount.discountReason} ({discount.discountPercent}%)
            </span>
            <span className="text-sm font-medium">-{formatCents(discount.savings)}</span>
          </div>
        )}

        {/* Pay-in-full discount */}
        {selectedPlan.id === 'full' && payFullSavings > 0 && (
          <div className="flex justify-between items-center text-green-600">
            <span className="flex items-center gap-1.5 text-sm">
              <Percent className="h-3.5 w-3.5" />
              Pay in full discount (5%)
            </span>
            <span className="text-sm font-medium">-{formatCents(payFullSavings)}</span>
          </div>
        )}

        {/* Registration fee line (if configured) */}
        {regFee > 0 && (
          <div className="flex justify-between items-center text-gray-500">
            <span className="flex items-center gap-1.5 text-sm">
              <Info className="h-3.5 w-3.5" />
              Registration fee
            </span>
            <span className="text-sm">+{formatCents(regFee)}</span>
          </div>
        )}

        {/* Processing fee for installment plans */}
        {planFee > 0 && feeConfig && feeConfig.processingFeePercent > 0 && (
          <div className="flex justify-between items-center text-gray-500">
            <span className="flex items-center gap-1.5 text-sm">
              <Info className="h-3.5 w-3.5" />
              {feeConfig.processingFeePercent}% payment plan fee
            </span>
            <span className="text-sm">+{formatCents(planFee)}</span>
          </div>
        )}

        {/* Total line */}
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">
              {selectedPlan.id !== 'full' ? 'Due Today' : 'Total Due'}
            </span>
            <div className="text-right">
              <span className="text-xl font-bold text-gray-900">
                {formatCents(dueTodayCents)}
              </span>
            </div>
          </div>

          {/* For installment plans, show remaining balance */}
          {selectedPlan.id !== 'full' && selectedPlan.billingSchedule && selectedPlan.billingSchedule.length > 1 && (
            <div className="mt-1.5 space-y-0.5">
              {selectedPlan.billingSchedule.slice(1).map((s, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-400">
                  <span>{s.label}</span>
                  <span>{formatCents(s.amountCents)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Per-class cost */}
          {sessionWeeks > 0 && (
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <BookOpen className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {formatPriceRounded(perClassDollars)}/class for {sessionWeeks} weeks
              </span>
            </div>
          )}
        </div>

        {/* Savings callout */}
        {totalSavings > 0 && (
          <div className="flex items-center gap-1.5 justify-end">
            <Gift className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              You're saving {formatCents(totalSavings)}!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
