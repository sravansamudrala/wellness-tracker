import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "../components/Skeleton";
import {
  createExercise,
  getExercises,
  getMuscleGroups,
  quickLog,
} from "../services/gymApi";
import type { Exercise, MuscleGroup } from "../services/gymApi";

// Sections we care about first; anything else follows alphabetically.
const PRIORITY = ["Back", "Chest", "Cardio"];

function GymLog() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newNames, setNewNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [ex, mg] = await Promise.all([getExercises(), getMuscleGroups()]);
        if (cancelled) return;
        setExercises(ex);
        setMuscleGroups(mg);
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

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addExercise = async (muscleGroupId: string) => {
    const name = (newNames[muscleGroupId] ?? "").trim();
    if (!name) return;
    try {
      await createExercise(name, muscleGroupId);
      setNewNames((prev) => ({ ...prev, [muscleGroupId]: "" }));
      setReloadKey((k) => k + 1); // refetch; selections are preserved
    } catch {
      setSaveError(true);
    }
  };

  const save = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    setSaveError(false);
    try {
      await quickLog([...selected]);
      setSaved(true);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  // Sections = muscle groups that have exercises, priority-ordered.
  const sections = muscleGroups
    .map((mg) => ({
      mg,
      items: exercises.filter((e) => e.primary_muscle_group_id === mg.id),
    }))
    .filter((s) => s.items.length > 0)
    .sort((a, b) => {
      const ai = PRIORITY.indexOf(a.mg.name);
      const bi = PRIORITY.indexOf(b.mg.name);
      const ra = ai === -1 ? PRIORITY.length : ai;
      const rb = bi === -1 ? PRIORITY.length : bi;
      return ra - rb || a.mg.name.localeCompare(b.mg.name);
    });

  return (
    <div className="gym-container">
      <h2>📝 Log Workout</h2>

      <Link to="/gym" className="gym-nav-link">
        ← Back to Gym
      </Link>

      {loading && (
        <>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load exercises.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && saved && (
        <div className="progress-card">
          <h3>✅ Saved to today's workout</h3>
          <p>
            Nice work — it's in your history. Anything you tick later today gets
            added to the same workout.
          </p>
          <br />
          <Link to="/gym/history" className="gym-nav-link">
            📜 View History
          </Link>
          <Link to="/gym" className="gym-nav-link">
            🏋️ Back to Gym
          </Link>
        </div>
      )}

      {!loading && !error && !saved && (
        <>
          <p className="status-msg">
            Tick what you did, then save. Add your own exercises anytime.
          </p>

          {sections.map((section, i) => (
            <details
              key={section.mg.id}
              open={i < PRIORITY.length}
              className="gym-log-section"
            >
              <summary>
                {section.mg.image_url && (
                  <img
                    src={section.mg.image_url}
                    alt=""
                    className="gym-log-section-icon"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                {section.mg.name}
                <span className="gym-log-count">
                  {section.items.filter((e) => selected.has(e.id)).length ||
                    ""}
                </span>
              </summary>

              <ul>
                {section.items.map((ex) => (
                  <li key={ex.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selected.has(ex.id)}
                        onChange={() => toggle(ex.id)}
                      />
                      {ex.name}
                    </label>
                  </li>
                ))}
              </ul>

              <div className="gym-add-row">
                <input
                  type="text"
                  placeholder="Add an exercise…"
                  value={newNames[section.mg.id] ?? ""}
                  onChange={(e) =>
                    setNewNames((prev) => ({
                      ...prev,
                      [section.mg.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addExercise(section.mg.id);
                  }}
                />
                <button
                  className="gym-ghost-btn"
                  onClick={() => addExercise(section.mg.id)}
                >
                  ＋ Add
                </button>
              </div>
            </details>
          ))}

          {saveError && (
            <p className="status-error">Something went wrong — try again.</p>
          )}

          <button
            className="gym-btn-success"
            onClick={save}
            disabled={saving || selected.size === 0}
          >
            {saving
              ? "Saving…"
              : `✅ Save Workout${selected.size ? ` (${selected.size})` : ""}`}
          </button>
        </>
      )}
    </div>
  );
}

export default GymLog;
