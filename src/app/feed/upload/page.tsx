import Link from "next/link";
import { requireUser } from "@/services/team-01-auth";
import { UserVehicleUploadForm } from "@/components/feed/vehicle-upload-form";

export const dynamic = "force-dynamic";

export default async function FeedUploadPage() {
  await requireUser();
  return (
    <main
      data-testid="feed-upload-page"
      className="mx-auto flex max-w-2xl flex-col gap-4 p-4"
    >
      <Link
        href="/feed"
        className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← Back to feed
      </Link>
      <UserVehicleUploadForm />
    </main>
  );
}
