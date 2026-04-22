import { makeFixtureBuildRecord } from "@/contracts";
import { requireUser } from "@/services/team-01-auth";
import { getListing } from "@/services/team-03-supply";
import {
  getBuildRecord,
  loadBuildRecordForUser,
} from "@/lib/build-records/storage";
import { ConfiguratorClient } from "@/components/configurator/configurator-client";

type SearchParams = {
  listingId?: string;
  buildId?: string;
};

export default async function ConfiguratorSpecPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const viewer = await requireUser();
  const params = await searchParams;

  // Resolve which BuildRecord to hydrate. Priority: explicit buildId in the
  // URL (Team 5's path card forwards one) -> any existing record for the
  // listingId+user combo -> a new blank seed. Ownership is enforced before
  // the existing record is surfaced to the client.
  let initialBuild = makeFixtureBuildRecord({
    userId: viewer.id,
    ...(params.listingId ? { listingId: params.listingId } : {}),
  });
  if (params.buildId) {
    const access = await loadBuildRecordForUser({
      buildRecordId: params.buildId,
      userId: viewer.id,
    });
    if (access.ok) initialBuild = access.record;
    else {
      // Fall through to a fresh seed; don't leak the forbidden/not-found
      // status here — client would just see a blank configurator.
      const existing = await getBuildRecord(params.buildId);
      if (!existing) {
        initialBuild = {
          ...initialBuild,
          id: params.buildId,
        };
      }
    }
  }

  const listing = params.listingId
    ? await getListing(params.listingId)
    : null;

  return (
    <ConfiguratorClient
      initialBuild={initialBuild}
      {...(listing ? { listing } : {})}
      viewer={{
        ...(viewer.creditScore !== undefined
          ? { creditScore: viewer.creditScore }
          : {}),
        ...(viewer.noCredit !== undefined
          ? { noCredit: viewer.noCredit }
          : {}),
      }}
    />
  );
}
