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

  useEffect(() => {
    loadWaterData();
  }, []);

  const amountMl = today?.amount_ml ?? 0;
  const dailyGoalMl = settings?.daily_goal_ml ?? 2000;
  const progress = Math.min(Math.round((amountMl / dailyGoalMl) * 100), 100);
  const ringOffset = RING_CIRCUMFERENCE - (progress / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="water-container">
      <h2>💧 Water</h2>

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
    </div>
  );
}

export default Water;
