interface SkeletonCardProps {
  lines?: number;
}

/** A card-shaped shimmer placeholder shown while a page's data loads. */
export function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className={`skeleton skeleton-line${
            i === lines - 1 ? " skeleton-short" : ""
          }`}
        />
      ))}
    </div>
  );
}
