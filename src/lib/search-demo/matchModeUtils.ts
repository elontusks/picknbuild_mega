import { CreditTier, AffordabilityState, UserProfile } from './types';

export function getCreditTier(creditScore: number): CreditTier {
  if (creditScore >= 700) return 'green';
  if (creditScore >= 620) return 'yellow';
  return 'red';
}

export function getCreditColor(tier: CreditTier): string {
  switch (tier) {
    case 'green': return '#10b981';
    case 'yellow': return '#f59e0b';
    case 'red': return '#ef4444';
  }
}

export function getCreditLabel(tier: CreditTier): string {
  switch (tier) {
    case 'green': return 'Good Credit';
    case 'yellow': return 'Fair Credit';
    case 'red': return 'Limited Credit';
  }
}

export function getApprovalStatus(tier: CreditTier): string {
  switch (tier) {
    case 'green': return 'Likely Approved';
    case 'yellow': return 'Possible / High Interest';
    case 'red': return 'Unlikely / Very High Interest';
  }
}

export function calculateDealerAffordability(
  user: UserProfile,
  marketPrice: number
): AffordabilityState {
  const dealerPrice = marketPrice * 1.25;
  const downPayment = dealerPrice * 0.15; // Typical 15% down

  if (user.availableCash >= downPayment) {
    return {
      canAfford: true,
      requiredCash: downPayment,
      reason: 'You can likely pursue this dealer option right now',
    };
  }

  return {
    canAfford: false,
    requiredCash: downPayment,
    shortBy: downPayment - user.availableCash,
    reason: 'You do not currently have enough cash for this dealer option',
  };
}

export function calculateAuctionAffordability(
  user: UserProfile,
  bidAmount: number,
  estimatedRepairs: number
): AffordabilityState {
  const totalNeeded = bidAmount + estimatedRepairs + 500; // +500 for fees/shipping

  if (user.availableCash >= totalNeeded) {
    return {
      canAfford: true,
      requiredCash: totalNeeded,
      reason: 'You can likely pursue this auction option right now',
    };
  }

  return {
    canAfford: false,
    requiredCash: totalNeeded,
    shortBy: totalNeeded - user.availableCash,
    reason: 'You do not currently have enough cash to safely pursue this auction option',
  };
}

export function calculatePicknBuildPrice(acv: number, creditTier: CreditTier): number {
  const markups: { [key in CreditTier]: number } = {
    'green': 0.12,
    'yellow': 0.20,
    'red': 0.30,
  };
  return acv * (1 + markups[creditTier]);
}

export function calculatePicknBuildAffordability(
  user: UserProfile,
  acv: number
): AffordabilityState {
  const creditTier = getCreditTier(user.creditScore);
  const finalPrice = calculatePicknBuildPrice(acv, creditTier);
  const requiredDown = finalPrice * 0.35;

  if (user.availableCash >= requiredDown) {
    return {
      canAfford: true,
      requiredCash: requiredDown,
      reason: 'You can afford this PicknBuild option right now',
    };
  }

  return {
    canAfford: false,
    requiredCash: requiredDown,
    shortBy: requiredDown - user.availableCash,
    reason: 'You do not currently have enough cash for the required 35% down payment',
  };
}

export function calculateIndividualAffordability(
  user: UserProfile,
  sellerPrice: number
): AffordabilityState {
  if (user.availableCash >= sellerPrice) {
    return {
      canAfford: true,
      requiredCash: sellerPrice,
      reason: 'You can likely pursue this individual option right now',
    };
  }

  return {
    canAfford: false,
    requiredCash: sellerPrice,
    shortBy: sellerPrice - user.availableCash,
    reason: 'You do not currently have enough cash for this individual option',
  };
}

export function getMaxPayoffMonths(tier: CreditTier): number {
  const months: { [key in CreditTier]: number } = {
    'green': 60,
    'yellow': 48,
    'red': 36,
  };
  return months[tier];
}

