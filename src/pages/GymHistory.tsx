import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "../components/Skeleton";
import { getHistory } from "../services/gymApi";
import type { WorkoutSession } from "../services/gymApi";

function formatDate(session: WorkoutSession): string {
  const raw = session.completed_at ?? session.started_at;
  return raw ? raw.substring(0, 10) : "";
}

function GymHistory() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getHistory();
        if (cancelled) return;
        setSessions(data);
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
      <h2>📜 Workout History</h2>

      <Link to="/gym" className="gym-nav-link">
        ← Back to Gym
      </Link>

      {loading && (
        <>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load history.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <p className="status-msg">No workouts logged yet.</p>
      )}

      {!loading && !error &&
        sessions.map((session) => (
          <Link
            key={session.id}
            to={`/gym/history/${session.id}`}
            className="gym-card-link"
          >
            <div className="gym-card-title">
              {session.name}
              {session.status !== "completed" && (
                <span className="gym-badge">{session.status}</span>
              )}
            </div>
            <div className="gym-card-sub">{formatDate(session)}</div>
          </Link>
        ))}
    </div>
  );
}

export default GymHistory;