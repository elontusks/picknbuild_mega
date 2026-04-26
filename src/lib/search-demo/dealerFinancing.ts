// Dealer Financing Calculator
// Estimates realistic dealer pricing with interest-based monthly payments

export interface DealerFinancingCalculation {
  dealerPrice: number;
  apr: number;
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  totalDealerCost: number;
  interestPaid: number;
  approvalStatus: string;
}

const LOAN_TERM_MONTHS = 60;

export function getAPRByCredit(creditScore: number): number {
  if (creditScore >= 700) return 7.5;
  if (creditScore >= 620) return 13;
  return 21;
}

export function getApprovalStatus(creditScore: number): string {
  if (creditScore >= 700) return 'Likely Approved';
  if (creditScore >= 620) return 'Possible / Higher Interest';
  return 'Unlikely / Very High Interest';
}

export function calculateMonthlyPayment(
  loanAmount: number,
  apr: number,
  months: number = LOAN_TERM_MONTHS
): number {
  if (loanAmount <= 0 || apr <= 0) return 0;
  
  const monthlyRate = apr / 100 / 12;
  if (monthlyRate === 0) return loanAmount / months;
  
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  
  return (loanAmount * numerator) / denominator;
}

export function calculateDealerFinancing(
  acv: number,
  creditScore: number,
  downPaymentPercent: number = 0.15
): DealerFinancingCalculation {
  // Step 1: Dealer Price
  const dealerPrice = acv * 1.25;
  
  // Step 2: APR based on credit
  const apr = getAPRByCredit(creditScore);
  
  // Step 3: Down payment and loan amount
  const downPayment = dealerPrice * downPaymentPercent;
  const loanAmount = dealerPrice - downPayment;
  
  // Step 4: Monthly payment using standard loan formula
  const monthlyPayment = calculateMonthlyPayment(loanAmount, apr, LOAN_TERM_MONTHS);
  
  // Step 5: Total cost
  const totalDealerCost = monthlyPayment * LOAN_TERM_MONTHS + downPayment;
  const interestPaid = totalDealerCost - dealerPrice;
  
  const approvalStatus = getApprovalStatus(creditScore);
  
  return {
    dealerPrice,
    apr,
    downPayment,
    loanAmount,
    monthlyPayment,
    totalDealerCost,
    interestPaid,
    approvalStatus,
  };
}
