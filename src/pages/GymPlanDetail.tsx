import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SkeletonCard } from "../components/Skeleton";
import { activatePlan, getPlan } from "../services/gymApi";
import type { WorkoutPlanDetail } from "../services/gymApi";

function GymPlanDetail() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<WorkoutPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!planId) return;
      try {
        const data = await getPlan(planId);
        if (cancelled) return;
        setPlan(data);
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
  }, [planId, reloadKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  const handleActivate = async () => {
    if (!planId) return;
    setActivating(true);
    setActivateError(false);
    try {
      await activatePlan(planId);
      navigate("/gym");
    } catch {
      setActivateError(true);
      setActivating(false);
    }
  };

  return (
    <div className="gym-container">
      <Link to="/gym/plans" className="gym-nav-link">
        ← Back to Plans
      </Link>

      {loading && (
        <>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load this plan.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && plan && (
        <>
          <h2>{plan.name}</h2>
          {plan.description && (
            <p className="status-msg">{plan.description}</p>
          )}

          {plan.days.map((day) => (
            <div key={day.id} className="gym-exercise-card">
              <h3>{day.name}</h3>
              {day.exercises.map((pe) => (
                <p key={pe.id} className="gym-preview-item">
                  {pe.exercise.name}
                  {pe.target_sets && pe.target_reps
                    ? ` — ${pe.target_sets} × ${pe.target_reps}`
                    : ""}
                </p>
              ))}
            </div>
          ))}

          <button onClick={handleActivate} disabled={activating}>
            {activating ? "Activating…" : "✅ Activate this Plan"}
          </button>
          {activateError && (
            <p className="status-error">Couldn't activate — try again.</p>
          )}
        </>
      )}
    </div>
  );
}

export default GymPlanDetail;