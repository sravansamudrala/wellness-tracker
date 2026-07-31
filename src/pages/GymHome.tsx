import { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard";
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
            <div className="dash-grid">
              <div className="dash-card">
                <div className="dash-card-head">
                  <span className="dash-card-icon">🔥</span>
                  <span className="dash-card-name">Streak</span>
                </div>
                <div className="dash-card-body">
                  <span className="dash-value">
                    {stats.current_streak}{" "}
                    {stats.current_streak === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>

              <div className="dash-card">
                <div className="dash-card-head">
                  <span className="dash-card-icon">📅</span>
                  <span className="dash-card-name">This Week</span>
                </div>
                <div className="dash-card-body">
                  <span className="dash-value">
                    {stats.this_week} workout
                    {stats.this_week === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="dash-card dash-card-wide">
                <div className="dash-card-head">
                  <span className="dash-card-icon">🏆</span>
                  <span className="dash-card-name">Total Workouts</span>
                </div>
                <div className="dash-card-body">
                  <span className="dash-value">{stats.total_workouts}</span>
                  <span className="dash-muted">{stats.message}</span>
                </div>
              </div>
            </div>
          )}

          {nextCategory && (
            <div className="dash-grid">
              <DashboardCard to="/gym/log" icon="🎯" title="Next Up" wide>
                <span className="dash-value">{nextCategory.name}</span>
                <span className="dash-muted">Tap to log it</span>
              </DashboardCard>
            </div>
          )}

          <div className="dash-grid">
            <DashboardCard to="/gym/log" icon="＋" title="Log Workout" />
            <DashboardCard to="/gym/insights" icon="📊" title="Insights" />
            <DashboardCard to="/gym/history" icon="📜" title="History" wide />
          </div>
        </>
      )}
    </div>
  );
}

export default GymHome;
