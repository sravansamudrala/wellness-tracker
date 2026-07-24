import { useEffect, useState } from "react";

import { SkeletonCard } from "../components/Skeleton";
import {
  addWater,
  getWaterSettings,
  getWaterStats,
  getWaterToday,
  updateWaterSettings,
  type WaterEntry,
  type WaterSettings,
  type WaterStats,
} from "../services/waterApi";
import { subscribeToPush } from "../services/pushApi";

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function Water() {
  const [today, setToday] = useState<WaterEntry | null>(null);
  const [settings, setSettings] = useState<WaterSettings | null>(null);
  const [stats, setStats] = useState<WaterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderStartTime, setReminderStartTime] = useState("09:00");
  const [reminderEndTime, setReminderEndTime] = useState("21:00");
  const [savingReminders, setSavingReminders] = useState(false);
  const [reminderSaveError, setReminderSaveError] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  const loadWaterData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [todayData, settingsData, statsData] = await Promise.all([
        getWaterToday(),
        getWaterSettings(),
        getWaterStats(),
      ]);

      setToday(todayData);
      setSettings(settingsData);
      setStats(statsData);
      setRemindersEnabled(settingsData.reminders_enabled);
      setReminderStartTime(settingsData.reminder_start_time.substring(0, 5));
      setReminderEndTime(settingsData.reminder_end_time.substring(0, 5));
    } catch (err) {
      console.error(err);
      setError("Could not load water data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddWater = async (amountMl: number) => {
    setSaving(true);
    setError(null);

    try {
      const updatedToday = await addWater({ amount_ml: amountMl });
      const updatedStats = await getWaterStats();

      setToday(updatedToday);
      setStats(updatedStats);
    } catch (err) {
      console.error(err);
      setError("Could not add water.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditGoal = () => {
    setGoalInput(String(settings?.daily_goal_ml ?? 2000));
    setEditingGoal(true);
  };

  const handleCancelEditGoal = () => {
    setEditingGoal(false);
  };

  const handleSaveGoal = async () => {
    const dailyGoalMl = parseInt(goalInput, 10);

    if (!Number.isFinite(dailyGoalMl) || dailyGoalMl <= 0) {
      setError("Enter a valid goal in ml.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedSettings = await updateWaterSettings({
        daily_goal_ml: dailyGoalMl,
        reminders_enabled: remindersEnabled,
        reminder_start_time: reminderStartTime,
        reminder_end_time: reminderEndTime,
      });
      setSettings(updatedSettings);
      setEditingGoal(false);
    } catch (err) {
      console.error(err);
      setError("Could not update goal.");
    } finally {
      setSaving(false);
    }
  };

  // Turning the toggle on must register a push subscription first (needs the
  // permission prompt, which iOS only allows from a user gesture like this).
  async function handleRemindersToggle(checked: boolean) {
    setPushError(null);

    if (!checked) {
      setRemindersEnabled(false);
      return;
    }

    try {
      const subscribed = await subscribeToPush();
      if (subscribed) {
        setRemindersEnabled(true);
      } else {
        setRemindersEnabled(false);
        setPushError("Notification permission was denied.");
      }
    } catch (e) {
      setRemindersEnabled(false);
      setPushError(
        e instanceof Error ? e.message : "Couldn't enable notifications."
      );
    }
  }

  const handleSaveReminders = async () => {
    setSavingReminders(true);
    setReminderSaveError(false);

    try {
      const updatedSettings = await updateWaterSettings({
        daily_goal_ml: settings?.daily_goal_ml ?? 2000,
        reminders_enabled: remindersEnabled,
        reminder_start_time: reminderStartTime,
        reminder_end_time: reminderEndTime,
      });
      setSettings(updatedSettings);
      setShowReminderSettings(false);
    } catch (err) {
      console.error(err);
      setReminderSaveError(true);
    } finally {
      setSavingReminders(false);
    }
  };

  useEffect(() => {
    loadWaterData();
  }, []);

  const amountMl = today?.amount_ml ?? 0;
  const dailyGoalMl = settings?.daily_goal_ml ?? 2000;
  const progress = Math.min(Math.round((amountMl / dailyGoalMl) * 100), 100);
  const ringOffset = RING_CIRCUMFERENCE - (progress / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="water-container">
      <div className="water-header-row">
        <h2>💧 Water</h2>
        <button
          className="water-icon-btn"
          onClick={() => setShowReminderSettings(true)}
          aria-label="Water reminder settings"
        >
          ⚙️
        </button>
      </div>

      {loading && (
        <>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={2} />
        </>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>{error}</p>
          <button onClick={loadWaterData}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="water-card water-hero-card">
            <div className="water-hero">
              <svg className="water-ring" viewBox="0 0 120 120">
                <circle className="water-ring-track" cx="60" cy="60" r={RING_RADIUS} />
                <circle
                  className="water-ring-fill"
                  cx="60"
                  cy="60"
                  r={RING_RADIUS}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="water-ring-center">
                <span className="water-amount">{amountMl}</span>
                <span className="water-unit">of {dailyGoalMl}ml</span>
              </div>
            </div>

            <div className="water-goal-row">
              {editingGoal ? (
                <div className="water-goal-edit">
                  <input
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    autoFocus
                  />
                  <button disabled={saving} onClick={handleSaveGoal}>
                    Save
                  </button>
                  <button
                    disabled={saving}
                    className="water-goal-cancel"
                    onClick={handleCancelEditGoal}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="water-goal-text">Goal: {dailyGoalMl}ml</span>
                  <button
                    className="water-edit-btn"
                    onClick={handleStartEditGoal}
                    aria-label="Edit daily goal"
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>

            {stats && <p className="water-message">{stats.message}</p>}
          </div>

          {stats && (
            <div className="water-card water-stats-row">
              <div className="water-stat">
                <span className="water-stat-value">{stats.current_streak}</span>
                <span className="water-stat-label">Streak</span>
              </div>
              <div className="water-stat">
                <span className="water-stat-value">{stats.best_streak}</span>
                <span className="water-stat-label">Best</span>
              </div>
              <div className="water-stat">
                <span className="water-stat-value">{stats.average_completion}%</span>
                <span className="water-stat-label">Avg</span>
              </div>
            </div>
          )}

          <h3>Quick add</h3>
          <div className="water-quick-add">
            <button disabled={saving} onClick={() => handleAddWater(250)}>
              +250ml
            </button>
            <button disabled={saving} onClick={() => handleAddWater(500)}>
              +500ml
            </button>
            <button disabled={saving} onClick={() => handleAddWater(1000)}>
              +1000ml
            </button>
          </div>

        </>
      )}

      {showReminderSettings && (
        <div
          className="water-modal-backdrop"
          onClick={() => setShowReminderSettings(false)}
        >
          <div className="water-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🔔 Water Reminders</h3>

            <label>
              <input
                type="checkbox"
                checked={remindersEnabled}
                onChange={(e) => handleRemindersToggle(e.target.checked)}
              />
              Remind me hourly
            </label>

            {pushError && <p className="status-error">{pushError}</p>}

            <div className="water-modal-times">
              <div>
                <label>From</label>
                <br />
                <input
                  type="time"
                  value={reminderStartTime}
                  onChange={(e) => setReminderStartTime(e.target.value)}
                />
              </div>

              <div>
                <label>Until</label>
                <br />
                <input
                  type="time"
                  value={reminderEndTime}
                  onChange={(e) => setReminderEndTime(e.target.value)}
                />
              </div>
            </div>

            <p className="water-message">
              Reminders pause automatically once you hit your daily goal.
            </p>

            {reminderSaveError && (
              <p className="status-error">
                Couldn't save reminder settings — check your connection and try again.
              </p>
            )}

            <div className="water-modal-actions">
              <button
                className="water-goal-cancel"
                onClick={() => setShowReminderSettings(false)}
              >
                Close
              </button>
              <button disabled={savingReminders} onClick={handleSaveReminders}>
                {savingReminders ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Water;
