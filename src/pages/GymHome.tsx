import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "../components/Skeleton";
import { getNextCategory, getStats } from "../services/gymApi";
import type { GymStats, MuscleGroup } from "../services/gymApi";

function GymHome() {
  const [stats, setStats] = useState<GymStats | null>(null);
  const [nextCategory, setNextCategory] = useState<MuscleGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statsData, nextData] = await Promise.all([
          getStats(),
          getNextCategory(),
        ]);
        if (cancelled) return;
        setStats(statsData);
        setNextCategory(nextData.muscle_group);
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
      <h2>🏋️ Gym</h2>

      {loading && (
        <>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={2} />
        </>
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
                🔥 Current Streak:{" "}
                <strong>
                  {stats.current_streak}{" "}
                  {stats.current_streak === 1 ? "day" : "days"}
                </strong>
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

          {nextCategory && (
            <div className="progress-card">
              <h3>Next up</h3>
              <p>
                <strong>{nextCategory.name}</strong>
              </p>
              <br />
              <Link to="/gym/log" className="gym-nav-link">
                ✅ Log it
              </Link>
            </div>
          )}

          <Link to="/gym/log" className="gym-nav-link">
            ＋ Log Workout
          </Link>
          <Link to="/gym/insights" className="gym-nav-link">
            📊 Insights
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
