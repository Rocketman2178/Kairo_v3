import { Check, Star, CalendarDays, SplitSquareHorizontal, Repeat, Info } from 'lucide-react';
import { calculatePaymentPlans, type PaymentPlan, type PlanType, type PaymentFeeConfig, type InstallmentStartMode } from '../../utils/paymentPlans';

interface PaymentPlanSelectorProps {
  amountCents: number;
  sessionWeeks?: number;
  sessionStartDate?: string;
  selectedPlan: PlanType;
  onSelectPlan: (plan: PlanType) => void;
  feeConfig?: PaymentFeeConfig;
  /** Controls when installment billing begins. 'registration' = today, 'class_start' = first class date */
  installmentStartMode?: InstallmentStartMode;
}

const PLAN_ICONS: Record<PlanType, typeof Star> = {
  full: Star,
  two_payment: SplitSquareHorizontal,
  divided: CalendarDays,
  subscription: Repeat,
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function PaymentPlanSelector({
  amountCents,
  sessionWeeks = 9,
  sessionStartDate,
  selectedPlan,
  onSelectPlan,
  feeConfig,
  installmentStartMode = 'registration',
}: PaymentPlanSelectorProps) {
  const startDate = sessionStartDate ? new Date(sessionStartDate) : undefined;
  const plans = calculatePaymentPlans(amountCents, sessionWeeks, startDate, feeConfig, 3, installmentStartMode);

  // Show billing-start notice for installment plans when class_start mode is active and session is in the future
  const showClassStartNotice =
    installmentStartMode === 'class_start' &&
    startDate !== undefined &&
    startDate > new Date();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Payment Plan</h3>
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          Most families pay in full
        </span>
      </div>

      {showClassStartNotice && (
        <div className="flex items-start gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />
          <span>
            Installment billing begins on{' '}
            <span className="font-semibold">
              {startDate!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>{' '}
            (class start date). Pay in full to charge today.
          </span>
        </div>
      )}

      <div className="grid gap-3">
        {plans.map((plan: PaymentPlan) => {
          const isSelected = selectedPlan === plan.id;
          const Icon = PLAN_ICONS[plan.id] || Star;
          const isPayFull = plan.id === 'full';

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelectPlan(plan.id)}
              className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200 min-h-[44px] ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {isPayFull && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
                  Best Value
                </span>
              )}

              <div className="flex items-start gap-3">
                {/* Radio indicator */}
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Plan name + icon */}
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}
                    />
                    <span
                      className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}
                    >
                      {plan.name}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>

                  {/* Pay in Full: strike-through + final price */}
                  {isPayFull && plan.finalPrice !== undefined && (
                    <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                      <span className="text-lg font-bold text-gray-900">
                        {formatCents(plan.finalPrice)}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        {formatCents(plan.total)}
                      </span>
                      {plan.savings && plan.savings > 0 && (
                        <span className="text-sm font-medium text-green-600">
                          Save {formatCents(plan.savings)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Installment plans: per-payment amount + schedule preview */}
                  {!isPayFull && plan.perPayment !== undefined && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          {formatCents(plan.perPayment)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {plan.id === 'subscription' ? '/ month' : '/ payment'}
                        </span>
                        <span className="text-sm text-gray-400">
                          ({plan.installments}x)
                        </span>
                      </div>

                      {/* Billing schedule preview — only when selected */}
                      {isSelected && plan.billingSchedule && plan.billingSchedule.length > 0 && (
                        <div className="mt-2 space-y-1 border-t border-blue-200 pt-2">
                          {plan.billingSchedule.map((s, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center text-xs text-blue-800"
                            >
                              <span>{s.label}</span>
                              <span className="font-medium">{formatCents(s.amountCents)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Fee label */}
                      {plan.feeLabel && (
                        <p className="text-xs text-amber-600 mt-1">{plan.feeLabel}</p>
                      )}
                    </div>
                  )}

                  {/* Pay in Full fee label */}
                  {isPayFull && plan.feeLabel && (
                    <p className="text-xs text-gray-400 mt-1">{plan.feeLabel}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
