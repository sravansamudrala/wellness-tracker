import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSession } from "../services/gymApi";
import type { WorkoutSessionDetail } from "../services/gymApi";

function GymSessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!sessionId) return;
      try {
        const data = await getSession(sessionId);
        if (cancelled) return;
        setSession(data);
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
  }, [sessionId, reloadKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="gym-container">
      <Link to="/gym/history" className="gym-nav-link">
        ← Back to History
      </Link>

      {loading && (
        <p className="status-msg">Loading… (the server may be waking up)</p>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load this workout.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && session && (
        <>
          <h2>{session.name}</h2>
          <p className="status-msg">
            {(session.completed_at ?? session.started_at ?? "").substring(0, 10)}{" "}
            · {session.status}
          </p>

          {session.exercises.length === 0 && (
            <p className="status-msg">No exercises logged.</p>
          )}

          {session.exercises.map((se) => (
            <div key={se.id} className="gym-exercise-card">
              <h3>{se.exercise.name}</h3>
              {se.sets.length === 0 ? (
                <p className="gym-preview-item">No sets logged.</p>
              ) : (
                se.sets.map((s) => (
                  <p key={s.id} className="gym-preview-item">
                    Set {s.set_number}: {s.reps ?? "—"} reps ×{" "}
                    {s.weight_kg ?? "—"} kg
                    {s.is_completed ? " ✓" : ""}
                  </p>
                ))
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default GymSessionDetail;