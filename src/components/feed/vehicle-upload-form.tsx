"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitVehicleUpload } from "@/app/feed/actions";
import { MediaUploadInterface } from "./media-upload";

type TitleStatus = "clean" | "rebuilt" | "unknown";

// User Vehicle Upload Form. Form UI owned by Team 16; persistence goes
// through Team 3's uploadUserListing via the submitVehicleUpload action.
// Optional companion feed post is spawned server-side when feedBody is
// present.
export function UserVehicleUploadForm() {
  const router = useRouter();
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [mileage, setMileage] = useState("");
  const [price, setPrice] = useState("");
  const [vin, setVin] = useState("");
  const [titleStatus, setTitleStatus] = useState<TitleStatus>("clean");
  const [locationZip, setLocationZip] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [feedBody, setFeedBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    listingId: string;
    postId?: string;
    postWarning?: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setError(null);
    setSuccess(null);
    const yearNum = Number(year);
    // Number("") === 0, so we need the trim() check — Number.isFinite(0)
    // is true and would let an empty input slip through.
    if (year.trim().length === 0 || !Number.isFinite(yearNum)) {
      setError("Year is required.");
      return;
    }
    startTransition(async () => {
      const result = await submitVehicleUpload({
        year: yearNum,
        make,
        model,
        ...(trim ? { trim } : {}),
        ...(mileage ? { mileage: Number(mileage) } : {}),
        titleStatus,
        ...(price ? { price: Number(price) } : {}),
        ...(vin ? { vin } : {}),
        photos,
        ...(locationZip ? { locationZip } : {}),
        ...(feedBody.trim() ? { feedBody } : {}),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const success: {
        listingId: string;
        postId?: string;
        postWarning?: string;
      } = {
        listingId: result.listingId,
      };
      if (result.postId) success.postId = result.postId;
      if (result.postWarning) success.postWarning = result.postWarning;
      setSuccess(success);
      setYear("");
      setMake("");
      setModel("");
      setTrim("");
      setMileage("");
      setPrice("");
      setVin("");
      setLocationZip("");
      setPhotos([]);
      setFeedBody("");
      router.refresh();
    });
  };

  return (
    <form
      data-testid="vehicle-upload-form"
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-sm-800-950"
    >
      <h2 className="text-sm font-semibold">Post a vehicle for sale</h2>

      <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
        <label className="flex flex-col gap-1">
          Year
          <input
            required
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1-800-950"
          />
        </label>
        <label className="flex flex-col gap-1">
          Make
          <input
            required
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1-800-950"
          />
        </label>
        <label className="flex flex-col gap-1">
          Model
          <input
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1-800-950"
          />
        </label>
        <label className="flex flex-col gap-1">
          Trim
          <input
            value={trim}
            onChange={(e) => setTrim(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1-800-950"
          />
        </label>
        <label className="flex flex-col gap-1">
          Mileage
          <input
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1-800-950"
          />
        </label>
        <label className="flex flex-col gap-1">
          Ask price
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1-800-950"
          />
        </label>
        <label className="flex flex-col gap-1">
          VIN
          <input
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1-800-950"
          />
        </label>
        <label className="flex flex-col gap-1">
          Title
          <select
            value={titleStatus}
            onChange={(e) => setTitleStatus(e.target.value as TitleStatus)}
            className="rounded-md border border-border bg-background px-2 py-1-800-950"
          >
            <option value="clean">clean</option>
            <option value="rebuilt">rebuilt</option>
            <option value="unknown">unknown</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Location ZIP
          <input
            value={locationZip}
            onChange={(e) => setLocationZip(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1-800-950"
          />
        </label>
      </div>

      <MediaUploadInterface
        testId="vehicle-upload-media"
        refs={photos}
        onChange={setPhotos}
      />

      <label className="flex flex-col gap-1 text-xs">
        <span>Optional companion feed post</span>
        <textarea
          value={feedBody}
          onChange={(e) => setFeedBody(e.target.value)}
          placeholder="Tell the community about this car — leave blank to skip the feed post."
          rows={2}
          className="rounded-md border border-border bg-background px-2 py-1-800-950"
        />
      </label>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          data-testid="vehicle-upload-submit"
          disabled={pending}
          className="rounded-md bg-muted px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40-100"
        >
          {pending ? "Uploading..." : "Upload vehicle"}
        </button>
        {error ? (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        ) : null}
        {success ? (
          <div className="flex flex-col items-end gap-1 text-xs">
            <p
              role="status"
              data-testid="vehicle-upload-success"
              className="text-emerald-700 dark:text-emerald-300"
            >
              Listing {success.listingId} created
              {success.postId ? ` · Feed post ${success.postId}` : ""}.
            </p>
            {success.postWarning ? (
              <p
                role="status"
                data-testid="vehicle-upload-post-warning"
                className="text-amber-700 dark:text-amber-300"
              >
                Companion feed post was not created: {success.postWarning}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
