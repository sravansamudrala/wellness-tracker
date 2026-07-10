import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface DashboardCardProps {
  to: string;
  icon: string;
  title: string;
  loading?: boolean;
  wide?: boolean;
  children?: ReactNode;
}

/**
 * A single modular summary tile for the Dashboard. Shows a shimmer skeleton
 * while its data loads, then renders `children`. `wide` makes it span the grid.
 */
function DashboardCard({
  to,
  icon,
  title,
  loading = false,
  wide = false,
  children,
}: DashboardCardProps) {
  return (
    <Link to={to} className={`dash-card${wide ? " dash-card-wide" : ""}`}>
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
