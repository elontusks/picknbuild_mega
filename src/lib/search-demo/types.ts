export type CarPath = 'dealer' | 'auction' | 'picknbuild' | 'individual';
export type Condition = 'excellent' | 'good' | 'fair';
export type Effort = 'low' | 'medium' | 'high';
export type Risk = 'low' | 'medium' | 'high';
export type CreditTier = 'green' | 'yellow' | 'red';
export type TitleType = 'clean' | 'rebuilt';
export type SellerType = 'individual' | 'dealer';

export interface Car {
  id: string;
  listingId?: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  image: string;
  gallery?: string[];
  mileage: number;
  condition: Condition;
  location: string;
  path: CarPath;
  downPayment: number;
  monthlyPayment: number;
  totalCost: number;
  availability: string;
  effort: Effort;
  risk: Risk;
  fees: number;
  repairEstimate?: number;
  source?: string;
  explanation: string;
  acv?: number;
  tradeInValue?: number;
  tradeInTitleType?: TitleType;
  titleStatus?: TitleType;
}

export interface PickedCar extends Car {
  pickedAt: Date;
}

export interface GarageGroup {
  groupKey: string; // "2024-Toyota-Camry"
  year: number;
  make: string;
  model: string;
  cars: PickedCar[];
}

export interface ContextChip {
  label: string;
  value: string | number;
}

export interface UserProfile {
  availableCash: number;
  creditScore: number;
  titleType: TitleType;
  matchModeEnabled: boolean;
  hasNoCredit?: boolean;
}

export interface AffordabilityState {
  canAfford: boolean;
  requiredCash?: number;
  shortBy?: number;
  reason: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerType: SellerType;
  make: string;
  model: string;
  year: number;
  trim?: string;
  mileage: number;
  titleType: TitleType;
  price: number;
  location: string;
  photos: string[];
  description: string;
  vin?: string;
  condition?: Condition;
  createdAt: Date;
  status: 'active' | 'sold' | 'draft';
}

export interface DealerProfile {
  id: string;
  name: string;
  location: string;
  phone?: string;
  website?: string;
  description?: string;
  logo?: string;
  listings: Listing[];
  claimed: boolean;
  subscriptionActive: boolean;
  listingsUsed: number;
}

export interface Lead {
  id: string;
  buyerId: string;
  listingId: string;
  dealerId: string;
  message: string;
  unlocked: boolean;
  unlockedAt?: Date;
  createdAt: Date;
}
