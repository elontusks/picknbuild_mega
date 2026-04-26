import type { TitleType } from './types';

const BUILD_CACHE_BUST = '2026-03-26-12:00:00Z-term-fix-v9';
export type CreditTier = 'green' | 'yellow' | 'red';
// Cache clear v11 - 2026-03-24

// Build cache clear 2026-03-24 v9
// Constants
const TAX_RATE = 0.085;
const DEALER_FEE = 1000;
const REBUILT_DISCOUNT = 0.20;
const PICKNBUILD_DOWN_PAYMENT_PERCENTAGE = 0.35;
const PICKNBUILD_MIN_MONTHLY = 500;

// Pick & Build specific fees
const PICKNBUILD_TAX_RATE = 0.085;
const PICKNBUILD_TITLE_FEE = 50;
const PICKNBUILD_REGISTRATION_FEE = 35;
const PICKNBUILD_DOCUMENTATION_FEE = 1000;

// Continuous risk calculation for Pick & Build
// Formula: risk_percentage = 22% - ((credit_score - 580) / 270 × 7%)
// Range: 15% (at 850+) to 22% (at 580 or below)
// No tiers, no jumps, continuous scaling only
export function calculateContinuousRiskPercentage(creditScore: number | null): number {
  // Pick & Build risk formula - base risk for full 5-year term
  // 850 = 15%, 580 = 45%, scales smoothly between
  // Formula: base_risk_percentage = 45 - ((credit_score - 580) / 270 * 30)
  
  if (creditScore === null) return 0.45; // 45% for no credit (treat as lowest score)
  if (creditScore >= 850) return 0.15; // 15% cap at score 850+
  if (creditScore <= 580) return 0.45; // 45% at score 580 or below
  
  // Linear interpolation: risk_percentage = 45 - ((credit_score - 580) / 270 * 30)
  const riskPercentage = 45 - (((creditScore - 580) / 270) * 30);
  // Clamp between 15% and 45%
  return Math.max(0.15, Math.min(0.45, riskPercentage / 100));
}

// NEW: Credit-based risk tiers for Pick & Build (tiers mode)
// Green (850) → 15%, Yellow (715) → 18%, Red (580) → 22%
export function getCreditBasedRiskTier(creditScore: number): { tier: CreditTier; risk: number } {
  if (creditScore >= 720) {
    return { tier: 'green', risk: 0.15 };
  } else if (creditScore >= 621) {
    return { tier: 'yellow', risk: 0.18 };
  } else {
    return { tier: 'red', risk: 0.22 };
  }
}

// Credit score to tier mapping (moved to top for early availability)
export function getCreditTier(creditScore: number): CreditTier {
  if (creditScore >= 720) return 'green';
  if (creditScore >= 621) return 'yellow';
  return 'red';
}

// NEW: Fixed APR tiers for Dealer
// Green (720-850) → 12%, Yellow (621-719) → 19.5%, Red (0-620) → 27%
export function getDealerFixedAPRByTier(creditScore: number): number | null {
  if (creditScore < 560) return null; // Not approved
  if (creditScore >= 720) return 0.12;  // Green
  if (creditScore >= 621) return 0.195; // Yellow (19.5%)
  return 0.27; // Red
}

// Risk percentages for PicknBuild (split across 5 years)
function getTotalRiskPercentage(creditTier: CreditTier): number {
  switch (creditTier) {
    case 'green':
      return 0.07;
    case 'yellow':
      return 0.30;
    case 'red':
      return 0.45;
  }
}

// APR for Dealer based on actual credit score (continuous scaling)
// Formula: apr = 26% - ((credit_score - 580) / 270 × 14%)
// Range: 12% (at 850+) to 26% (at 580 or below)
export function getDealerAPRByScore(creditScore: number): number | null {
  if (creditScore === null) return null; // Not approved without credit
  if (creditScore < 560) return null; // Not approved below 560
  if (creditScore >= 850) return 0.12; // 12% at score 850+
  if (creditScore <= 580) return 0.26; // 26% at score 580 or below
  
  // Linear interpolation: apr = 26% - ((credit_score - 580) / 270 × 14%)
  const aprPercentage = 26 - (((creditScore - 580) / 270) * 14);
  // Clamp between 12% and 26%
  return Math.max(0.12, Math.min(0.26, aprPercentage / 100));
}

// Approval status based on credit score
export function getDealerApprovalStatus(creditScore: number): string {
  if (creditScore >= 850) return 'Best Rates (12% APR)';
  if (creditScore >= 700) return 'Good Approval';
  if (creditScore >= 600) return 'Fair Approval';
  if (creditScore >= 560) return 'Limited Approval (26% APR)';
  return 'Most likely not approved';
}

// Down payment percentage based on selected term (term-sensitive)
// CORRECTED: Longer terms = lower down payment, shorter terms = higher down payment
function getDealerDownPaymentByTerm(termMonths: number): number {
  if (termMonths <= 36) return 0.20;  // 20% for 3 years (highest down payment)
  if (termMonths <= 48) return 0.16;  // 16% for 4 years
  if (termMonths <= 60) return 0.12;  // 12% for 5 years
  return 0.10;                         // 10% for 6 years (lowest down payment)
}

// NEW: Estimate trade-in value based on VIN (simplified calculation)
// In production, this would call a real VIN decoder API
export function estimateTradeInValue(vin: string, titleType: TitleType, basePrice?: number): number {
  // Simplified estimation: base on VIN length validation + default estimate
  if (!vin || vin.length < 10) return 0;
  
  // Default trade-in estimate (would be real in production)
  let tradeInValue = basePrice ? Math.floor(basePrice * 0.6) : 15000;
  
  // Apply rebuilt title adjustment (15% reduction)
  if (titleType === 'rebuilt') {
    tradeInValue = Math.floor(tradeInValue * (1 - REBUILT_DISCOUNT));
  }
  
  return tradeInValue;
}
export function getAPR(creditTier: CreditTier): number {
  switch (creditTier) {
    case 'green':
      return 0.05; // 5%
    case 'yellow':
      return 0.12; // 12%
    case 'red':
      return 0.22; // 22%
  }
}

// Dealer down payment percentage
function getDealerDownPaymentPercentage(creditTier: CreditTier): number {
  switch (creditTier) {
    case 'green':
      return 0.12; // 12%
    case 'yellow':
      return 0.10; // 10%
    case 'red':
      return 0.18; // 18%
  }
}

// Default loan term by credit tier
export function getDefaultDealerTerm(creditTier: CreditTier): number {
  switch (creditTier) {
    case 'green':
      return 60; // 5 years
    case 'yellow':
      return 72; // 6 years
    case 'red':
      return 72; // 6 years
  }
}

// ============================================
// PICKNBUILD CALCULATIONS
// ============================================

export interface PickAndBuildTermPricing {
  vehiclePrice: number;
  tax: number;
  fees: number;
  vehicleSubtotal: number;
  riskTier: CreditTier;
  totalRiskPercentage: number;
  termRiskPercentage: number;
  riskAmount: number;
  customizationTotal?: number; // Add-ons (upfront, not financed)
  shippingTotal?: number; // Optional shipping (upfront, not financed)
  totalFinancedAmount?: number; // Vehicle + risk only (what gets financed)
  totalPrice: number; // Full price including upfront costs
  downPayment: number; // 35% of vehicle+risk + add-ons + shipping (all upfront costs)
  loanAmount?: number;
  remainingBalance?: number; // Vehicle + risk (financed portion)
  biweeklyPayment?: number;
  biweeklyPaymentCount?: number;
  monthlyPayment?: number;
  months: number;
  isAvailable: boolean;
  isCashPrice?: boolean; // Optional cash price flag
}

export function calculatePickAndBuildWithTerm(
  basePrice: number,
  titleType: 'clean' | 'rebuilt',
  creditTier: CreditTier,
  months: number
): PickAndBuildTermPricing {
  // Step 1: Calculate vehicle price with rebuilt discount
  let vehiclePrice = basePrice;
  if (titleType === 'rebuilt') {
    vehiclePrice = vehiclePrice * (1 - REBUILT_DISCOUNT);
  }

  // Step 2: Add tax and fees
  const tax = vehiclePrice * TAX_RATE;
  const fees = DEALER_FEE;
  const vehicleSubtotal = vehiclePrice + tax + fees;

  // Step 3: Calculate term-based risk
  // Total risk split across 5 years: term risk = (total risk / 5) * selected years
  const totalRiskPercentage = getTotalRiskPercentage(creditTier);
  const years = months / 12;
  const termRiskPercentage = (totalRiskPercentage / 5) * years;

  // Step 4: Apply risk to vehicle subtotal
  const riskAmount = vehicleSubtotal * termRiskPercentage;
  const totalPrice = vehicleSubtotal + riskAmount;

  // Step 5: Calculate down payment and loan amount
  const downPayment = totalPrice * PICKNBUILD_DOWN_PAYMENT_PERCENTAGE;
  const loanAmount = totalPrice - downPayment;

  // Step 6: Calculate monthly payment
  const monthlyPayment = loanAmount / months;

  // Step 7: Check if meets minimum
  const isAvailable = monthlyPayment >= PICKNBUILD_MIN_MONTHLY;

  return {
    vehiclePrice,
    tax,
    fees,
    vehicleSubtotal,
    riskTier: creditTier,
    totalRiskPercentage,
    termRiskPercentage,
    riskAmount,
    totalPrice,
    downPayment,
    loanAmount,
    monthlyPayment,
    months,
    isAvailable,
  };
}

export function getAvailablePickAndBuildTerms(
  basePrice: number,
  titleType: 'clean' | 'rebuilt',
  creditTier: CreditTier
): number[] {
  const allTerms = [12, 24, 36, 48, 60];
  return allTerms.filter((months) => {
    const pricing = calculatePickAndBuildWithTerm(basePrice, titleType, creditTier, months);
    return pricing.isAvailable;
  });
}

// Pick & Build with continuous risk percentage (used for actual pricing display)
export function calculatePickAndBuildWithContinuousRisk(
  basePrice: number,
  titleType: 'clean' | 'rebuilt',
  creditScore: number | null,
  months: number,
  customizationTotal: number = 0,
  shippingTotal: number = 0,
  isCashPrice: boolean = false
): PickAndBuildTermPricing {
  // Step 1: Calculate vehicle price with rebuilt discount
  let vehiclePrice = basePrice;
  if (titleType === 'rebuilt') {
    vehiclePrice = vehiclePrice * (1 - REBUILT_DISCOUNT);
  }

  // Step 2: Calculate Pick & Build fees (tax + title + registration + documentation)
  const tax = vehiclePrice * PICKNBUILD_TAX_RATE;
  const titleFee = PICKNBUILD_TITLE_FEE;
  const registrationFee = PICKNBUILD_REGISTRATION_FEE;
  const documentationFee = PICKNBUILD_DOCUMENTATION_FEE;
  const fees = titleFee + registrationFee + documentationFee;
  
  // CASH MODE: Include fees directly in vehicle price
  if (isCashPrice) {
    // In cash mode, all fees are included in the total cash price
    // There's no financing, no down payment calculation, no bi-weekly payments
    const totalCashPrice = vehiclePrice + tax + fees + customizationTotal + shippingTotal;
    
    const creditTier: CreditTier = creditScore === null 
      ? 'red' 
      : creditScore >= 720 
      ? 'green' 
      : creditScore >= 621 
      ? 'yellow' 
      : 'red';
    
    return {
      vehiclePrice,
      tax,
      fees,
      vehicleSubtotal: vehiclePrice + tax + fees,
      riskTier: creditTier,
      totalRiskPercentage: 0,
      termRiskPercentage: 0,
      riskAmount: 0,
      customizationTotal,
      shippingTotal,
      totalFinancedAmount: 0,
      totalPrice: totalCashPrice,
      downPayment: totalCashPrice, // Full cash price is what they pay
      remainingBalance: 0, // No financing
      biweeklyPayment: 0,
      biweeklyPaymentCount: 0,
      months,
      isAvailable: true, // Cash is always available
      isCashPrice: true,
    };
  }
  
  // FINANCED MODE: Standard calculation
  const vehicleSubtotal = vehiclePrice + tax + fees;

  // Step 3: Calculate continuous risk percentage (base for full 5-year term)
  const fullTermRiskPercentage = calculateContinuousRiskPercentage(creditScore);
  
  // Step 3.5: Apply term scaling - shorter terms get less risk applied
  // term_risk_percentage = full_risk_percentage × (selected_years / 5)
  const selectedYears = months / 12;
  const termScalingFactor = Math.min(selectedYears / 5, 1); // Cap at 1.0 for 5+ years
  const termRiskPercentage = fullTermRiskPercentage * termScalingFactor;

  // Step 4: Apply term-adjusted risk to vehicle subtotal
  const riskAmount = vehicleSubtotal * termRiskPercentage;
  
  // Step 4.5: Calculate financed amount (vehicle + risk only)
  const totalFinancedAmount = vehicleSubtotal + riskAmount;
  
  // Step 4.6: Calculate upfront costs (add-ons and optional shipping - NOT financed)
  const totalUpfrontCosts = customizationTotal + shippingTotal;
  
  // Step 5: Total price includes financed amount + upfront costs
  const totalPrice = totalFinancedAmount + totalUpfrontCosts;

  // Step 6: Calculate down payment
  // Down payment = 35% of financed amount + 100% of upfront costs (add-ons and shipping)
  const downPayment = (totalFinancedAmount * PICKNBUILD_DOWN_PAYMENT_PERCENTAGE) + totalUpfrontCosts;
  
  // Remaining balance is only the financed portion after down payment
  const remainingBalance = totalFinancedAmount - (totalFinancedAmount * PICKNBUILD_DOWN_PAYMENT_PERCENTAGE);

  // Step 7: Calculate bi-weekly payment
  // 26 bi-weekly periods per year
  const biweeklyPaymentCount = selectedYears * 26;
  const biweeklyPayment = remainingBalance / biweeklyPaymentCount;

  // Step 8: Check if meets minimum ($500 monthly equivalent = ~$230 bi-weekly)
  const monthlyEquivalent = biweeklyPayment * 26 / 12;
  const isAvailable = monthlyEquivalent >= PICKNBUILD_MIN_MONTHLY;

  // Determine credit tier for display - inline calculation to avoid scope issues
  const creditTier: CreditTier = creditScore === null 
    ? 'red' 
    : creditScore >= 720 
    ? 'green' 
    : creditScore >= 621 
    ? 'yellow' 
    : 'red';

  return {
    vehiclePrice,
    tax,
    fees,
    vehicleSubtotal,
    riskTier: creditTier,
    totalRiskPercentage: fullTermRiskPercentage, // Full 5-year risk for reference
    termRiskPercentage: termRiskPercentage, // Adjusted risk for selected term
    riskAmount,
    customizationTotal,
    shippingTotal,
    totalFinancedAmount,
    totalPrice,
    downPayment,
    remainingBalance,
    biweeklyPayment,
    biweeklyPaymentCount,
    months,
    isAvailable,
    isCashPrice: false,
  };
}

export function getAvailablePickAndBuildTermsWithContinuousRisk(
  basePrice: number,
  titleType: 'clean' | 'rebuilt',
  creditScore: number | null
): number[] {
  const allTerms = [12, 24, 36, 48, 60];
  return allTerms.filter((months) => {
    const pricing = calculatePickAndBuildWithContinuousRisk(basePrice, titleType, creditScore, months);
    return pricing.isAvailable;
  });
}

// ============================================
// DEALER CALCULATIONS
// ============================================

export interface DealerTermPricing {
  vehiclePrice: number;
  tax: number;
  fees: number;
  stickerPrice: number;
  riskTier: CreditTier;
  apr: number;
  downPaymentPercentage: number;
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  totalPaid: number;
  interestPaid: number;
  months: number;
}

export interface DealerTermPricingByScore extends DealerTermPricing {
  creditScore: number;
  approvalStatus: string;
  isApproved: boolean;
}

export function calculateDealerWithTerm(
  basePrice: number,
  titleType: 'clean' | 'rebuilt',
  creditTier: CreditTier,
  months: number
): DealerTermPricing {
  // Step 1: Calculate vehicle price with rebuilt discount
  let vehiclePrice = basePrice;
  if (titleType === 'rebuilt') {
    vehiclePrice = vehiclePrice * (1 - REBUILT_DISCOUNT);
  }

  // Step 2: Add tax and fees
  const tax = vehiclePrice * TAX_RATE;
  const fees = DEALER_FEE;
  const stickerPrice = vehiclePrice + tax + fees;

  // Step 3: Get APR for credit tier
  const apr = getAPR(creditTier);

  // Step 4: Calculate down payment based on credit tier
  const downPaymentPercentage = getDealerDownPaymentPercentage(creditTier);
  const downPayment = stickerPrice * downPaymentPercentage;

  // Step 5: Calculate loan amount
  const loanAmount = stickerPrice - downPayment;

  // Step 6: Apply amortization formula
  // monthly = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
  const monthlyRate = apr / 12;
  const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  const monthlyPayment = numerator / denominator;

  // Step 7: Calculate totals
  const totalPaid = downPayment + monthlyPayment * months;
  const interestPaid = totalPaid - stickerPrice;

  return {
    vehiclePrice,
    tax,
    fees,
    stickerPrice,
    riskTier: creditTier,
    apr,
    downPaymentPercentage,
    downPayment,
    loanAmount,
    monthlyPayment,
    totalPaid,
    interestPaid,
    months,
  };
}

// Dealer calculation using actual credit score instead of tier
// Function: Calculate Dealer pricing by credit score and term length
// Uses inline creditTier definition to ensure proper scoping
export function calculateDealerWithTermByScore(
  basePrice: number,
  titleType: 'clean' | 'rebuilt',
  creditScore: number,
  months: number,
  _cacheInvalidation?: string // Force rebuild: 2026-03-26-final-fix-v8
): DealerTermPricingByScore {
  // Step 0: Ensure inputs are valid numbers
  let vehiclePrice = Math.max(0, basePrice || 0);
  const validCreditScore = Math.max(0, Math.min(850, creditScore || 0));
  const validMonths = Math.max(1, months || 60);
  
  // Step 0.5: Apply rebuilt discount if applicable
  if (titleType === 'rebuilt') {
    vehiclePrice = vehiclePrice * (1 - REBUILT_DISCOUNT);
  }
  
  // Step 1: Calculate base pricing
  const tax = vehiclePrice * TAX_RATE;
  const fees = DEALER_FEE;
  const stickerPrice = vehiclePrice + tax + fees;

  // Step 2: Determine credit tier for risk assessment based on score brackets
  let creditTier: CreditTier;
  if (validCreditScore >= 720) {
    creditTier = 'green';
  } else if (validCreditScore >= 621) {
    creditTier = 'yellow';
  } else {
    creditTier = 'red';
  }
  
  // Step 3: Get financing parameters
  const apr = getDealerFixedAPRByTier(validCreditScore);
  const approvalStatus = getDealerApprovalStatus(validCreditScore);
  const isApproved = apr !== null && validCreditScore >= 560;

  // If not approved, return null APR result
  if (!isApproved) {
    const notApprovedResult = {
      vehiclePrice,
      tax,
      fees,
      stickerPrice,
      creditScore: validCreditScore,
      riskTier: creditTier,
      apr: 0,
      downPaymentPercentage: 0,
      downPayment: 0,
      loanAmount: 0,
      monthlyPayment: 0,
      totalPaid: 0,
      interestPaid: 0,
      months: validMonths,
      approvalStatus,
      isApproved: false,
    };
    return notApprovedResult;
  }

  // Step 4: Calculate down payment based on selected term
  const downPaymentPercentage = getDealerDownPaymentByTerm(validMonths);
  const downPayment = stickerPrice * downPaymentPercentage;

  // Step 5: Calculate loan amount
  const loanAmount = stickerPrice - downPayment;

  // Step 6: Calculate monthly payment using amortization
  const monthlyRate = apr / 12;
  const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, validMonths);
  const denominator = Math.pow(1 + monthlyRate, validMonths) - 1;
  const monthlyPayment = numerator / denominator;

  // Step 7: Calculate total costs
  const totalPaid = downPayment + monthlyPayment * validMonths;
  const interestPaid = totalPaid - stickerPrice;

  // Return complete pricing breakdown
  return {
    vehiclePrice,
    tax,
    fees,
    stickerPrice,
    creditScore: validCreditScore,
    riskTier: creditTier,
    apr,
    downPaymentPercentage,
    downPayment,
    loanAmount,
    monthlyPayment,
    totalPaid,
    interestPaid,
    months: validMonths,
    approvalStatus,
    isApproved: true,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function getCreditTierLabel(tier: CreditTier): string {
  switch (tier) {
    case 'green':
      return 'Low Risk';
    case 'yellow':
      return 'Medium Risk';
    case 'red':
      return 'High Risk';
  }
}

export function getCreditTierColor(tier: CreditTier): string {
  switch (tier) {
    case 'green':
      return '#10b981';
    case 'yellow':
      return '#f59e0b';
    case 'red':
      return '#ef4444';
  }
}

export function getApprovalBadge(tier: CreditTier): string {
  switch (tier) {
    case 'green':
      return 'Best Rates';
    case 'yellow':
      return 'Average Approval';
    case 'red':
      return 'Limited Approval';
  }
}

// ============================================
// AUCTION / DIY ESTIMATION
// ============================================

export interface AuctionEstimate {
  currentBid: number;
  marketValue: number;
  estimatedFinalBid: number;
  repairsState: 'unknown' | 'range' | 'estimate';
  repairsMin?: number;
  repairsMax?: number;
  feesShipping: number;
  totalDIYCost: number;
  totalDIYCostMax?: number;
}

export function estimateAuctionBid(
  marketValue: number,
  currentBid: number,
  titleType: 'clean' | 'rebuilt',
  mileage: number,
  auctionReason?: string
): AuctionEstimate {
  // Title factor
  let titleFactor = 0.60; // default for unknown
  if (titleType === 'clean') {
    titleFactor = 0.70;
  } else if (titleType === 'rebuilt') {
    titleFactor = 0.55;
  }

  // Condition/damage factor based on auction reason
  let conditionFactor = 0.80; // default for unknown
  if (auctionReason) {
    const reason = auctionReason.toLowerCase();
    if (reason.includes('cosmetic') || reason.includes('theft') || reason.includes('recovery')) {
      conditionFactor = 1.00;
    } else if (reason.includes('moderate') || reason.includes('body')) {
      conditionFactor = 0.90;
    } else if (reason.includes('flood') || reason.includes('major') || reason.includes('severe')) {
      conditionFactor = 0.65;
    }
  }

  // Mileage factor
  let mileageFactor = 1.00; // default 50k-100k
  if (mileage < 50000) {
    mileageFactor = 1.05;
  } else if (mileage >= 100000 && mileage < 150000) {
    mileageFactor = 0.93;
  } else if (mileage >= 150000) {
    mileageFactor = 0.85;
  }

  // Calculate estimated final bid
  const formulaResult = marketValue * titleFactor * conditionFactor * mileageFactor;
  const estimatedFinalBid = Math.max(currentBid * 1.10, formulaResult);

  // Repair estimate logic - default to unknown
  let repairsState: 'unknown' | 'range' | 'estimate' = 'unknown';
  let repairsMin: number | undefined;
  let repairsMax: number | undefined;

  // If condition is known, suggest repair ranges
  if (auctionReason) {
    const reason = auctionReason.toLowerCase();
    if (reason.includes('cosmetic') || reason.includes('theft')) {
      repairsState = 'range';
      repairsMin = 500;
      repairsMax = 2000;
    } else if (reason.includes('moderate')) {
      repairsState = 'range';
      repairsMin = 3000;
      repairsMax = 7500;
    } else if (reason.includes('flood') || reason.includes('major')) {
      repairsState = 'range';
      repairsMin = 7500;
      repairsMax = 15000;
    }
  }

  // Fees and shipping estimate
  const feesShipping = 1500; // typical auction fees + shipping

  // Calculate total DIY cost
  let totalDIYCost = estimatedFinalBid + feesShipping;
  let totalDIYCostMax: number | undefined;

  if (repairsState === 'unknown') {
    totalDIYCost = estimatedFinalBid + feesShipping; // repairs unknown, don't add them yet
  } else if (repairsState === 'range' && repairsMin && repairsMax) {
    totalDIYCost = estimatedFinalBid + repairsMin + feesShipping;
    totalDIYCostMax = estimatedFinalBid + repairsMax + feesShipping;
  }

  return {
    currentBid,
    marketValue,
    estimatedFinalBid: Math.round(estimatedFinalBid),
    repairsState,
    repairsMin,
    repairsMax,
    feesShipping,
    totalDIYCost: Math.round(totalDIYCost),
    totalDIYCostMax: totalDIYCostMax ? Math.round(totalDIYCostMax) : undefined,
  };
}
