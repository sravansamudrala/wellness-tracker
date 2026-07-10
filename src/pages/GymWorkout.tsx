import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  abandonSession,
  completeSession,
  getCurrentSession,
  logSets,
} from "../services/gymApi";
import type { LogSetsBody } from "../services/gymApi";

interface EditableSet {
  key: string;
  reps: string;
  weightKg: string;
  isCompleted: boolean;
}

interface EditableExercise {
  id: string; // session_exercise_id
  name: string;
  sets: EditableSet[];
}

function GymWorkout() {
  const navigate = useNavigate();
  const keyCounter = useRef(0);
  const makeKey = () => `set-${keyCounter.current++}`;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [exercises, setExercises] = useState<EditableExercise[]>([]);
  const [hasSession, setHasSession] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const session = await getCurrentSession();
        if (cancelled) return;

        if (!session) {
          setHasSession(false);
          setError(false);
          return;
        }

        setSessionId(session.id);
        setSessionName(session.name);
        setExercises(
          session.exercises.map((se) => ({
            id: se.id,
            name: se.exercise.name,
            sets: se.sets.map((s) => ({
              key: makeKey(),
              reps: s.reps != null ? String(s.reps) : "",
              weightKg: s.weight_kg != null ? String(s.weight_kg) : "",
              isCompleted: s.is_completed,
            })),
          }))
        );
        setHasSession(true);
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

  const updateSet = (
    exId: string,
    key: string,
    field: "reps" | "weightKg" | "isCompleted",
    value: string | boolean
  ) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id !== exId
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s) =>
                s.key !== key ? s : { ...s, [field]: value }
              ),
            }
      )
    );
  };

  const addSet = (exId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id !== exId
          ? ex
          : {
              ...ex,
              sets: [
                ...ex.sets,
                { key: makeKey(), reps: "", weightKg: "", isCompleted: false },
              ],
            }
      )
    );
  };

  const removeSet = (exId: string, key: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id !== exId
          ? ex
          : { ...ex, sets: ex.sets.filter((s) => s.key !== key) }
      )
    );
  };

  const buildPayload = (): LogSetsBody => ({
    exercises: exercises.map((ex) => ({
      session_exercise_id: ex.id,
      sets: ex.sets.map((s, i) => ({
        set_number: i + 1,
        reps: s.reps === "" ? null : Number(s.reps),
        weight_kg: s.weightKg === "" ? null : Number(s.weightKg),
        is_completed: s.isCompleted,
      })),
    })),
  });

  const saveProgress = async () => {
    if (!sessionId) return;
    setSaving(true);
    setSaveError(false);
    try {
      await logSets(sessionId, buildPayload());
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const completeWorkout = async () => {
    if (!sessionId) return;
    setCompleting(true);
    setSaveError(false);
    try {
      await logSets(sessionId, buildPayload());
      await completeSession(sessionId);
      navigate("/gym");
    } catch {
      setSaveError(true);
      setCompleting(false);
    }
  };

  const handleAbandon = async () => {
    if (!sessionId) return;
    if (!confirm("Abandon this workout? Logged sets are kept in history.")) {
      return;
    }
    try {
      await abandonSession(sessionId);
      navigate("/gym");
    } catch {
      setSaveError(true);
    }
  };

  return (
    <div className="gym-container">
      <h2>🏋️ {sessionName || "Workout"}</h2>

      {loading && (
        <p className="status-msg">Loading… (the server may be waking up)</p>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load your workout.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && !hasSession && (
        <div className="status-error">
          <p>No workout in progress.</p>
          <Link to="/gym" className="gym-nav-link">
            ← Back to Gym
          </Link>
        </div>
      )}

      {!loading && !error && hasSession && (
        <>
          {exercises.map((ex) => (
            <div key={ex.id} className="gym-exercise-card">
              <h3>{ex.name}</h3>

              <div className="gym-set-head">
                <span>Set</span>
                <span>Reps</span>
                <span>Kg</span>
                <span>Done</span>
                <span></span>
              </div>

              {ex.sets.map((s, i) => (
                <div key={s.key} className="gym-set-row">
                  <span className="gym-set-num">{i + 1}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.reps}
                    placeholder="0"
                    onChange={(e) =>
                      updateSet(ex.id, s.key, "reps", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={s.weightKg}
                    placeholder="0"
                    onChange={(e) =>
                      updateSet(ex.id, s.key, "weightKg", e.target.value)
                    }
                  />
                  <input
                    type="checkbox"
                    checked={s.isCompleted}
                    onChange={(e) =>
                      updateSet(ex.id, s.key, "isCompleted", e.target.checked)
                    }
                  />
                  <button
                    type="button"
                    className="gym-remove-btn"
                    onClick={() => removeSet(ex.id, s.key)}
                    aria-label="Remove set"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="gym-ghost-btn"
                onClick={() => addSet(ex.id)}
              >
                + Add set
              </button>
            </div>
          ))}

          {saveError && (
            <p className="status-error">
              Couldn't save — check your connection and try again.
            </p>
          )}

          <button onClick={saveProgress} disabled={saving || completing}>
            {saving ? "Saving…" : "💾 Save Progress"}
          </button>
          <br />
          <br />
          <button onClick={completeWorkout} disabled={completing}>
            {completing ? "Finishing…" : "✅ Complete Workout"}
          </button>
          <br />
          <br />
          <button
            className="gym-danger-btn"
            onClick={handleAbandon}
            disabled={completing}
          >
            Abandon
          </button>
        </>
      )}
    </div>
  );
}

export default GymWorkout;