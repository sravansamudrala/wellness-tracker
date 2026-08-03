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

  const [meterId, setMeterId] = useState("");
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
        // Default the selector to whichever meter is active.
        const active = data.find((m) => m.status === "active");
        setMeterId((prev) => prev || active?.meter_id || data[0]?.meter_id || "");
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
      <h2>🔢 Log Reading</h2>

      <Link to="/electricity" className="gym-nav-link">
        ← Back to Electricity
      </Link>

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

      {!loading && !error && meters.length > 0 && !saved && (
        <div className="electricity-setup-form">
          <label htmlFor="log-meter">Meter</label>
          <select
            id="log-meter"
            value={meterId}
            onChange={(e) => setMeterId(e.target.value)}
          >
            {meters.map((m) => (
              <option key={m.meter_id} value={m.meter_id}>
                {m.label} {m.status === "active" ? "(active)" : "(standby)"}
              </option>
            ))}
          </select>

          <label htmlFor="log-value">Reading value</label>
          <input
            id="log-value"
            type="number"
            inputMode="decimal"
            value={readingValue}
            onChange={(e) => setReadingValue(e.target.value)}
          />

          <label htmlFor="log-date">Reading date</label>
          <input
            id="log-date"
            type="date"
            value={readingDate}
            onChange={(e) => setReadingDate(e.target.value)}
          />

          <label className="electricity-checkbox-row">
            <input
              type="checkbox"
              checked={isBilled}
              onChange={(e) => setIsBilled(e.target.checked)}
            />
            This was the bill reading
          </label>

          {saveError && <p className="status-error">{saveError}</p>}

          <button onClick={save} disabled={saving || !meterId || !readingValue}>
            {saving ? "Saving…" : "Save Reading"}
          </button>
        </div>
      )}
    </div>
  );
}

export default ElectricityLogReading;
