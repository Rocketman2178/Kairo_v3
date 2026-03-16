// Payment plan types matching the build plan specification (Stage 3.2)
// Plan Type 1: Divided Payments (season total split into N installments)
// Plan Type 2: Subscription Model (monthly recurring)
// Plan Type 3: Two-Payment Split (50% now, 50% at season midpoint)

export type PlanType = 'full' | 'divided' | 'subscription' | 'two_payment';

export interface PaymentPlan {
  id: PlanType;
  name: string;
  installments?: number;
  perPayment?: number;
  total: number;
  savings?: number;
  finalPrice?: number;
  description: string;
  billingSchedule?: PaymentInstallment[];
  fee?: number;          // Additional fee in cents for this plan
  feeLabel?: string;     // Human-readable fee description
}

export interface PaymentInstallment {
  dueDate: string;       // ISO date string or human-readable label
  amountCents: number;
  label: string;
}

export interface PaymentFeeConfig {
  registrationFeeCents: number;      // Flat registration fee (e.g., $15)
  processingFeePercent: number;      // Percentage fee for payment plans (e.g., 3%)
  payInFullFeeWaived: boolean;       // Whether to waive processing fee for pay-in-full
}

export interface SeasonalPricing {
  multiplier: number;
  note: string;
}

export const seasonalPricing: Record<string, SeasonalPricing> = {
  'winter': { multiplier: 1.0, note: 'Standard pricing' },
  'spring': { multiplier: 1.0, note: 'Standard pricing' },
  'summer': { multiplier: 0.97, note: 'Summer savings!' },
  'fall': { multiplier: 1.0, note: 'Standard pricing' }
};

const DEFAULT_FEE_CONFIG: PaymentFeeConfig = {
  registrationFeeCents: 0,
  processingFeePercent: 0,
  payInFullFeeWaived: true,
};

/**
 * Calculate billing schedule for Divided Payments plan.
 * Payments are spread evenly across the season. The final payment is always
 * due on or before the first class date.
 *
 * Example: 9-week season, 3 payments → Day 0, Week 4, Week 8
 */
function buildDividedSchedule(
  totalCents: number,
  installments: number,
  sessionStartDate?: Date
): PaymentInstallment[] {
  const perInstallment = Math.round(totalCents / installments);
  // Adjust last installment to account for rounding
  const lastInstallment = totalCents - perInstallment * (installments - 1);

  const schedule: PaymentInstallment[] = [];

  for (let i = 0; i < installments; i++) {
    const amount = i === installments - 1 ? lastInstallment : perInstallment;

    let label: string;
    let dueDate: string;

    if (i === 0) {
      label = 'Due today';
      dueDate = sessionStartDate ? sessionStartDate.toISOString() : new Date().toISOString();
    } else if (sessionStartDate) {
      // Spread remaining payments evenly before the start date
      // We want the last payment a week before class starts
      const intervalDays = Math.floor((14 * i)); // roughly 2-week intervals
      const due = new Date(new Date().getTime() + intervalDays * 24 * 60 * 60 * 1000);
      dueDate = due.toISOString();
      label = `Payment ${i + 1} — ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      label = `Payment ${i + 1}`;
      dueDate = '';
    }

    schedule.push({ dueDate, amountCents: amount, label });
  }

  return schedule;
}

/**
 * Calculate all available payment plan options for a given amount and session.
 *
 * Returns plans in display order:
 *  1. Pay in Full (best value — 5% discount)
 *  2. Two-Payment Split (most popular alternative)
 *  3. Divided Payments / Subscription (monthly)
 */
export function calculatePaymentPlans(
  totalPriceCents: number,
  sessionWeeks: number = 9,
  sessionStartDate?: Date,
  feeConfig: PaymentFeeConfig = DEFAULT_FEE_CONFIG,
  dividedInstallmentCount: number = 3
): PaymentPlan[] {
  const totalPrice = totalPriceCents;

  // ── Plan 1: Pay in Full ─────────────────────────────────────────────────────
  const payInFullDiscount = 0.05;
  const payInFullCents = Math.round(totalPrice * (1 - payInFullDiscount));
  const payInFullSavings = totalPrice - payInFullCents;

  // Registration fee is added to ALL plans (if configured)
  const regFee = feeConfig.registrationFeeCents;

  // Processing fee applies to installment plans only
  const processingFeeMultiplier = 1 + feeConfig.processingFeePercent / 100;

  // ── Plan 2: Divided Payments ─────────────────────────────────────────────────
  const dividedTotalCents = Math.round(totalPrice * processingFeeMultiplier);
  const dividedPerInstallmentCents = Math.round(dividedTotalCents / dividedInstallmentCount);
  const dividedSchedule = buildDividedSchedule(dividedTotalCents, dividedInstallmentCount, sessionStartDate);

  // ── Plan 3: Subscription Model (Monthly) ─────────────────────────────────────
  const monthlyInstallments = Math.max(2, Math.ceil(sessionWeeks / 4));
  const subscriptionTotalCents = Math.round(totalPrice * processingFeeMultiplier);
  const subscriptionPerMonthCents = Math.round(subscriptionTotalCents / monthlyInstallments);

  // ── Plan 4: Two-Payment Split ─────────────────────────────────────────────────
  const twoPayTotalCents = Math.round(totalPrice * processingFeeMultiplier);
  const twoPayFirstCents = Math.round(twoPayTotalCents / 2);
  const twoPaySecondCents = twoPayTotalCents - twoPayFirstCents;

  let midpointLabel = 'At season midpoint';
  if (sessionStartDate && sessionWeeks > 0) {
    const midpoint = new Date(
      sessionStartDate.getTime() + (sessionWeeks / 2) * 7 * 24 * 60 * 60 * 1000
    );
    midpointLabel = midpoint.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const processingFeeLabel =
    feeConfig.processingFeePercent > 0
      ? `${feeConfig.processingFeePercent}% processing fee included`
      : undefined;

  const plans: PaymentPlan[] = [
    // ── Pay in Full ────────────────────────────────────────────────────────────
    {
      id: 'full',
      name: 'Pay in Full',
      total: totalPrice,
      savings: payInFullSavings,
      finalPrice: payInFullCents + regFee,
      fee: regFee,
      feeLabel: regFee > 0 ? `Includes $${(regFee / 100).toFixed(0)} registration fee` : undefined,
      description: `Save $${(payInFullSavings / 100).toFixed(0)} when you pay upfront`,
      billingSchedule: [
        {
          dueDate: new Date().toISOString(),
          amountCents: payInFullCents + regFee,
          label: 'Due today',
        },
      ],
    },

    // ── Two-Payment Split ──────────────────────────────────────────────────────
    {
      id: 'two_payment',
      name: 'Two Payments',
      installments: 2,
      perPayment: twoPayFirstCents + regFee,
      total: twoPayTotalCents + regFee,
      fee: regFee + (twoPayTotalCents - totalPrice),
      feeLabel: processingFeeLabel,
      description: `50% today, 50% at midpoint`,
      billingSchedule: [
        {
          dueDate: new Date().toISOString(),
          amountCents: twoPayFirstCents + regFee,
          label: `Due today — $${((twoPayFirstCents + regFee) / 100).toFixed(0)}`,
        },
        {
          dueDate: sessionStartDate
            ? new Date(
                sessionStartDate.getTime() +
                  (sessionWeeks / 2) * 7 * 24 * 60 * 60 * 1000
              ).toISOString()
            : '',
          amountCents: twoPaySecondCents,
          label: `${midpointLabel} — $${(twoPaySecondCents / 100).toFixed(0)}`,
        },
      ],
    },

    // ── Divided Payments ───────────────────────────────────────────────────────
    {
      id: 'divided',
      name: `${dividedInstallmentCount} Payments`,
      installments: dividedInstallmentCount,
      // perPayment shows the first installment amount (includes reg fee)
      perPayment: dividedPerInstallmentCents + regFee,
      total: dividedTotalCents + regFee,
      fee: regFee + (dividedTotalCents - totalPrice),
      feeLabel: processingFeeLabel,
      description: `${dividedInstallmentCount} equal payments every 2 weeks`,
      billingSchedule: dividedSchedule.map((s, i) => ({
        ...s,
        amountCents: s.amountCents + (i === 0 ? regFee : 0),
        label: i === 0 && regFee > 0 ? `${s.label} (incl. reg. fee)` : s.label,
      })),
    },

    // ── Monthly Subscription ────────────────────────────────────────────────────
    {
      id: 'subscription',
      name: 'Monthly',
      installments: monthlyInstallments,
      // perPayment shows the first month amount (includes reg fee)
      perPayment: subscriptionPerMonthCents + regFee,
      total: subscriptionTotalCents + regFee,
      fee: regFee + (subscriptionTotalCents - totalPrice),
      feeLabel: processingFeeLabel,
      description: `${monthlyInstallments} monthly payments — cancel with 30 days notice`,
      billingSchedule: Array.from({ length: monthlyInstallments }, (_, i) => {
        // Last installment absorbs any rounding remainder
        const isLast = i === monthlyInstallments - 1;
        const baseAmount = isLast
          ? subscriptionTotalCents - subscriptionPerMonthCents * (monthlyInstallments - 1)
          : subscriptionPerMonthCents;
        return {
          dueDate: '',
          amountCents: i === 0 ? baseAmount + regFee : baseAmount,
          label: i === 0 ? 'Month 1 — due today' : `Month ${i + 1}`,
        };
      }),
    },
  ];

  return plans;
}

// ── Legacy helper kept for backward compatibility ──────────────────────────────

export function formatPaymentOption(plan: PaymentPlan): string {
  if (plan.id === 'full' && plan.finalPrice) {
    return `$${(plan.finalPrice / 100).toFixed(0)} (save $${(plan.savings ?? 0 / 100).toFixed(0)})`;
  }

  if (plan.installments && plan.perPayment) {
    return `${plan.installments}x $${(plan.perPayment / 100).toFixed(0)}`;
  }

  return `$${(plan.total / 100).toFixed(0)}`;
}

export function getRecommendedPaymentPlan(totalPriceCents: number): PaymentPlan {
  const plans = calculatePaymentPlans(totalPriceCents);
  // For amounts under $150 always recommend pay-in-full
  if (totalPriceCents < 15000) {
    return plans[0];
  }
  return plans[0]; // Pay-in-full is always recommended per NBC data (86% pay in full)
}

export function applySeasonalPricing(basePriceCents: number, season: string): number {
  const pricing = seasonalPricing[season.toLowerCase()];
  if (!pricing) return basePriceCents;
  return Math.round(basePriceCents * pricing.multiplier);
}

export function getSeasonalNote(season: string): string {
  const pricing = seasonalPricing[season.toLowerCase()];
  return pricing?.note || '';
}

export function calculateMonthlyPayment(
  totalPriceCents: number,
  sessionWeeks: number = 9
): number {
  const plans = calculatePaymentPlans(totalPriceCents, sessionWeeks);
  const monthlyPlan = plans.find((p) => p.id === 'subscription');
  return monthlyPlan?.perPayment ?? totalPriceCents / 100;
}

export function formatPriceWithPaymentOption(
  totalPriceCents: number,
  sessionWeeks: number = 9
): string {
  const totalPrice = totalPriceCents / 100;
  const monthlyPayment = calculateMonthlyPayment(totalPriceCents, sessionWeeks);
  return `$${totalPrice.toFixed(0)} or $${(monthlyPayment / 100).toFixed(0)}/month`;
}
