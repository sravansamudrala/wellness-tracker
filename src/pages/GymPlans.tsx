import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "../components/Skeleton";
import { getActive, getPlans } from "../services/gymApi";
import type { WorkoutPlan } from "../services/gymApi";

function GymPlans() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [plansData, activeData] = await Promise.all([
          getPlans(),
          getActive(),
        ]);
        if (cancelled) return;
        setPlans(plansData);
        setActivePlanId(activeData.active_plan?.id ?? null);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="gym-container">
      <h2>📋 Workout Plans</h2>

      <Link to="/gym" className="gym-nav-link">
        ← Back to Gym
      </Link>

      {loading && (
        <>
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load plans.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && plans.length === 0 && (
        <p className="status-msg">No plans yet.</p>
      )}

      {!loading && !error &&
        plans.map((plan) => (
          <Link
            key={plan.id}
            to={`/gym/plans/${plan.id}`}
            className="gym-card-link"
          >
            <div className="gym-card-title">
              {plan.name}
              {plan.id === activePlanId && (
                <span className="gym-badge">Active</span>
              )}
            </div>
            {plan.goal && <div className="gym-card-sub">{plan.goal}</div>}
          </Link>
        ))}
    </div>
  );
}

export default GymPlans;