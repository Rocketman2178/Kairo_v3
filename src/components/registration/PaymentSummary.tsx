import { Tag, Percent, Gift } from 'lucide-react';
import type { DiscountResult } from '../../utils/discountCalculator';

interface PaymentSummaryProps {
  programName: string;
  originalAmountCents: number;
  discount: DiscountResult | null;
  selectedPlanType: 'full' | 'monthly' | 'biweekly';
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PaymentSummary({
  programName,
  originalAmountCents,
  discount,
  selectedPlanType,
}: PaymentSummaryProps) {
  const hasDiscount = discount && discount.discountPercent > 0;
  const afterDiscount = hasDiscount ? discount.finalPrice : originalAmountCents;
  const payInFullAmount = selectedPlanType === 'full' ? Math.round(afterDiscount * 0.95) : 0;
  const totalSavings =
    (hasDiscount ? discount.savings : 0) +
    (selectedPlanType === 'full' ? afterDiscount - payInFullAmount : 0);
  const finalAmount = selectedPlanType === 'full' ? payInFullAmount : afterDiscount;

  return (
    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-gray-900">Order Summary</h3>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{programName}</span>
          <span className="text-gray-900">{formatPrice(originalAmountCents)}</span>
        </div>

        {hasDiscount && (
          <div className="flex justify-between items-center text-green-600">
            <span className="flex items-center gap-1.5 text-sm">
              <Tag className="h-3.5 w-3.5" />
              {discount.discountReason} ({discount.discountPercent}%)
            </span>
            <span className="text-sm font-medium">-{formatPrice(discount.savings)}</span>
          </div>
        )}

        {selectedPlanType === 'full' && afterDiscount !== payInFullAmount && (
          <div className="flex justify-between items-center text-green-600">
            <span className="flex items-center gap-1.5 text-sm">
              <Percent className="h-3.5 w-3.5" />
              Pay in full discount (5%)
            </span>
            <span className="text-sm font-medium">
              -{formatPrice(afterDiscount - payInFullAmount)}
            </span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total Due</span>
            <span className="text-xl font-bold text-gray-900">{formatPrice(finalAmount)}</span>
          </div>
        </div>

        {totalSavings > 0 && (
          <div className="flex items-center gap-1.5 justify-end">
            <Gift className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              You're saving {formatPrice(totalSavings)}!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
