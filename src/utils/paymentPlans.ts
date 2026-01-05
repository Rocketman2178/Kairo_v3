export interface PaymentPlan {
  name: string;
  installments?: number;
  perPayment?: number;
  total: number;
  savings?: number;
  finalPrice?: number;
  description: string;
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

export function calculatePaymentPlans(
  totalPriceCents: number,
  sessionWeeks: number = 9
): PaymentPlan[] {
  const totalPrice = totalPriceCents / 100;

  const payInFullDiscount = 0.05;
  const payInFullPrice = totalPrice * (1 - payInFullDiscount);
  const savings = totalPrice * payInFullDiscount;

  const monthlyInstallments = Math.ceil(sessionWeeks / 4);
  const monthlyPayment = totalPrice / monthlyInstallments;

  const biWeeklyInstallments = Math.ceil(sessionWeeks / 2);
  const biWeeklyPayment = totalPrice / biWeeklyInstallments;

  const plans: PaymentPlan[] = [
    {
      name: 'Pay in Full',
      total: totalPrice,
      savings: savings,
      finalPrice: payInFullPrice,
      description: `Save $${savings.toFixed(0)} when you pay upfront`
    },
    {
      name: 'Monthly Payments',
      installments: monthlyInstallments,
      perPayment: monthlyPayment,
      total: totalPrice,
      description: `${monthlyInstallments} monthly payments of $${monthlyPayment.toFixed(0)}`
    },
    {
      name: 'Bi-Weekly Payments',
      installments: biWeeklyInstallments,
      perPayment: biWeeklyPayment,
      total: totalPrice,
      description: `${biWeeklyInstallments} bi-weekly payments of $${biWeeklyPayment.toFixed(0)}`
    }
  ];

  return plans;
}

export function formatPaymentOption(plan: PaymentPlan): string {
  if (plan.name === 'Pay in Full' && plan.finalPrice) {
    return `$${plan.finalPrice.toFixed(0)} (save $${plan.savings?.toFixed(0)})`;
  }

  if (plan.installments && plan.perPayment) {
    return `${plan.installments}x $${plan.perPayment.toFixed(0)}`;
  }

  return `$${plan.total.toFixed(0)}`;
}

export function getRecommendedPaymentPlan(totalPriceCents: number): PaymentPlan {
  const plans = calculatePaymentPlans(totalPriceCents);

  if (totalPriceCents < 15000) {
    return plans[0];
  }

  return plans[1];
}

export function applySeasonalPricing(
  basePriceCents: number,
  season: string
): number {
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
  const monthlyPlan = plans.find(p => p.name === 'Monthly Payments');
  return monthlyPlan?.perPayment || totalPriceCents / 100;
}

export function formatPriceWithPaymentOption(
  totalPriceCents: number,
  sessionWeeks: number = 9
): string {
  const totalPrice = totalPriceCents / 100;
  const monthlyPayment = calculateMonthlyPayment(totalPriceCents, sessionWeeks);

  return `$${totalPrice.toFixed(0)} or $${monthlyPayment.toFixed(0)}/month`;
}