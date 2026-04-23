import { makeFixtureBuildRecord } from "@/contracts";
import { requireUser } from "@/services/team-01-auth";
import { getListing } from "@/services/team-03-supply";
import { loadBuildRecordForUser } from "@/lib/build-records/storage";
import { ConfiguratorClient } from "@/components/configurator/configurator-client";

type Params = { listingId: string };
type SearchParams = { buildId?: string };

export default async function ConfiguratorAnchoredPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const viewer = await requireUser();
  const { listingId } = await params;
  const { buildId } = await searchParams;

  // Same hydration rule as /configurator: a forbidden or missing buildId
  // produces a fresh server-minted seed rather than reusing the caller's
  // chosen id.
  let initialBuild = makeFixtureBuildRecord({
    userId: viewer.id,
    listingId,
  });
  let isPersisted = false;
  if (buildId) {
    const access = await loadBuildRecordForUser({
      buildRecordId: buildId,
      userId: viewer.id,
    });
    if (access.ok) {
      initialBuild = access.record;
      isPersisted = true;
    }
  }

  const listing = await getListing(listingId);

  return (
    <ConfiguratorClient
      initialBuild={initialBuild}
      isPersisted={isPersisted}
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
