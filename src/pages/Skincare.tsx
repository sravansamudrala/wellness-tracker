import { useState, useEffect } from "react";
import { SkeletonCard } from "../components/Skeleton";
import {
  getToday,
  updateToday,
  getHabits,
  upsertHabits,
} from "../services/skincareApi";
import type { SkincareHabitCompletion, SkincareHabit } from "../services/skincareApi";
import { getStats } from "../services/skincareStatsApi";
import type { SkincareStats } from "../services/skincareStatsApi";
import { getHistory } from "../services/skincareHistoryApi";
import type { SkincareHistoryItem } from "../services/skincareHistoryApi";

interface HabitDraft {
  tempKey: string;
  id?: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

function Skincare() {
  const [habits, setHabits] = useState<SkincareHabitCompletion[]>([]);
  const [stats, setStats] = useState<SkincareStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [history, setHistory] = useState<SkincareHistoryItem[]>([]);
  const [historyError, setHistoryError] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const [showManageHabits, setShowManageHabits] = useState(false);
  const [habitsDraft, setHabitsDraft] = useState<HabitDraft[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newHabitName, setNewHabitName] = useState("");
  const [habitsSaving, setHabitsSaving] = useState(false);
  const [habitsSaveError, setHabitsSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadToday() {
      try {
        const data = await getToday();
        if (cancelled) return;
        setHabits(data.habits);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadToday();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getStats();
        setStats(data);
      } catch {
        // Stats are non-critical — leave them hidden if the request fails.
      }
    }

    loadStats();
  }, [reloadKey]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getHistory();
        setHistory(data);
        setHistoryError(false);
      } catch {
        setHistoryError(true);
      }
    }

    loadHistory();
  }, [reloadKey]);

  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleHabit = async (habitId: string) => {
    const previous = habits;
    const updated = habits.map((h) =>
      h.habit_id === habitId ? { ...h, completed: !h.completed } : h
    );

    setHabits(updated);
    setSaveError(false);

    try {
      const result = await updateToday(
        updated.map((h) => ({ habit_id: h.habit_id, completed: h.completed }))
      );
      setHabits(result.habits);
    } catch {
      // Roll back so the checkbox state can't silently diverge from the server.
      setHabits(previous);
      setSaveError(true);
    }
  };

  const openManageHabits = async () => {
    setShowManageHabits(true);
    setHabitsSaveError(null);
    try {
      const data = await getHabits();
      setHabitsDraft(
        data.map((h: SkincareHabit) => ({
          tempKey: h.id,
          id: h.id,
          name: h.name,
          is_active: h.is_active,
          sort_order: h.sort_order,
        }))
      );
    } catch {
      setHabitsSaveError("Couldn't load your habits — check your connection and try again.");
    }
  };

  const closeManageHabits = () => {
    setShowManageHabits(false);
    setEditingKey(null);
    setEditingName("");
    setNewHabitName("");
  };

  const toggleActiveDraft = (tempKey: string) => {
    setHabitsDraft((prev) =>
      prev.map((h) => (h.tempKey === tempKey ? { ...h, is_active: !h.is_active } : h))
    );
  };

  const startEdit = (h: HabitDraft) => {
    setEditingKey(h.tempKey);
    setEditingName(h.name);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditingName("");
  };

  const commitEdit = () => {
    const name = editingName.trim();
    if (!name) return;
    setHabitsDraft((prev) =>
      prev.map((h) => (h.tempKey === editingKey ? { ...h, name } : h))
    );
    cancelEdit();
  };

  const moveInGroup = (group: HabitDraft[], index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= group.length) return;
    const a = group[index];
    const b = group[targetIndex];
    setHabitsDraft((prev) =>
      prev.map((h) => {
        if (h.tempKey === a.tempKey) return { ...h, sort_order: b.sort_order };
        if (h.tempKey === b.tempKey) return { ...h, sort_order: a.sort_order };
        return h;
      })
    );
  };

  const addHabitDraft = () => {
    const name = newHabitName.trim();
    if (!name) return;
    setHabitsDraft((prev) => [
      ...prev,
      {
        tempKey: `new-${Date.now()}-${prev.length}`,
        name,
        is_active: true,
        sort_order: prev.length,
      },
    ]);
    setNewHabitName("");
  };

  const saveHabits = async () => {
    setHabitsSaving(true);
    setHabitsSaveError(null);
    try {
      await upsertHabits(
        habitsDraft.map((h) => ({
          id: h.id,
          name: h.name,
          is_active: h.is_active,
          sort_order: h.sort_order,
        }))
      );
      setShowManageHabits(false);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setHabitsSaveError(
        err?.response?.data?.detail ?? "Couldn't save your habits — check your connection and try again."
      );
    } finally {
      setHabitsSaving(false);
    }
  };

  const activeDraft = [...habitsDraft]
    .filter((h) => h.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const disabledDraft = [...habitsDraft]
    .filter((h) => !h.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  function renderHabitRow(h: HabitDraft, group: HabitDraft[], index: number) {
    return (
      <li key={h.tempKey} className="skincare-log-item">
        {editingKey === h.tempKey ? (
          <div className="skincare-edit-row">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") cancelEdit();
              }}
              autoFocus
            />
            <button className="skincare-ghost-btn" onClick={commitEdit}>
              Save
            </button>
            <button className="skincare-ghost-btn" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        ) : (
          <>
            <label>
              <input
                type="checkbox"
                checked={h.is_active}
                onChange={() => toggleActiveDraft(h.tempKey)}
              />
              {h.name}
            </label>
            <button
              className="skincare-icon-btn-inline"
              onClick={() => startEdit(h)}
              aria-label={`Rename ${h.name}`}
            >
              ✏️
            </button>
            <button
              className="skincare-icon-btn-inline"
              disabled={index === 0}
              onClick={() => moveInGroup(group, index, -1)}
              aria-label={`Move ${h.name} up`}
            >
              ⬆️
            </button>
            <button
              className="skincare-icon-btn-inline"
              disabled={index === group.length - 1}
              onClick={() => moveInGroup(group, index, 1)}
              aria-label={`Move ${h.name} down`}
            >
              ⬇️
            </button>
          </>
        )}
      </li>
    );
  }

  function getStatusEmoji(p: number) {
    if (p === 100) return "🟢";
    if (p >= 50) return "🟡";
    return "🔴";
  }

  function getDisplayDate(date: string, index: number) {
    if (index === 0) return "Today";
    if (index === 1) return "Yesterday";
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="skincare-container">
      <div className="skincare-header-row">
        <h2>🧴 Skincare</h2>
        <button
          className="skincare-icon-btn"
          onClick={openManageHabits}
          aria-label="Manage habits"
        >
          ⚙️
        </button>
      </div>

      {loading && (
        <>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={5} />
        </>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load your routine.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {stats && (
            <div className="progress-card">
              <h3>📊 Your Skincare Stats</h3>

              <p>{stats.message}</p>

              <p>
                🔥 Current Streak:{" "}
                <strong>
                  {stats.current_streak}{" "}
                  {stats.current_streak === 1 ? "day" : "days"}
                </strong>
              </p>

              <p>
                🏆 Best Streak:{" "}
                <strong>
                  {stats.best_streak} {stats.best_streak === 1 ? "day" : "days"}
                </strong>
              </p>

              <p>
                📈 Average Completion:{" "}
                <strong>{stats.average_completion}%</strong>
              </p>

              <p>
                📅 Total Days Tracked: <strong>{stats.total_days}</strong>
              </p>
            </div>
          )}

          <div className="progress-card">
            <h3>Today's Progress</h3>

            <div>
              <progress value={progress} max="100"></progress>
              <p>{progress}%</p>
            </div>
            {totalCount === 0 && <p>No habits yet — tap ⚙️ to add your first one.</p>}
            {totalCount > 0 && progress === 0 && <p>💪 Let's start today's routine!</p>}

            {totalCount > 0 && progress > 0 && progress < 100 && (
              <p>👍 Great progress! Keep going.</p>
            )}

            {totalCount > 0 && progress === 100 && (
              <p>🎉 Amazing! Today's skincare routine is complete!</p>
            )}
          </div>

          {saveError && (
            <p className="status-error">
              Couldn't save that change — check your connection and try again.
            </p>
          )}

          {totalCount > 0 && (
            <>
              <h3>Today's Habits</h3>

              <ul>
                {habits.map((h) => (
                  <li key={h.habit_id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={h.completed}
                        onChange={() => toggleHabit(h.habit_id)}
                      />
                      {h.name}
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3>📅 History</h3>

          {historyError && <p className="status-error">Couldn't load your history.</p>}

          {!historyError && history.length === 0 && (
            <p className="status-msg">No skincare history yet.</p>
          )}

          {!historyError &&
            history.map((item, index) => (
              <div
                key={item.date}
                className="history-card"
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <h3>
                  {getStatusEmoji(item.progress)} {getDisplayDate(item.date, index)}
                </h3>

                <p>
                  {item.completed} / {item.total} Completed
                </p>

                <progress value={item.progress} max="100" />

                <p>{item.progress}%</p>

                <button
                  onClick={() =>
                    setExpandedDate(expandedDate === item.date ? null : item.date)
                  }
                >
                  {expandedDate === item.date ? "Hide Details" : "View Details"}
                </button>

                {expandedDate === item.date && (
                  <>
                    {item.habits.map((h) => (
                      <p key={h.habit_id}>
                        {h.completed ? "✅" : "❌"} {h.name}
                      </p>
                    ))}
                  </>
                )}
              </div>
            ))}
        </>
      )}

      {showManageHabits && (
        <div className="skincare-modal-backdrop" onClick={closeManageHabits}>
          <div className="skincare-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⚙️ Manage Habits</h3>

            {habitsSaveError && <p className="status-error">{habitsSaveError}</p>}

            <details className="skincare-log-section" open>
              <summary>Active habits</summary>
              <ul>
                {activeDraft.map((h, i) => renderHabitRow(h, activeDraft, i))}
              </ul>

              <div className="skincare-add-row">
                <input
                  type="text"
                  placeholder="Add a habit…"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addHabitDraft();
                  }}
                />
                <button className="skincare-ghost-btn" onClick={addHabitDraft}>
                  ＋ Add
                </button>
              </div>
            </details>

            {disabledDraft.length > 0 && (
              <details className="skincare-log-section">
                <summary>Show disabled ({disabledDraft.length})</summary>
                <ul>
                  {disabledDraft.map((h, i) => renderHabitRow(h, disabledDraft, i))}
                </ul>
              </details>
            )}

            <div className="skincare-modal-actions">
              <button onClick={closeManageHabits} disabled={habitsSaving}>
                Cancel
              </button>
              <button onClick={saveHabits} disabled={habitsSaving}>
                {habitsSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Skincare;