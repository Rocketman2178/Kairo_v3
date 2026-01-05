export interface DiscountResult {
  discountPercent: number;
  discountReason: string;
  discountAmount: number;
  originalPrice: number;
  finalPrice: number;
  savings: number;
}

export interface DiscountRules {
  siblingDiscountPercent: number;
  earlyBirdDiscountPercent: number;
  returningFamilyDiscountPercent: number;
  earlyBirdDaysBeforeStart: number;
}

const DEFAULT_DISCOUNT_RULES: DiscountRules = {
  siblingDiscountPercent: 10,
  earlyBirdDiscountPercent: 5,
  returningFamilyDiscountPercent: 5,
  earlyBirdDaysBeforeStart: 30
};

export function calculateDiscount(
  priceCents: number,
  options: {
    hasOtherRegistrations?: boolean;
    isReturningFamily?: boolean;
    sessionStartDate?: Date;
    registrationDate?: Date;
    rules?: Partial<DiscountRules>;
  } = {}
): DiscountResult {
  const {
    hasOtherRegistrations = false,
    isReturningFamily = false,
    sessionStartDate,
    registrationDate = new Date(),
    rules = {}
  } = options;

  const discountRules = { ...DEFAULT_DISCOUNT_RULES, ...rules };

  let finalDiscountPercent = 0;
  let finalDiscountReason = '';

  // Check for sibling discount (highest priority if they have other registrations)
  if (hasOtherRegistrations) {
    finalDiscountPercent = discountRules.siblingDiscountPercent;
    finalDiscountReason = 'Sibling discount';
  }

  // Check for early bird discount (can override sibling if larger)
  if (sessionStartDate) {
    const daysUntilStart = Math.ceil(
      (sessionStartDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilStart >= discountRules.earlyBirdDaysBeforeStart) {
      if (discountRules.earlyBirdDiscountPercent > finalDiscountPercent) {
        finalDiscountPercent = discountRules.earlyBirdDiscountPercent;
        finalDiscountReason = 'Early bird discount';
      } else if (finalDiscountPercent > 0) {
        // Stack discounts up to 15% max
        const combinedDiscount = Math.min(
          finalDiscountPercent + discountRules.earlyBirdDiscountPercent,
          15
        );
        if (combinedDiscount > finalDiscountPercent) {
          finalDiscountPercent = combinedDiscount;
          finalDiscountReason += ' + Early bird';
        }
      }
    }
  }

  // Check for returning family discount (can stack with others up to 15% max)
  if (isReturningFamily && discountRules.returningFamilyDiscountPercent > 0) {
    if (finalDiscountPercent === 0) {
      finalDiscountPercent = discountRules.returningFamilyDiscountPercent;
      finalDiscountReason = 'Returning family discount';
    } else if (finalDiscountPercent < 15) {
      const combinedDiscount = Math.min(
        finalDiscountPercent + discountRules.returningFamilyDiscountPercent,
        15
      );
      if (combinedDiscount > finalDiscountPercent) {
        finalDiscountPercent = combinedDiscount;
        finalDiscountReason += ' + Returning family';
      }
    }
  }

  const discountAmount = Math.round((priceCents * finalDiscountPercent) / 100);
  const finalPrice = priceCents - discountAmount;

  return {
    discountPercent: finalDiscountPercent,
    discountReason: finalDiscountReason || 'No discount',
    discountAmount,
    originalPrice: priceCents,
    finalPrice,
    savings: discountAmount
  };
}

export function formatDiscount(result: DiscountResult): string {
  if (result.discountPercent === 0) {
    return `$${(result.originalPrice / 100).toFixed(0)}`;
  }

  return `$${(result.finalPrice / 100).toFixed(0)} (save $${(result.savings / 100).toFixed(0)})`;
}

export function formatDiscountWithOriginal(result: DiscountResult): {
  original: string;
  final: string;
  savings: string;
} {
  return {
    original: `$${(result.originalPrice / 100).toFixed(0)}`,
    final: `$${(result.finalPrice / 100).toFixed(0)}`,
    savings: `$${(result.savings / 100).toFixed(0)}`
  };
}

export function getSiblingDiscountMessage(
  childCount: number,
  savingsPerChild: number
): string {
  if (childCount <= 1) return '';

  const totalSavings = savingsPerChild * (childCount - 1);

  return `Register ${childCount} children and save $${(totalSavings / 100).toFixed(0)} with our sibling discount!`;
}

export function getEarlyBirdMessage(daysUntilStart: number, discountPercent: number): string {
  if (daysUntilStart < 30) return '';

  return `Register now and save ${discountPercent}% with our early bird discount!`;
}

export function getReturningFamilyMessage(discountPercent: number): string {
  return `Welcome back! Save ${discountPercent}% as a returning family.`;
}