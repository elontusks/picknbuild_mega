// @ts-nocheck — demo lift; strict TS errors to fix when wiring real services
'use client';

import DealerColumn from './columns/DealerColumn';
import AuctionDIYColumn from './columns/AuctionDIYColumn';
import PickAndBuildColumn from './columns/PickAndBuildColumn';
import IndividualColumn from './columns/IndividualColumn';

interface ComparisonGridProps {
  searchQuery: string;
}

export default function ComparisonGrid({ searchQuery }: ComparisonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Dealer Column */}
      <DealerColumn searchQuery={searchQuery} />

      {/* Auction DIY Column */}
      <AuctionDIYColumn searchQuery={searchQuery} />

      {/* Pick & Build Column (Highlighted) */}
      <PickAndBuildColumn searchQuery={searchQuery} />

      {/* Individual Column */}
      <IndividualColumn searchQuery={searchQuery} />
    </div>
  );
}