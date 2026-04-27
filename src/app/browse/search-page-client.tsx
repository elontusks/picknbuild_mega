'use client';

// REBUILD v19 - Force cache clear
// Dealer pricing: $25k base
// Pick & Build pricing: market avg minus condition discount
// Timestamp: 2026-03-24T00:00:00Z
const BUILD_VERSION = 'v12-all-elements-final';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { IntakeState, ListingObject, PathKind, PathQuote, Term, User } from '@/contracts';
import { makeFixtureIntakeState, makeFixtureListingObject } from '@/contracts';
import { Car, PickedCar, GarageGroup, UserProfile, IntakeFilters } from '@/lib/search-demo/types';
import { isPicknbuildEligible, listingToCar } from '@/lib/search-demo/listing-to-car';
import { applyIntakeFilters } from '@/lib/search-demo/intake-filters';
import { quotePath } from '@/services/team-11-pricing';
import { PICKNBUILD_MIN_MONTHLY_EQUIVALENT } from '@/lib/pricing/constants';
import {
  calculateDealerAffordability,
  calculateAuctionAffordability,
  calculatePicknBuildAffordability,
  calculateIndividualAffordability,
} from '@/lib/search-demo/matchModeUtils';
import MatchModeBar from '@/components/clarity/MatchModeBar';
import DealerColumn from '@/components/clarity/columns/DealerColumn';
import AuctionDIYColumn from '@/components/clarity/columns/AuctionDIYColumn';
import PickNBuildColumn from '@/components/clarity/columns/PickNBuildColumn';
import IndividualColumn from '@/components/clarity/columns/IndividualColumn';
import Garage from '@/components/clarity/Garage';
import DetailPanel from '@/components/clarity/DetailPanel';
import ComparisonModal from '@/components/clarity/ComparisonModal';
import ReferralModal from '@/components/clarity/ReferralModal';
import SellYourCarModal from '@/components/clarity/SellYourCarModal';
import SignInModal from '@/components/clarity/SignInModal';
import YourBestPathRightNow from '@/components/clarity/YourBestPathRightNow';
import PlanningPanel from '@/components/clarity/PlanningPanel';

type Props = {
  user: User;
  initialDealerCars: Car[];
  initialAuctionCars: Car[];
  initialIndividualCars: Car[];
  initialPicknbuildCars: Car[];
};

export function SearchPageClient(props: Props) {
  return <SearchPageInner {...props} />;
}

type LiveScrapeState = 'idle' | 'pending' | 'success' | 'unavailable' | 'error';

function SearchPageInner(props: Props) {
  const {
    user,
    initialDealerCars,
    initialAuctionCars,
    initialIndividualCars,
    initialPicknbuildCars,
  } = props;
  // Mutable pools (initial values from server props, can grow via paste-link
  // or live-scrape).
  const [dealerPool, setDealerPool] = useState<Car[]>(initialDealerCars);
  const [auctionPool, setAuctionPool] = useState<Car[]>(initialAuctionCars);
  const [individualPool, setIndividualPool] = useState<Car[]>(initialIndividualCars);
  const [picknbuildPool, setPicknbuildPool] = useState<Car[]>(initialPicknbuildCars);
  const [liveScrapeState, setLiveScrapeState] = useState<LiveScrapeState>('idle');
  const [pickedCars, setPickedCars] = useState<PickedCar[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [garageOpen, setGarageOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showPlanPanel, setShowPlanPanel] = useState(false);
  const [showGapViewModal, setShowGapViewModal] = useState(false);
  const [activePath, setActivePath] = useState('dealer');
  const [isAutoCycling, setIsAutoCycling] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string>('cash');
  const [selectedCondition, setSelectedCondition] = useState<'clean' | 'rebuilt'>('clean');
  const [filteredCars] = useState<Car[]>([]);
  const [currentUser, setCurrentUser] = useState<{ email: string; name?: string } | null>(null);
  const [referralStats, setReferralStats] = useState<{
    invitesSent: number;
    completedReferrals: number;
    earnedCredits: number;
    inviteCode?: string;
  }>({
    invitesSent: 0,
    completedReferrals: 0,
    earnedCredits: 0,
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    availableCash: 8000,
    creditScore: 650,
    matchModeEnabled: false,
  });
  const [intakeFilters, setIntakeFilters] = useState<IntakeFilters>({
    make: '',
    model: '',
    year: '',
    mileageBucket: '',
    trim: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadGarageAndProfile = async () => {
      try {
        const res = await fetch("/api/garage");
        if (!res.ok) return;
        const { items } = await res.json();
        const picked = items
          .filter((item: any) => item.decision === "pick" && item.listing)
          .map((item: any) => ({
            ...listingToCar(item.listing),
            pickedAt: new Date(item.listing.createdAt || item.addedAt),
          }));
        setPickedCars(picked);
      } catch (err) {
        console.error("Failed to load garage:", err);
      }

      // Load user profile from API
      try {
        const profileRes = await fetch("/api/users/profile");
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUserProfile({
            availableCash: profile.availableCash || 8000,
            creditScore: profile.creditScore || 650,
            titleType: profile.titleType ?? undefined,
            matchModeEnabled: false,
          });
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }

      // Load referral stats from API
      try {
        const referralRes = await fetch("/api/referrals");
        if (referralRes.ok) {
          const stats = await referralRes.json();
          setReferralStats({
            invitesSent: stats.invitesSent ?? 0,
            completedReferrals: stats.completedReferrals ?? 0,
            earnedCredits: stats.earnedCredits ?? 0,
            inviteCode: stats.inviteCode,
          });
        }
      } catch (err) {
        console.error("Failed to load referral stats:", err);
      }
    };
    loadGarageAndProfile();
  }, []);

  const filterMatch = useCallback((car: Car) => {
    if (filteredCars.length === 0) return true;
    return filteredCars.some(f => f.id === car.id);
  }, [filteredCars]);

  const dealerCars = useMemo(() => {
    let filtered = applyIntakeFilters(dealerPool.filter(filterMatch), intakeFilters);

    if (userProfile.matchModeEnabled) {
      filtered = filtered.filter(car => {
        const affordability = calculateDealerAffordability(
          userProfile,
          car.acv || 20000
        );
        return affordability.canAfford;
      });
    }

    return filtered;
  }, [dealerPool, filterMatch, intakeFilters, userProfile.matchModeEnabled, userProfile]);

  const auctionCars = useMemo(() => {
    let filtered = applyIntakeFilters(auctionPool.filter(filterMatch), intakeFilters);

    if (userProfile.matchModeEnabled) {
      filtered = filtered.filter(car => {
        const affordability = calculateAuctionAffordability(
          userProfile,
          car.acv || 20000,
          car.repairEstimate || 2000
        );
        return affordability.canAfford;
      });
    }

    return filtered;
  }, [auctionPool, filterMatch, intakeFilters, userProfile.matchModeEnabled, userProfile]);

  const picknbuildCars = useMemo(() => {
    let filtered = applyIntakeFilters(picknbuildPool.filter(filterMatch), intakeFilters);

    if (userProfile.matchModeEnabled) {
      filtered = filtered.filter(car => {
        const affordability = calculatePicknBuildAffordability(
          userProfile,
          car.acv || 20000
        );
        return affordability.canAfford;
      });
    }

    return filtered;
  }, [picknbuildPool, filterMatch, intakeFilters, userProfile.matchModeEnabled, userProfile]);

  const individualCars = useMemo(() => {
    let filtered = applyIntakeFilters(individualPool.filter(filterMatch), intakeFilters);

    if (userProfile.matchModeEnabled) {
      filtered = filtered.filter(car => {
        // Skip the affordability gate when totalCost is missing rather than
        // anchoring on a magic default — letting unknown-price listings
        // through is preferable to filtering them by an arbitrary fallback.
        if (!car.totalCost) return true;
        const affordability = calculateIndividualAffordability(
          userProfile,
          car.totalCost
        );
        return affordability.canAfford;
      });
    }

    return filtered;
  }, [individualPool, filterMatch, intakeFilters, userProfile.matchModeEnabled, userProfile]);

  // Group picked cars by make/model
  const garageGroups = useMemo(() => {
    const grouped: { [key: string]: PickedCar[] } = {};
    pickedCars.forEach(car => {
      const key = `${car.year}-${car.make}-${car.model}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(car);
    });

    return Object.entries(grouped).map(([key, cars]) => {
      const first = cars[0]!;
      return {
        groupKey: key,
        year: first.year,
        make: first.make,
        model: first.model,
        cars,
      } as GarageGroup;
    });
  }, [pickedCars]);

  // When a column's paste-link succeeds, drop the new Car into the right pool
  // so it actually shows up in that column (instead of vanishing once the
  // DetailPanel closes). The dedup-by-id keeps re-parses idempotent.
  const handleCarParsed = useCallback((car: Car) => {
    const upsert = (prev: Car[]): Car[] =>
      prev.some((c) => c.id === car.id) ? prev : [car, ...prev];
    if (car.path === 'dealer') setDealerPool(upsert);
    else if (car.path === 'auction') setAuctionPool(upsert);
    else if (car.path === 'individual') setIndividualPool(upsert);
    else if (car.path === 'picknbuild') setPicknbuildPool(upsert);
    setSelectedCar(car);
  }, []);

  // Auction-empty fallback: ask the orchestrator to fan out a live search
  // (Copart + IAAI + Firecrawl-driven sites) for the user's intake. The
  // scraper /search endpoint persists rows itself, so we just refetch the
  // listings table afterwards and rebucket. Returns early on missing make/
  // model so we don't trigger an unbounded scrape from an empty filter set.
  const handleRequestLiveScrape = useCallback(async () => {
    if (liveScrapeState === 'pending') return;
    if (!intakeFilters.make.trim() && !intakeFilters.model.trim()) {
      setLiveScrapeState('error');
      return;
    }
    setLiveScrapeState('pending');
    try {
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: intakeFilters.make.trim() || undefined,
          model: intakeFilters.model.trim() || undefined,
          year: intakeFilters.year.trim() || undefined,
        }),
      });
      if (scrapeRes.status === 503 || scrapeRes.status === 502) {
        setLiveScrapeState('unavailable');
        return;
      }
      if (!scrapeRes.ok) {
        setLiveScrapeState('error');
        return;
      }
      const listRes = await fetch('/api/listings?status=active&limit=100');
      if (!listRes.ok) {
        setLiveScrapeState('error');
        return;
      }
      const { listings } = (await listRes.json()) as { listings: ListingObject[] };
      const nextDealer: Car[] = [];
      const nextAuction: Car[] = [];
      const nextIndividual: Car[] = [];
      const nextPicknbuild: Car[] = [];
      for (const listing of listings) {
        const car = listingToCar(listing);
        if (car.path === 'dealer') nextDealer.push(car);
        else if (car.path === 'auction') nextAuction.push(car);
        else if (car.path === 'individual') nextIndividual.push(car);
        if (isPicknbuildEligible(listing)) nextPicknbuild.push(car);
      }
      setDealerPool(nextDealer);
      setAuctionPool(nextAuction);
      setIndividualPool(nextIndividual);
      setPicknbuildPool(nextPicknbuild);
      setLiveScrapeState('success');
    } catch {
      setLiveScrapeState('unavailable');
    }
  }, [liveScrapeState, intakeFilters]);

  const handlePickCar = useCallback(async (car: Car) => {
    if (!car.listingId) {
      setToast({ message: "Cannot pick this car—no listing ID", type: "error" });
      return;
    }

    try {
      const res = await fetch("/api/garage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: car.listingId, decision: "pick" }),
      });

      if (!res.ok) {
        setToast({ message: "Failed to add to garage", type: "error" });
        return;
      }

      const pickedCar: PickedCar = {
        ...car,
        pickedAt: new Date(),
      };
      setPickedCars((prev) => [...prev, pickedCar]);
      setToast({ message: "Added to garage!", type: "success" });

      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: "Error adding to garage", type: "error" });
    }
  }, []);

  const handleRemovePickedCar = useCallback(async (carId: string) => {
    const target = pickedCars.find((car) => car.id === carId);
    const listingId = target?.listingId ?? target?.id;
    if (!listingId) {
      setToast({ message: "Cannot remove this car—no listing ID", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const res = await fetch(`/api/garage/${listingId}`, { method: "DELETE" });
      if (!res.ok) {
        setToast({ message: "Failed to remove from garage", type: "error" });
        setTimeout(() => setToast(null), 3000);
        return;
      }
      setPickedCars((prev) => prev.filter((car) => car.id !== carId));
      setToast({ message: "Removed from garage", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ message: "Error removing from garage", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  }, [pickedCars]);

  const handleSignIn = useCallback(async (email: string, _password: string) => {
    const user = { email, name: email.split('@')[0] };
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }, []);

  const handleSignOut = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  const handleSeeAvailableCars = useCallback(() => {
    setUserProfile((prev) => ({ ...prev, matchModeEnabled: true }));
  }, []);

  const handlePlanForGoal = useCallback(() => {
    setShowGapViewModal(true);
    setActivePath('dealer');
    setIsAutoCycling(true);
  }, []);

  // Resolve the basePrice that drives the gap modal: prefer the currently
  // selected car's ACV, else the median ACV of the dealer pool (median is
  // more robust to outliers than mean), else 0 which gracefully zeros the
  // gap math while we wait for inventory.
  const gapBasePrice = useMemo<number>(() => {
    if (selectedCar?.acv && selectedCar.acv > 0) return selectedCar.acv;
    const acvs = dealerCars
      .map((c) => c.acv ?? 0)
      .filter((v) => v > 0)
      .sort((a, b) => a - b);
    if (acvs.length === 0) return 0;
    const mid = Math.floor(acvs.length / 2);
    return acvs.length % 2 === 0
      ? Math.round(((acvs[mid - 1] ?? 0) + (acvs[mid] ?? 0)) / 2)
      : acvs[mid] ?? 0;
  }, [selectedCar, dealerCars]);

  // Map the modal's term-string vocabulary ("cash" | "1".."6") to the Term
  // contract ("cash" | "1y".."5y"). Contract caps at 5y, so 6 is clamped.
  const toContractTerm = useCallback((termStr: string): Term => {
    if (termStr === 'cash') return 'cash';
    const n = parseInt(termStr, 10);
    if (!Number.isFinite(n)) return 'cash';
    const clamped = Math.max(1, Math.min(5, n));
    return `${clamped}y` as Term;
  }, []);

  // (path|term|condition) -> PathQuote cache, populated by useEffect below.
  const [quoteCache, setQuoteCache] = useState<Record<string, PathQuote>>({});

  // The (path, term, condition) combinations the modal needs: the active
  // selection plus every financed picknbuild term (1y..5y) so the year
  // buttons can be greyed out when a term fails the $500/mo floor.
  const quoteRequests = useMemo(() => {
    const reqs: Array<{ key: string; path: PathKind; term: Term; condition: 'clean' | 'rebuilt' }> = [];
    const condition = selectedCondition;
    const pushReq = (path: PathKind, term: Term) => {
      reqs.push({ key: `${path}|${term}|${condition}`, path, term, condition });
    };
    pushReq(activePath as PathKind, toContractTerm(selectedTerm));
    (['1y', '2y', '3y', '4y', '5y'] as const).forEach((t) => pushReq('picknbuild', t));
    return reqs;
  }, [activePath, selectedTerm, selectedCondition, toContractTerm]);

  useEffect(() => {
    if (gapBasePrice <= 0) return;

    let cancelled = false;
    const run = async () => {
      const next: Record<string, PathQuote> = {};
      await Promise.all(
        quoteRequests.map(async ({ key, path, term, condition }) => {
          const listing: ListingObject = makeFixtureListingObject({
            price: gapBasePrice,
            currentBid: gapBasePrice,
            binPrice: gapBasePrice,
            estimatedMarketValue: gapBasePrice,
            titleStatus: condition,
          });
          const intake: IntakeState = makeFixtureIntakeState({
            cash: userProfile.availableCash,
            creditScore: userProfile.creditScore,
            noCredit: !!userProfile.hasNoCredit,
            titlePreference: condition,
            selectedTerm: term,
          });
          next[key] = await quotePath(path, listing, intake);
        }),
      );
      if (!cancelled) setQuoteCache((prev) => ({ ...prev, ...next }));
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    quoteRequests,
    gapBasePrice,
    userProfile.availableCash,
    userProfile.creditScore,
    userProfile.hasNoCredit,
  ]);

  const getPathCosts = (path: string, term: string = 'cash', condition: 'clean' | 'rebuilt' = 'clean') => {
    const contractTerm = toContractTerm(term);
    const cacheKey = `${path}|${contractTerm}|${condition}`;
    const quote = quoteCache[cacheKey];
    const cash = userProfile.availableCash;
    const safeGap = (n: number) => Math.max(0, n - cash);

    // Until quotePath resolves (or if no basePrice is available), surface
    // placeholder zeros so the modal remains structurally valid.
    if (!quote) {
      switch (path) {
        case 'dealer':
          return term === 'cash'
            ? { type: 'dealer' as const, totalCost: 0, totalCostGap: 0, isCashTerm: true }
            : {
                type: 'dealer' as const,
                downPayment: 0,
                totalCost: 0,
                monthlyPayment: 0,
                downPaymentGap: 0,
                totalCostGap: 0,
                isCashTerm: false,
              };
        case 'auction':
          return {
            type: 'auction' as const,
            currentBid: 0,
            estimatedTotalCost: 0,
            bidGap: 0,
            totalCostGap: 0,
          };
        case 'picknbuild':
          return term === 'cash'
            ? { type: 'picknbuild' as const, totalCost: 0, totalCostGap: 0, hasCashTerm: true }
            : {
                type: 'picknbuild' as const,
                downPayment: 0,
                totalCost: 0,
                biweeklyPayment: 0,
                monthlyEquivalent: 0,
                meetsMinimum: true,
                downPaymentGap: 0,
                totalCostGap: 0,
                hasCashTerm: false,
              };
        case 'private':
          return { type: 'private' as const, priceRequired: 0, cashGap: 0 };
        default:
          return { type: 'default' as const, totalCost: 0, gap: 0 };
      }
    }

    switch (path) {
      case 'dealer': {
        if (term === 'cash') {
          return {
            type: 'dealer' as const,
            totalCost: quote.total,
            totalCostGap: safeGap(quote.total),
            isCashTerm: true,
          };
        }
        const downPayment = quote.down ?? 0;
        const monthlyPayment = quote.monthly ?? 0;
        const months = parseInt(contractTerm, 10) * 12;
        const totalCostAllIn = downPayment + monthlyPayment * months;
        return {
          type: 'dealer' as const,
          downPayment,
          totalCost: totalCostAllIn,
          monthlyPayment,
          downPaymentGap: safeGap(downPayment),
          totalCostGap: safeGap(totalCostAllIn),
          isCashTerm: false,
        };
      }
      case 'auction': {
        // Auction quote rolls bid + buyer fee + transport + repair into total;
        // surface gapBasePrice as the bid and the quote's total as all-in.
        const currentBid = gapBasePrice;
        const estimatedTotalCost = quote.total;
        return {
          type: 'auction' as const,
          currentBid,
          estimatedTotalCost,
          bidGap: safeGap(currentBid),
          totalCostGap: safeGap(estimatedTotalCost),
        };
      }
      case 'picknbuild': {
        if (term === 'cash') {
          return {
            type: 'picknbuild' as const,
            totalCost: quote.total,
            totalCostGap: safeGap(quote.total),
            hasCashTerm: true,
          };
        }
        const downPayment = quote.down ?? 0;
        const biweeklyPayment = quote.biweekly ?? 0;
        const monthlyEquivalent = (biweeklyPayment * 26) / 12;
        const meetsMinimum = monthlyEquivalent >= PICKNBUILD_MIN_MONTHLY_EQUIVALENT;
        return {
          type: 'picknbuild' as const,
          downPayment,
          totalCost: quote.total,
          biweeklyPayment,
          monthlyEquivalent,
          meetsMinimum,
          downPaymentGap: safeGap(downPayment),
          totalCostGap: safeGap(quote.total),
          hasCashTerm: false,
        };
      }
      case 'private': {
        return {
          type: 'private' as const,
          priceRequired: quote.total,
          cashGap: safeGap(quote.total),
        };
      }
      default: {
        return {
          type: 'default' as const,
          totalCost: quote.total,
          gap: safeGap(quote.total),
        };
      }
    }
  };

  const getPathReality = (path: string) => {
    const lowCredit = userProfile.creditScore && userProfile.creditScore < 650;

    switch (path) {
      case 'dealer':
        return {
          barrier: lowCredit ? 'Barrier to entry: approval may be difficult' : 'Barrier to entry: approval, credit, and down payment',
          reality: 'What this path really requires: approval first, then financing terms',
          clarification: 'Final cost depends on credit score and loan term.',
        };
      case 'auction':
        return {
          barrier: 'Barrier to entry: cash upfront plus repairs and transport',
          reality: 'What this path really requires: cash, repairs, transport, and risk',
          clarification: 'Auction price is not final—add repairs and shipping.',
        };
      case 'picknbuild':
        return {
          barrier: 'Barrier to entry: ~35% down payment',
          reality: 'What this path really requires: ~35% down and build time',
          clarification: 'All-in cost varies by payment term chosen.',
        };
      case 'private':
        return {
          barrier: 'Barrier to entry: full cash and your own inspection',
          reality: 'What this path really requires: cash upfront and full risk on you',
          clarification: 'You handle inspection and risk—no built-in protection.',
        };
      default:
        return { barrier: '', reality: '', clarification: '' };
    }
  };

  const pathReality = getPathReality(activePath);
  const pathCosts = getPathCosts(activePath, selectedTerm, selectedCondition);

  useEffect(() => {
    if (!showGapViewModal || !isAutoCycling) return;

    const paths = ['dealer', 'auction', 'picknbuild', 'private'];
    let currentIndex = paths.indexOf(activePath);

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % paths.length;
      setActivePath(paths[currentIndex]!);
    }, 2000);

    return () => clearInterval(interval);
  }, [showGapViewModal, isAutoCycling, activePath]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <MatchModeBar
        userProfile={userProfile}
        userZip={user.zip}
        intakeFilters={intakeFilters}
        onIntakeFiltersChange={setIntakeFilters}
        onMatchModeChange={(enabled) => setUserProfile({ ...userProfile, matchModeEnabled: enabled })}
        onUserProfileChange={setUserProfile}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {garageOpen && (
          <aside style={{ width: '384px', borderRight: `1px solid var(--border)`, backgroundColor: 'var(--card)', overflowY: 'auto' }}>
            <Garage
              groups={garageGroups}
              onRemove={handleRemovePickedCar}
              onSelectCar={setSelectedCar}
              onCompareClick={() => setShowComparison(true)}
            />
          </aside>
        )}

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px', paddingBottom: '12px', borderBottom: `1px solid var(--border)`, backgroundColor: 'var(--background)' }}>
            <YourBestPathRightNow
              userProfile={userProfile}
              onSeeAvailableCars={handleSeeAvailableCars}
              onPlanForGoal={handlePlanForGoal}
            />
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', padding: '24px', overflowY: 'auto' }}>
              <DealerColumn cars={dealerCars} onPick={handlePickCar} onSelect={setSelectedCar} onCarParsed={handleCarParsed} userProfile={userProfile} initialCount={dealerPool.length} />
              <AuctionDIYColumn
                cars={auctionCars}
                onPick={handlePickCar}
                onSelect={setSelectedCar}
                onCarParsed={handleCarParsed}
                onRequestLiveScrape={handleRequestLiveScrape}
                liveScrapeState={liveScrapeState}
                intakeFilters={intakeFilters}
                userProfile={userProfile}
                initialCount={auctionPool.length}
              />
              <PickNBuildColumn cars={picknbuildCars} onPick={handlePickCar} onSelect={setSelectedCar} userProfile={userProfile} onReferralClick={() => setShowReferralModal(true)} initialCount={picknbuildPool.length} />
              <IndividualColumn cars={individualCars} onPick={handlePickCar} onSelect={setSelectedCar} onCarParsed={handleCarParsed} userProfile={userProfile} initialCount={individualPool.length} />
            </div>
        </main>
      </div>

      {selectedCar && (
        <DetailPanel car={selectedCar} onClose={() => setSelectedCar(null)} onPick={handlePickCar} />
      )}

      {showComparison && (
        <ComparisonModal pickedCars={pickedCars} onClose={() => setShowComparison(false)} />
      )}

      <ReferralModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        referralStats={referralStats}
        onSendInvite={async (email) => {
          const res = await fetch("/api/referrals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          if (!res.ok) {
            const { error } = await res.json().catch(() => ({ error: "Failed to send invite" }));
            throw new Error(error || "Failed to send invite");
          }
          const stats = await res.json();
          setReferralStats({
            invitesSent: stats.invitesSent ?? 0,
            completedReferrals: stats.completedReferrals ?? 0,
            earnedCredits: stats.earnedCredits ?? 0,
            inviteCode: stats.inviteCode,
          });
        }}
      />

      <SellYourCarModal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
      />

      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSignIn={handleSignIn}
      />

      {showPlanPanel && (
        <PlanningPanel userProfile={userProfile} onClose={() => setShowPlanPanel(false)} />
      )}

      {showGapViewModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowGapViewModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--background)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--foreground)' }}>
                See Where You Stand
              </h2>
              <button
                onClick={() => setShowGapViewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--muted-foreground)',
                  padding: 0,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {[
                { id: 'dealer', label: 'Dealer' },
                { id: 'auction', label: 'Auction' },
                { id: 'picknbuild', label: <>pick<span style={{ color: '#dc2626' }}>n</span>build</> },
                { id: 'private', label: 'Private' },
              ].map((path) => (
                <button
                  key={path.id}
                  onClick={() => {
                    setActivePath(path.id);
                    setIsAutoCycling(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: activePath === path.id ? 'var(--accent)' : 'var(--muted)',
                    color: activePath === path.id ? 'white' : 'var(--foreground)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 200ms ease-out',
                    boxShadow: activePath === path.id ? '0 0 12px rgba(220, 38, 38, 0.4)' : 'none',
                  }}
                >
                  {path.label}
                </button>
              ))}
            </div>

            {(activePath === 'dealer' || activePath === 'picknbuild') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted-foreground)', margin: 0, textTransform: 'uppercase' }}>
                  Choose Your Term
                </h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedTerm('cash')}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: selectedTerm === 'cash' ? 'var(--accent)' : 'var(--muted)',
                      color: selectedTerm === 'cash' ? 'white' : 'var(--foreground)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 200ms ease-out',
                    }}
                  >
                    Cash
                  </button>
                  {[1, 2, 3, 4, 5, 6].map((year) => {
                    let isDisabled = false;
                    let tooltipText = '';

                    if (activePath === 'picknbuild') {
                      const testCosts = getPathCosts('picknbuild', year.toString(), selectedCondition);
                      if (testCosts.type === 'picknbuild' && !testCosts.hasCashTerm) {
                        if (!testCosts.meetsMinimum) {
                          isDisabled = true;
                          tooltipText = `${year}y term does not meet $500/month minimum`;
                        }
                      }
                    }

                    return (
                      <button
                        key={year}
                        onClick={() => {
                          if (!isDisabled) {
                            setSelectedTerm(year.toString());
                          }
                        }}
                        title={tooltipText}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: selectedTerm === year.toString() ? '#10b981' : 'var(--muted)',
                          color: selectedTerm === year.toString() ? 'white' : 'var(--foreground)',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          transition: 'all 200ms ease-out',
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        {year}y
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted-foreground)', margin: 0, textTransform: 'uppercase' }}>
                Condition
              </h4>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setSelectedCondition('clean')}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: selectedCondition === 'clean' ? 'var(--accent)' : 'var(--muted)',
                    color: 'var(--foreground)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 200ms ease-out',
                  }}
                >
                  Clean
                </button>
                <button
                  onClick={() => setSelectedCondition('rebuilt')}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: selectedCondition === 'rebuilt' ? 'var(--accent)' : 'var(--muted)',
                    color: 'var(--foreground)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 200ms ease-out',
                  }}
                >
                  Rebuilt
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  What You Can Do Today
                </h3>
                <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pathCosts.type === 'dealer' && (
                    <>
                      {!pathCosts.isCashTerm && (
                        <>
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Down Payment (Estimated)</div>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)' }}>
                              ${Math.round(pathCosts.downPayment ?? 0).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
                        </>
                      )}
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Total Cost (All-in)</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)' }}>
                          ${Math.round(pathCosts.totalCost).toLocaleString()}
                        </div>
                      </div>
                      {!pathCosts.isCashTerm && pathCosts.monthlyPayment && (
                        <>
                          <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
                          <div style={{ paddingTop: '12px' }}>
                            <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Estimated Monthly Payment</div>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent)' }}>
                              ${Math.round(pathCosts.monthlyPayment).toLocaleString()} / month
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {pathCosts.type === 'auction' && (
                    <>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Current Bid</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)' }}>
                          ${Math.round(pathCosts.currentBid).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Estimated Total Cost</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)' }}>
                          ${Math.round(pathCosts.estimatedTotalCost).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--muted-foreground)', marginTop: '4px', fontStyle: 'italic' }}>
                          Final cost depends on damage, parts, and repairs
                        </div>
                      </div>
                    </>
                  )}
                  {pathCosts.type === 'picknbuild' && (
                    <>
                      {!pathCosts.hasCashTerm && (
                        <>
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Down Payment (35% of Total)</div>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)' }}>
                              ${Math.round(pathCosts.downPayment ?? 0).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
                        </>
                      )}
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Total Cost (All-in)</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)' }}>
                          ${Math.round(pathCosts.totalCost).toLocaleString()}
                        </div>
                      </div>
                      {!pathCosts.hasCashTerm && pathCosts.biweeklyPayment && (
                        <>
                          <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
                          <div style={{ paddingTop: '12px' }}>
                            <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Estimated Biweekly Payment</div>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent)' }}>
                              ${Math.round(pathCosts.biweeklyPayment).toLocaleString()} / biweekly
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {pathCosts.type === 'private' && (
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Price (Cash Required)</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)' }}>
                        ${Math.round(pathCosts.priceRequired).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--muted-foreground)', marginTop: '4px', fontStyle: 'italic' }}>
                        You pay this upfront directly to seller
                      </div>
                    </div>
                  )}
                  <div style={{ height: '1px', backgroundColor: 'var(--border)', marginTop: '16px' }} />
                  <div style={{ paddingTop: '16px', fontSize: '10px', color: '#dc2626', fontWeight: '600' }}>
                    {pathReality.barrier}
                  </div>
                </div>
              </div>

              {((pathCosts.type === 'dealer' && ((pathCosts.downPaymentGap ?? 0) > 0 || pathCosts.totalCostGap > 0)) ||
                (pathCosts.type === 'auction' && pathCosts.totalCostGap > 0) ||
                (pathCosts.type === 'picknbuild' && ((pathCosts.downPaymentGap ?? 0) > 0 || pathCosts.totalCostGap > 0)) ||
                (pathCosts.type === 'private' && pathCosts.cashGap > 0)) && (
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    The Gap
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {pathCosts.type === 'dealer' && (
                      <>
                        {!pathCosts.isCashTerm && (pathCosts.downPaymentGap ?? 0) > 0 && (
                          <div
                            style={{
                              padding: '12px',
                              backgroundColor: '#fef2f2',
                              borderRadius: '8px',
                              border: '1px solid #fca5a5',
                            }}
                          >
                            <div style={{ fontSize: '10px', color: '#7f1d1d', fontWeight: '600', marginBottom: '4px' }}>Down Payment Gap</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                              ${Math.round(pathCosts.downPaymentGap ?? 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '9px', color: '#7f1d1d', marginTop: '4px' }}>You need this much more upfront</div>
                          </div>
                        )}
                        {pathCosts.totalCostGap > 0 && (
                          <div
                            style={{
                              padding: '12px',
                              backgroundColor: '#fef2f2',
                              borderRadius: '8px',
                              border: '1px solid #fca5a5',
                            }}
                          >
                            <div style={{ fontSize: '10px', color: '#7f1d1d', fontWeight: '600', marginBottom: '4px' }}>Total Cost Gap</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                              ${Math.round(pathCosts.totalCostGap).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '9px', color: '#7f1d1d', marginTop: '4px' }}>You are this far from total cost goal</div>
                          </div>
                        )}
                      </>
                    )}
                    {pathCosts.type === 'auction' && pathCosts.totalCostGap > 0 && (
                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: '#fef2f2',
                          borderRadius: '8px',
                          border: '1px solid #fca5a5',
                        }}
                      >
                        <div style={{ fontSize: '10px', color: '#7f1d1d', fontWeight: '600', marginBottom: '4px' }}>Estimated Total Cost Gap</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                          ${Math.round(pathCosts.totalCostGap).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '9px', color: '#7f1d1d', marginTop: '4px' }}>Add repairs and transport to bid price</div>
                      </div>
                    )}
                    {pathCosts.type === 'picknbuild' && (
                      <>
                        {!pathCosts.hasCashTerm && (pathCosts.downPaymentGap ?? 0) > 0 && (
                          <div
                            style={{
                              padding: '12px',
                              backgroundColor: '#fef2f2',
                              borderRadius: '8px',
                              border: '1px solid #fca5a5',
                            }}
                          >
                            <div style={{ fontSize: '10px', color: '#7f1d1d', fontWeight: '600', marginBottom: '4px' }}>Down Payment Gap</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                              ${Math.round(pathCosts.downPaymentGap ?? 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '9px', color: '#7f1d1d', marginTop: '4px' }}>You need this much more upfront (35%)</div>
                          </div>
                        )}
                        {pathCosts.totalCostGap > 0 && (
                          <div
                            style={{
                              padding: '12px',
                              backgroundColor: '#fef2f2',
                              borderRadius: '8px',
                              border: '1px solid #fca5a5',
                            }}
                          >
                            <div style={{ fontSize: '10px', color: '#7f1d1d', fontWeight: '600', marginBottom: '4px' }}>Total Cost Gap</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                              ${Math.round(pathCosts.totalCostGap).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '9px', color: '#7f1d1d', marginTop: '4px' }}>You are this far from total cost goal</div>
                          </div>
                        )}
                      </>
                    )}
                    {pathCosts.type === 'private' && pathCosts.cashGap > 0 && (
                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: '#fef2f2',
                          borderRadius: '8px',
                          border: '1px solid #fca5a5',
                        }}
                      >
                        <div style={{ fontSize: '10px', color: '#7f1d1d', fontWeight: '600', marginBottom: '4px' }}>Cash Required Gap</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                          ${Math.round(pathCosts.cashGap).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '9px', color: '#7f1d1d', marginTop: '4px' }}>You need this much more in cash</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>
                  What this path really requires:
                </div>
                <div style={{ fontSize: '11px', color: '#78350f' }}>
                  {pathReality.reality}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  How to Get There
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '4px' }}>
                      Save more
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                      {pathCosts.type === 'dealer' && `Add ~$${Math.round(pathCosts.downPaymentGap ?? 0).toLocaleString()} more for down payment (${Math.ceil((pathCosts.downPaymentGap ?? 0) / 500)}/month)`}
                      {pathCosts.type === 'auction' && `Add ~$${Math.round(pathCosts.totalCostGap).toLocaleString()} for estimated total (${Math.ceil(pathCosts.totalCostGap / 500)}/month)`}
                      {pathCosts.type === 'picknbuild' && `Add ~$${Math.round(pathCosts.downPaymentGap ?? 0).toLocaleString()} for 35% down (${Math.ceil((pathCosts.downPaymentGap ?? 0) / 500)}/month)`}
                      {pathCosts.type === 'private' && `Add ~$${Math.round(pathCosts.cashGap).toLocaleString()} for full cash price (${Math.ceil(pathCosts.cashGap / 500)}/month)`}
                    </div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '4px' }}>
                      Adjust your target
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                      {pathCosts.type === 'dealer' && `Look for vehicles around $${Math.round(userProfile.availableCash * 0.8).toLocaleString()}–$${Math.round(userProfile.availableCash * 2.5).toLocaleString()} price range`}
                      {pathCosts.type === 'auction' && `Look at auctions around $${Math.round(userProfile.availableCash * 0.7).toLocaleString()}–$${Math.round(userProfile.availableCash * 2).toLocaleString()} bid price`}
                      {pathCosts.type === 'picknbuild' && `Look at builds around $${Math.round(userProfile.availableCash * 0.9).toLocaleString()}–$${Math.round(userProfile.availableCash * 2).toLocaleString()} final price`}
                      {pathCosts.type === 'private' && `Look for listings around $${Math.round(userProfile.availableCash * 0.8).toLocaleString()}–$${Math.round(userProfile.availableCash * 1.8).toLocaleString()} price`}
                    </div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '4px' }}>
                      Wait and revisit when ready
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                      Check back in 3–6 months when you&apos;ve saved more
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGapViewModal(false)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px 16px',
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 16px',
            borderRadius: '6px',
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            fontSize: '13px',
            fontWeight: '500',
            zIndex: 1001,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
