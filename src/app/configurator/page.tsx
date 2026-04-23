import { makeFixtureBuildRecord } from "@/contracts";
import { requireUser } from "@/services/team-01-auth";
import { getListing } from "@/services/team-03-supply";
import { loadBuildRecordForUser } from "@/lib/build-records/storage";
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
  // URL that resolves to a row owned by viewer -> fresh unsaved seed.
  // A forbidden or not-found id falls through to a server-minted fresh seed;
  // we never echo the caller's id back into the client state because the
  // save path rejects unknown/foreign ids anyway.
  let initialBuild = makeFixtureBuildRecord({
    userId: viewer.id,
    ...(params.listingId ? { listingId: params.listingId } : {}),
  });
  let isPersisted = false;
  if (params.buildId) {
    const access = await loadBuildRecordForUser({
      buildRecordId: params.buildId,
      userId: viewer.id,
    });
    if (access.ok) {
      initialBuild = access.record;
      isPersisted = true;
    }
  }

  const listing = params.listingId
    ? await getListing(params.listingId)
    : null;

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
