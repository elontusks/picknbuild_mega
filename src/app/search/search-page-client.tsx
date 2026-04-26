'use client';

// REBUILD v19 - Force cache clear
// Dealer pricing: $25k base
// Pick & Build pricing: market avg minus condition discount
// Timestamp: 2026-03-24T00:00:00Z
const BUILD_VERSION = 'v12-all-elements-final';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { User } from '@/contracts';
import { Car, PickedCar, GarageGroup, UserProfile } from '@/lib/search-demo/types';
import { ThemeProvider } from '@/components/ThemeProvider';
import TopBar from '@/components/clarity/TopBar';
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
  return (
    <ThemeProvider>
      <SearchPageInner {...props} />
    </ThemeProvider>
  );
}

function SearchPageInner(props: Props) {
  const {
    user,
    initialDealerCars,
    initialAuctionCars,
    initialIndividualCars,
    initialPicknbuildCars,
  } = props;
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
  const [referralStats, setReferralStats] = useState({
    invitesSent: 0,
    completedReferrals: 0,
    earnedCredits: 0,
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    availableCash: 8000,
    creditScore: 650,
    titleType: 'clean',
    matchModeEnabled: false,
  });

  const totalListings =
    initialDealerCars.length +
    initialAuctionCars.length +
    initialIndividualCars.length;

  const filterMatch = useCallback((car: Car) => {
    if (filteredCars.length === 0) return true;
    return filteredCars.some(f => f.id === car.id);
  }, [filteredCars]);

  const dealerCars = useMemo(
    () => initialDealerCars.filter(filterMatch),
    [initialDealerCars, filterMatch],
  );

  const auctionCars = useMemo(
    () => initialAuctionCars.filter(filterMatch),
    [initialAuctionCars, filterMatch],
  );

  const picknbuildCars = useMemo(
    () => initialPicknbuildCars.filter(filterMatch),
    [initialPicknbuildCars, filterMatch],
  );

  const individualCars = useMemo(
    () => initialIndividualCars.filter(filterMatch),
    [initialIndividualCars, filterMatch],
  );

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

  const handlePickCar = useCallback((car: Car) => {
    const pickedCar: PickedCar = {
      ...car,
      pickedAt: new Date(),
    };
    setPickedCars((prev) => [...prev, pickedCar]);
  }, []);

  const handleRemovePickedCar = useCallback((carId: string) => {
    setPickedCars((prev) => prev.filter(car => car.id !== carId));
  }, []);

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

  const getPathCosts = (path: string, term: string = 'cash', condition: 'clean' | 'rebuilt' = 'clean') => {
    let basePrice = 25000;
    const interestRate = 0.065;
    const marketAverage = 27500;

    switch (path) {
      case 'dealer': {
        const dealerPrice = basePrice;

        if (term === 'cash') {
          return {
            type: 'dealer' as const,
            totalCost: dealerPrice,
            totalCostGap: Math.max(0, dealerPrice - userProfile.availableCash),
            isCashTerm: true,
          };
        } else {
          const termYears = parseInt(term);
          const downPaymentPercent = 0.2 - termYears * 0.01;
          const downPayment = dealerPrice * Math.max(0.1, downPaymentPercent);
          const financed = dealerPrice - downPayment;
          const totalInterest = financed * interestRate * termYears;
          const totalCostAllIn = downPayment + financed + totalInterest;
          const monthlyPayment = financed / (termYears * 12);

          return {
            type: 'dealer' as const,
            downPayment,
            totalCost: totalCostAllIn,
            monthlyPayment,
            downPaymentGap: Math.max(0, downPayment - userProfile.availableCash),
            totalCostGap: Math.max(0, totalCostAllIn - userProfile.availableCash),
            isCashTerm: false,
          };
        }
      }
      case 'auction': {
        const currentBid = basePrice;
        const estimatedTotalCost = basePrice + 500 + basePrice * 0.15;
        return {
          type: 'auction' as const,
          currentBid,
          estimatedTotalCost,
          bidGap: Math.max(0, currentBid - userProfile.availableCash),
          totalCostGap: Math.max(0, estimatedTotalCost - userProfile.availableCash),
        };
      }
      case 'picknbuild': {
        const conditionDiscount = condition === 'clean' ? 0.02 : 0.15;
        const picknbuildPrice = marketAverage * (1 - conditionDiscount);

        if (term === 'cash') {
          return {
            type: 'picknbuild' as const,
            totalCost: picknbuildPrice,
            totalCostGap: Math.max(0, picknbuildPrice - userProfile.availableCash),
            hasCashTerm: true,
          };
        } else {
          const termYears = parseInt(term);
          const financed = picknbuildPrice;
          const totalInterest = financed * interestRate * termYears;
          const totalCostAllIn = picknbuildPrice + totalInterest;
          const downPayment = totalCostAllIn * 0.35;
          const biweeklyPayment = (totalCostAllIn - downPayment) / (termYears * 26);
          const monthlyEquivalent = (biweeklyPayment * 26) / 12;
          const meetsMinimum = monthlyEquivalent >= 500;

          return {
            type: 'picknbuild' as const,
            downPayment,
            totalCost: totalCostAllIn,
            biweeklyPayment,
            monthlyEquivalent,
            meetsMinimum,
            downPaymentGap: Math.max(0, downPayment - userProfile.availableCash),
            totalCostGap: Math.max(0, totalCostAllIn - userProfile.availableCash),
            hasCashTerm: false,
          };
        }
      }
      case 'private': {
        const priceRequired = basePrice + basePrice * 0.08;
        return {
          type: 'private' as const,
          priceRequired,
          cashGap: Math.max(0, priceRequired - userProfile.availableCash),
        };
      }
      default: {
        return {
          type: 'default' as const,
          totalCost: basePrice + 800,
          gap: Math.max(0, basePrice + 800 - userProfile.availableCash),
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
      <TopBar
        pickedCount={pickedCars.length}
        onGarageClick={() => setGarageOpen(!garageOpen)}
        garageOpen={garageOpen}
        onReferralClick={() => setShowReferralModal(true)}
        onSellClick={() => setShowSellModal(true)}
        onSignInClick={() => setShowSignInModal(true)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      <MatchModeBar
        userProfile={userProfile}
        userZip={user.zip}
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

          {totalListings === 0 ? (
            <div style={{ padding: '24px' }}>
              <div
                style={{
                  padding: '24px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--muted)',
                  fontSize: '13px',
                  color: 'var(--muted-foreground)',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
                  No listings yet
                </div>
                The persisted listing pool is empty. Boot the scraper sidecar with{' '}
                <code style={{ fontFamily: 'monospace' }}>npm run scraper:dev</code> in another terminal,
                then trigger an ingest cycle:{' '}
                <code style={{ fontFamily: 'monospace' }}>POST /api/scrape</code> or{' '}
                <code style={{ fontFamily: 'monospace' }}>curl -X POST http://localhost:3099/ingest/run</code>.
                Reload this page once it finishes.
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', padding: '24px', overflowY: 'auto' }}>
              <DealerColumn cars={dealerCars} onPick={handlePickCar} onSelect={setSelectedCar} userProfile={userProfile} />
              <AuctionDIYColumn cars={auctionCars} onPick={handlePickCar} onSelect={setSelectedCar} userProfile={userProfile} />
              <PickNBuildColumn cars={picknbuildCars} onPick={handlePickCar} onSelect={setSelectedCar} userProfile={userProfile} onReferralClick={() => setShowReferralModal(true)} />
              <IndividualColumn cars={individualCars} onPick={handlePickCar} onSelect={setSelectedCar} userProfile={userProfile} />
            </div>
          )}
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
                { id: 'picknbuild', label: <>pic<span style={{ color: '#dc2626' }}>k</span>nbuild</> },
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
                    color: selectedCondition === 'clean' ? 'white' : 'var(--foreground)',
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
                    color: selectedCondition === 'rebuilt' ? 'white' : 'var(--foreground)',
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
    </div>
  );
}
