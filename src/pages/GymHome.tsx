import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getActive,
  getCurrentSession,
  getPlan,
  getStats,
  startSession,
} from "../services/gymApi";
import type {
  ActiveWorkout,
  GymStats,
  PlanDay,
  WorkoutSessionDetail,
} from "../services/gymApi";

function GymHome() {
  const navigate = useNavigate();

  const [active, setActive] = useState<ActiveWorkout | null>(null);
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [current, setCurrent] = useState<WorkoutSessionDetail | null>(null);
  const [stats, setStats] = useState<GymStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [activeData, currentData] = await Promise.all([
          getActive(),
          getCurrentSession(),
        ]);

        // Fetch the active plan's full day list for the day picker.
        let days: PlanDay[] = [];
        if (activeData.active_plan) {
          const detail = await getPlan(activeData.active_plan.id);
          days = detail.days;
        }

        if (cancelled) return;
        setActive(activeData);
        setCurrent(currentData);
        setPlanDays(days);
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

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const data = await getStats();
        if (!cancelled) setStats(data);
      } catch {
        // Stats are non-critical — leave them hidden if the request fails.
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  const handleStart = async (planDayId?: string) => {
    setStarting(true);
    setStartError(false);
    try {
      await startSession(planDayId ? { plan_day_id: planDayId } : {});
      navigate("/gym/workout");
    } catch {
      setStartError(true);
      setStarting(false);
    }
  };

  const nextDayId = active?.next_day?.id ?? null;

  return (
    <div className="gym-container">
      <h2>🏋️ Gym</h2>

      {loading && (
        <p className="status-msg">Loading… (the server may be waking up)</p>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load your gym data.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {stats && stats.total_workouts > 0 && (
            <div className="progress-card">
              <h3>📊 Your Progress</h3>
              <p>{stats.message}</p>
              <p>
                🔥 Current Streak: <strong>{stats.current_streak} days</strong>
              </p>
              <p>
                📅 This Week: <strong>{stats.this_week}</strong> workout
                {stats.this_week === 1 ? "" : "s"}
              </p>
              <p>
                🏆 Total Workouts: <strong>{stats.total_workouts}</strong>
              </p>
            </div>
          )}

          {current ? (
            <div className="progress-card">
              <h3>Workout in progress</h3>
              <p>
                You're partway through <strong>{current.name}</strong>.
              </p>
              <br />
              <button onClick={() => navigate("/gym/workout")}>
                ▶️ Resume Workout
              </button>
            </div>
          ) : active && active.active_plan && active.next_day ? (
            <>
              <div className="progress-card">
                <h3>Next Workout</h3>
                <p>
                  <strong>{active.next_day.name}</strong> ·{" "}
                  {active.active_plan.name}
                </p>
                <div className="gym-preview">
                  {active.next_day.exercises.map((pe) => (
                    <p key={pe.id} className="gym-preview-item">
                      {pe.exercise.name}
                      {pe.target_sets && pe.target_reps
                        ? ` — ${pe.target_sets} × ${pe.target_reps}`
                        : ""}
                    </p>
                  ))}
                </div>
                <br />
                <button onClick={() => handleStart()} disabled={starting}>
                  {starting ? "Starting…" : "🏁 Start Workout"}
                </button>
                {startError && (
                  <p className="status-error">
                    Couldn't start the workout — try again.
                  </p>
                )}
              </div>

              {planDays.length > 1 && (
                <>
                  <h3>Train a different day</h3>
                  {planDays.map((day) => (
                    <button
                      key={day.id}
                      className="gym-day-btn"
                      disabled={starting}
                      onClick={() => handleStart(day.id)}
                    >
                      <span>{day.name}</span>
                      {day.id === nextDayId && (
                        <span className="gym-badge">Next</span>
                      )}
                    </button>
                  ))}
                </>
              )}
            </>
          ) : (
            <div className="progress-card">
              <h3>No active plan</h3>
              <p>Pick a workout plan to get started.</p>
              <br />
              <button onClick={() => navigate("/gym/plans")}>
                Choose a Plan
              </button>
            </div>
          )}

          <Link to="/gym/plans" className="gym-nav-link">
            📋 Workout Plans
          </Link>
          <Link to="/gym/history" className="gym-nav-link">
            📜 Workout History
          </Link>
        </>
      )}
    </div>
  );
}

export default GymHome;
