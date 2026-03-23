import { useState } from 'react';
import { CreditCard, Zap, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import type { SavedCard } from '../../hooks/useSavedPaymentMethods';

const BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  diners: 'Diners Club',
};

const BRAND_COLORS: Record<string, string> = {
  visa: 'text-blue-600',
  mastercard: 'text-red-600',
  amex: 'text-blue-500',
  discover: 'text-orange-500',
};

interface SavedPaymentMethodsProps {
  methods: SavedCard[];
  loading: boolean;
  error: string | null;
  /** Called when user clicks "Quick Pay" with a saved card */
  onQuickPay: (card: SavedCard) => void;
  /** Whether a quick checkout is currently processing */
  processingQuickPay: boolean;
  /** The methodId of the card currently being processed */
  processingMethodId: string | null;
}

export default function SavedPaymentMethods({
  methods,
  loading,
  error,
  onQuickPay,
  processingQuickPay,
  processingMethodId,
}: SavedPaymentMethodsProps) {
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(
    methods.find((m) => m.isDefault)?.methodId ?? methods[0]?.methodId ?? null
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking for saved cards…
      </div>
    );
  }

  if (error || methods.length === 0) return null;

  const selectedCard = methods.find((m) => m.methodId === selectedMethodId) ?? methods[0];

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
          <Zap className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">Saved cards</p>
          <p className="text-xs text-indigo-600">Quick checkout — no need to re-enter details</p>
        </div>
      </div>

      {/* Card list */}
      <div className="space-y-2">
        {methods.map((card) => {
          const brandLabel = BRAND_LABELS[card.brand] ?? card.brand;
          const brandColor = BRAND_COLORS[card.brand] ?? 'text-slate-600';
          const isSelected = card.methodId === selectedMethodId;

          return (
            <button
              key={card.methodId}
              type="button"
              onClick={() => setSelectedMethodId(card.methodId)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all text-left ${
                isSelected
                  ? 'border-indigo-400 bg-white shadow-sm'
                  : 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-300'
              }`}
            >
              <CreditCard className={`w-5 h-5 flex-shrink-0 ${brandColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  {brandLabel} ••••{card.last4}
                  {card.isDefault && (
                    <span className="ml-2 text-xs text-indigo-600 font-normal">(default)</span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  Expires {card.expMonth.toString().padStart(2, '0')}/{card.expYear}
                </p>
              </div>
              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-indigo-600 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Pay button */}
      <button
        type="button"
        onClick={() => selectedCard && onQuickPay(selectedCard)}
        disabled={processingQuickPay || !selectedCard}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 text-white font-semibold text-base py-3.5 transition-colors min-h-[44px]"
      >
        {processingQuickPay && processingMethodId === selectedCard?.methodId ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            Quick Pay with saved card
            <ChevronRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1 h-px bg-indigo-200" />
        <span className="text-xs text-indigo-400 font-medium">or pay with a new card</span>
        <div className="flex-1 h-px bg-indigo-200" />
      </div>

      {processingQuickPay && processingMethodId !== selectedCard?.methodId && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Payment processing — please don't close this page.
        </div>
      )}
    </div>
  );
}
