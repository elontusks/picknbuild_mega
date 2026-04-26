type PhotoGalleryProps = {
  photos: string[];
  title: string;
};

export function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <div
        data-testid="photo-gallery-empty"
        className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-border bg-background text-sm text-muted-foreground-700-900"
      >
        No photos yet
      </div>
    );
  }
  const [lead, ...rest] = photos;
  return (
    <div data-testid="photo-gallery" className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_1fr]">
      <div className="overflow-hidden rounded-xl bg-muted-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={lead}
          alt={`${title} — primary photo`}
          className="h-full w-full object-cover"
        />
      </div>
      {rest.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {rest.slice(0, 4).map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="overflow-hidden rounded-lg bg-muted-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${title} — photo ${i + 2}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
