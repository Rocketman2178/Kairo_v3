import { Check, Star, Clock, CalendarDays } from 'lucide-react';
import { calculatePaymentPlans, type PaymentPlan } from '../../utils/paymentPlans';

interface PaymentPlanSelectorProps {
  amountCents: number;
  sessionWeeks?: number;
  selectedPlan: 'full' | 'monthly' | 'biweekly';
  onSelectPlan: (plan: 'full' | 'monthly' | 'biweekly') => void;
}

const PLAN_KEYS: Record<string, 'full' | 'monthly' | 'biweekly'> = {
  'Pay in Full': 'full',
  'Monthly Payments': 'monthly',
  'Bi-Weekly Payments': 'biweekly',
};

const PLAN_ICONS: Record<string, typeof Star> = {
  'Pay in Full': Star,
  'Monthly Payments': CalendarDays,
  'Bi-Weekly Payments': Clock,
};

export default function PaymentPlanSelector({
  amountCents,
  sessionWeeks = 9,
  selectedPlan,
  onSelectPlan,
}: PaymentPlanSelectorProps) {
  const plans = calculatePaymentPlans(amountCents, sessionWeeks);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Payment Plan</h3>
        <span className="text-xs text-gray-500 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Most families pay in full</span>
      </div>

      <div className="grid gap-3">
        {plans.map((plan: PaymentPlan) => {
          const key = PLAN_KEYS[plan.name];
          const isSelected = selectedPlan === key;
          const Icon = PLAN_ICONS[plan.name] || Star;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectPlan(key)}
              className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {key === 'full' && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
                  Best Value
                </span>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {plan.name}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>

                  {key === 'full' && plan.finalPrice && (
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        ${plan.finalPrice.toFixed(0)}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        ${plan.total.toFixed(0)}
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        Save ${plan.savings?.toFixed(0)}
                      </span>
                    </div>
                  )}

                  {key !== 'full' && plan.perPayment && (
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        ${plan.perPayment.toFixed(0)}
                      </span>
                      <span className="text-sm text-gray-500">
                        / {key === 'monthly' ? 'month' : '2 weeks'}
                      </span>
                      <span className="text-sm text-gray-400">
                        ({plan.installments}x)
                      </span>
                    </div>
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
