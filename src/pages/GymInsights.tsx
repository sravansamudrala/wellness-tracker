import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "../components/Skeleton";
import {
  getRecords,
  getRecovery,
  getStats,
  getVolume,
} from "../services/gymApi";
import type {
  GymStats,
  RecordItem,
  RecoveryItem,
  VolumeResponse,
} from "../services/gymApi";

const RANGES: { key: string; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "all", label: "All" },
];

function pluralDays(n: number): string {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

function recoveryLabel(item: RecoveryItem): string {
  if (item.days_since === null) return "Not trained yet";
  if (item.days_since === 0) return "Today";
  return `${pluralDays(item.days_since)} ago`;
}

function GymInsights() {
  const [stats, setStats] = useState<GymStats | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [recovery, setRecovery] = useState<RecoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [range, setRange] = useState("week");
  const [volume, setVolume] = useState<VolumeResponse | null>(null);
  const [volumeLoading, setVolumeLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statsData, recordsData, recoveryData] = await Promise.all([
          getStats(),
          getRecords(),
          getRecovery(),
        ]);
        if (cancelled) return;
        setStats(statsData);
        setRecords(recordsData);
        setRecovery(recoveryData);
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

  useEffect(() => {
    let cancelled = false;

    async function loadVolume() {
      setVolumeLoading(true);
      try {
        const data = await getVolume(range);
        if (!cancelled) setVolume(data);
      } catch {
        // Volume is non-critical; leave prior data / empty on failure.
      } finally {
        if (!cancelled) setVolumeLoading(false);
      }
    }

    loadVolume();
    return () => {
      cancelled = true;
    };
  }, [range, reloadKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  const maxVolume = volume
    ? Math.max(1, ...volume.points.map((p) => p.volume_kg))
    : 1;

  return (
    <div className="gym-container">
      <h2>📊 Insights</h2>

      <Link to="/gym" className="gym-nav-link">
        ← Back to Gym
      </Link>

      {loading && (
        <>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load your insights.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {stats && (
            <div className="progress-card">
              <h3>📈 Summary</h3>
              <p>{stats.message}</p>
              <p>
                🔥 Current Streak:{" "}
                <strong>{pluralDays(stats.current_streak)}</strong>
              </p>
              <p>
                🏅 Best Streak: <strong>{pluralDays(stats.best_streak)}</strong>
              </p>
              <p>
                📅 This Week: <strong>{stats.this_week}</strong> workout
                {stats.this_week === 1 ? "" : "s"}
              </p>
              <p>
                🏆 Total Workouts: <strong>{stats.total_workouts}</strong>
              </p>
            </div>
          )}

          <div className="gym-exercise-card">
            <h3>Training Volume</h3>

            <div className="gym-range-tabs">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  className={`gym-range-tab${
                    range === r.key ? " is-active" : ""
                  }`}
                  onClick={() => setRange(r.key)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {volumeLoading ? (
              <span className="skeleton skeleton-line" />
            ) : volume && volume.points.length > 0 ? (
              <>
                <p className="gym-volume-total">
                  {Math.round(volume.total_volume_kg).toLocaleString()} kg total
                </p>
                <div className="gym-bars">
                  {volume.points.map((p) => (
                    <div key={p.date} className="gym-bar-row">
                      <span className="gym-bar-label">{p.date.substring(5)}</span>
                      <span className="gym-bar-track">
                        <span
                          className="gym-bar-fill"
                          style={{
                            width: `${(p.volume_kg / maxVolume) * 100}%`,
                          }}
                        />
                      </span>
                      <span className="gym-bar-value">
                        {Math.round(p.volume_kg).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="gym-preview-item">No workouts in this range yet.</p>
            )}
          </div>

          <div className="gym-exercise-card">
            <h3>Personal Records</h3>
            {records.length === 0 ? (
              <p className="gym-preview-item">
                Complete a workout with weights to set records.
              </p>
            ) : (
              records.map((r) => (
                <div key={r.exercise_id} className="gym-stat-row">
                  <span className="gym-stat-name">{r.exercise_name}</span>
                  <span className="gym-stat-value">
                    {r.max_weight_kg ?? "—"} kg
                    {r.estimated_1rm_kg
                      ? ` · 1RM ${Math.round(r.estimated_1rm_kg)}`
                      : ""}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="gym-exercise-card">
            <h3>Recovery</h3>
            {recovery.length === 0 ? (
              <p className="gym-preview-item">No muscle groups yet.</p>
            ) : (
              recovery.map((item) => (
                <div key={item.muscle_group_id} className="gym-stat-row">
                  <span className="gym-stat-name">
                    {item.muscle_group_name}
                  </span>
                  <span className="gym-stat-value">{recoveryLabel(item)}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default GymInsights;
