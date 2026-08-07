import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";

interface DashboardCardProps {
  to: string;
  icon: string;
  title: string;
  color?: string;
  loading?: boolean;
  wide?: boolean;
  children?: ReactNode;
}

/**
 * A single modular summary tile for the Dashboard. Shows a shimmer skeleton
 * while its data loads, then renders `children`. `wide` makes it span the grid.
 * `color` sets this card's accent (icon bubble + tint + glow) via the
 * --card-accent CSS var; cards that omit it fall back to the global accent
 * (see the CSS var(--card-accent, var(--accent)) fallback in index.css).
 */
function DashboardCard({
  to,
  icon,
  title,
  color,
  loading = false,
  wide = false,
  children,
}: DashboardCardProps) {
  return (
    <Link
      to={to}
      className={`dash-card${wide ? " dash-card-wide" : ""}`}
      style={color ? ({ "--card-accent": color } as CSSProperties) : undefined}
    >
      <div className="dash-card-head">
        <span className="dash-card-icon">{icon}</span>
        <span className="dash-card-name">{title}</span>
      </div>

      {loading ? (
        <div className="dash-skeleton-wrap">
          <span className="dash-skeleton" />
          <span className="dash-skeleton dash-skeleton-short" />
        </div>
      ) : (
        <div className="dash-card-body">{children}</div>
      )}
    </Link>
  );
}

export default DashboardCard;
