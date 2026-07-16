import { useEffect, useState } from "react";

import {
  addWater,
  getWaterSettings,
  getWaterStats,
  getWaterToday,
  type WaterEntry,
  type WaterSettings,
  type WaterStats,
} from "../services/waterApi";

function Water() {
  const [today, setToday] = useState<WaterEntry | null>(null);
  const [settings, setSettings] = useState<WaterSettings | null>(null);
  const [stats, setStats] = useState<WaterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    loadWaterData();
  }, []);

  if (loading) {
    return <h2>Loading water...</h2>;
  }

  if (error) {
    return (
      <div>
        <h2>Water</h2>
        <p>{error}</p>
        <button onClick={loadWaterData}>Retry</button>
      </div>
    );
  }

  const amountMl = today?.amount_ml ?? 0;
  const dailyGoalMl = settings?.daily_goal_ml ?? 2000;
  const progress = Math.min(Math.round((amountMl / dailyGoalMl) * 100), 100);

  return (
    <div className="water-container">
      <h2>Water</h2>

      <div className="water-card">
        <p>
          {amountMl}ml / {dailyGoalMl}ml
        </p>

        <p>{progress}% complete</p>

        {stats && <p>{stats.message}</p>}
      </div>

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
    </div>
  );
}

export default Water;
