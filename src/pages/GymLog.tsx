import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "../components/Skeleton";
import {
  createExercise,
  deleteExercise,
  getExercises,
  getMuscleGroups,
  getNextCategory,
  getState,
  quickLog,
  updateExercise,
  updateState,
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

  // Which muscle group to silently pre-expand (the rotation's "next up").
  const [nextCategoryId, setNextCategoryId] = useState<string | null>(null);

  // Rotation order editor.
  const [unit, setUnit] = useState("kg");
  const [rotationOrder, setRotationOrder] = useState<string[]>([]);
  const [rotationSaving, setRotationSaving] = useState(false);
  const [rotationSaved, setRotationSaved] = useState(false);

  // Inline rename / delete, tucked behind a single "⋮" toggle per exercise.
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [ex, mg, next, state] = await Promise.all([
          getExercises(),
          getMuscleGroups(),
          getNextCategory(),
          getState(),
        ]);
        if (cancelled) return;
        setExercises(ex);
        setMuscleGroups(mg);
        setNextCategoryId(next.muscle_group?.id ?? null);
        setUnit(state.unit);
        setRotationOrder(state.rotation_order);
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

  const toggleMenu = (exerciseId: string) => {
    setMenuOpenId((prev) => (prev === exerciseId ? null : exerciseId));
  };

  const startEdit = (ex: Exercise) => {
    setActionError(null);
    setMenuOpenId(null);
    setEditingExerciseId(ex.id);
    setEditingName(ex.name);
  };

  const cancelEdit = () => {
    setEditingExerciseId(null);
    setEditingName("");
  };

  const saveEdit = async (exerciseId: string) => {
    const name = editingName.trim();
    if (!name) return;
    try {
      await updateExercise(exerciseId, name);
      cancelEdit();
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.detail ?? "Couldn't rename that exercise."
      );
    }
  };

  const handleDelete = async (ex: Exercise) => {
    setActionError(null);
    setMenuOpenId(null);
    if (!window.confirm(`Delete "${ex.name}"?`)) return;
    try {
      await deleteExercise(ex.id);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.detail ?? "Couldn't delete that exercise."
      );
    }
  };

  const moveRotation = (index: number, direction: -1 | 1) => {
    setRotationOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setRotationSaved(false);
  };

  const saveRotation = async () => {
    setRotationSaving(true);
    try {
      await updateState(unit, rotationOrder);
      setRotationSaved(true);
    } catch {
      setActionError("Couldn't save the rotation order.");
    } finally {
      setRotationSaving(false);
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

          <details className="gym-log-section">
            <summary>⚙️ Rotation order</summary>
            <ul>
              {rotationOrder.map((name, i) => (
                <li key={name} className="gym-log-item">
                  <label>{name}</label>
                  <button
                    className="gym-icon-btn"
                    disabled={i === 0}
                    onClick={() => moveRotation(i, -1)}
                    aria-label={`Move ${name} up`}
                  >
                    ⬆️
                  </button>
                  <button
                    className="gym-icon-btn"
                    disabled={i === rotationOrder.length - 1}
                    onClick={() => moveRotation(i, 1)}
                    aria-label={`Move ${name} down`}
                  >
                    ⬇️
                  </button>
                </li>
              ))}
            </ul>
            <button
              className="gym-ghost-btn"
              onClick={saveRotation}
              disabled={rotationSaving}
            >
              {rotationSaving ? "Saving…" : rotationSaved ? "✅ Saved" : "Save order"}
            </button>
          </details>

          {actionError && <p className="status-error">{actionError}</p>}

          {sections.map((section) => (
            <details
              key={section.mg.id}
              open={section.mg.id === nextCategoryId}
              className="gym-log-section"
            >
              <summary>
                {section.mg.image_url && (
                  <a
                    href={section.mg.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={section.mg.image_url}
                      alt={`${section.mg.name} — open full image`}
                      className="gym-log-section-icon"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </a>
                )}
                {section.mg.name}
                <span className="gym-log-count">
                  {section.items.filter((e) => selected.has(e.id)).length ||
                    ""}
                </span>
              </summary>

              <ul>
                {section.items.map((ex) => (
                  <li key={ex.id} className="gym-log-item">
                    {editingExerciseId === ex.id ? (
                      <div className="gym-edit-row">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(ex.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <button
                          className="gym-ghost-btn"
                          onClick={() => saveEdit(ex.id)}
                        >
                          Save
                        </button>
                        <button className="gym-ghost-btn" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    ) : menuOpenId === ex.id ? (
                      <>
                        <label>{ex.name}</label>
                        <button
                          className="gym-icon-btn"
                          onClick={() => startEdit(ex)}
                          aria-label={`Edit ${ex.name}`}
                        >
                          ✏️
                        </button>
                        <button
                          className="gym-icon-btn"
                          onClick={() => handleDelete(ex)}
                          aria-label={`Delete ${ex.name}`}
                        >
                          🗑️
                        </button>
                        <button
                          className="gym-icon-btn"
                          onClick={() => toggleMenu(ex.id)}
                          aria-label="Close menu"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <label>
                          <input
                            type="checkbox"
                            checked={selected.has(ex.id)}
                            onChange={() => toggle(ex.id)}
                          />
                          {ex.name}
                        </label>
                        <button
                          className="gym-icon-btn"
                          onClick={() => toggleMenu(ex.id)}
                          aria-label={`More options for ${ex.name}`}
                        >
                          ⋮
                        </button>
                      </>
                    )}
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
