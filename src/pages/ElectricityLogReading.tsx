import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "../components/Skeleton";
import { createReading, getInsights } from "../services/electricityApi";
import type { InsightsMeter } from "../services/electricityApi";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function ElectricityLogReading() {
  const [meters, setMeters] = useState<InsightsMeter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [meterId, setMeterId] = useState<string | null>(null);
  const [readingValue, setReadingValue] = useState("");
  const [readingDate, setReadingDate] = useState(todayIso());
  const [isBilled, setIsBilled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { meters: data } = await getInsights();
        if (cancelled) return;
        setMeters(data);
        // Skip the picker step when there's only one meter to choose from.
        setMeterId((prev) => (prev === null && data.length === 1 ? data[0].meter_id : prev));
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

  const selectedMeter = meters.find((m) => m.meter_id === meterId) ?? null;

  const save = async () => {
    const value = Number(readingValue);
    if (!meterId || !Number.isFinite(value)) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createReading(meterId, {
        reading_value: value,
        reading_date: readingDate,
        is_billed_reading: isBilled,
      });
      setSaved(true);
    } catch (err: any) {
      setSaveError(err?.response?.data?.detail ?? "Couldn't save that reading.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="electricity-container">
      <div className="electricity-page-head">
        <Link to="/electricity" className="electricity-back-link" aria-label="Back to Electricity">
          ←
        </Link>
        <h2>Log a reading</h2>
      </div>

      {loading && <SkeletonCard lines={4} />}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load your meters.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && meters.length === 0 && (
        <div className="status-error">
          <p>Add a meter first, from the Electricity dashboard.</p>
        </div>
      )}

      {!loading && !error && meters.length > 0 && saved && (
        <div className="progress-card">
          <h3>✅ Reading saved</h3>
          <Link to="/electricity" className="gym-nav-link">
            ⚡ Back to Electricity
          </Link>
        </div>
      )}

      {!loading && !error && meters.length > 0 && !saved && !selectedMeter && (
        <>
          <p className="electricity-tagline">Which meter are you reading?</p>
          <div className="electricity-meter-pick-list">
            {meters.map((m) => (
              <button
                key={m.meter_id}
                type="button"
                className="electricity-meter-pick"
                onClick={() => setMeterId(m.meter_id)}
              >
                <div className="electricity-meter-pick-main">
                  <div className="electricity-meter-pick-name">
                    <strong>{m.label}</strong>
                    <span
                      className={`gym-badge ${
                        m.status === "active" ? "electricity-badge-active" : "electricity-badge-standby"
                      }`}
                    >
                      {m.status === "active" ? "In use" : "Standby"}
                    </span>
                  </div>
                  <span className="electricity-meter-units">
                    {Math.max(0, Math.round(m.cumulative_units))} units used
                  </span>
                </div>
                <span className="electricity-meter-pick-chevron" aria-hidden="true">
                  ›
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {!loading && !error && meters.length > 0 && !saved && selectedMeter && (
        <div className="electricity-setup-form">
          <div className="electricity-meter-pick-name">
            <strong>{selectedMeter.label}</strong>
            <span
              className={`gym-badge ${
                selectedMeter.status === "active"
                  ? "electricity-badge-active"
                  : "electricity-badge-standby"
              }`}
            >
              {selectedMeter.status === "active" ? "In use" : "Standby"}
            </span>
          </div>

          <label htmlFor="log-date">Reading date</label>
          <input
            id="log-date"
            type="date"
            value={readingDate}
            onChange={(e) => setReadingDate(e.target.value)}
          />

          <label className="electricity-checkbox-card">
            <input
              type="checkbox"
              checked={isBilled}
              onChange={(e) => setIsBilled(e.target.checked)}
            />
            <span className="electricity-checkbox-card-text">
              <strong>This is from my bill</strong>
              <span>
                Check this if you're copying the reading printed on your latest electricity
                bill, rather than reading it off the meter yourself. It resets the billing
                period used for tier calculations.
              </span>
            </span>
          </label>

          <label htmlFor="log-value">{isBilled ? "Reading from your bill" : "Meter reading"}</label>
          <input
            id="log-value"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={readingValue}
            onChange={(e) => setReadingValue(e.target.value)}
          />

          {saveError && <p className="status-error">{saveError}</p>}

          <button
            className="electricity-submit-btn"
            onClick={save}
            disabled={saving || !meterId || !readingValue}
          >
            {saving ? "Saving…" : "Save reading"}
          </button>
        </div>
      )}
    </div>
  );
}

export default ElectricityLogReading;
