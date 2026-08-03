import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "../components/Skeleton";
import { createMeter, getInsights } from "../services/electricityApi";
import type { InsightsMeter } from "../services/electricityApi";

const MAX_METERS = 2;

function formatOdometer(value: number): string {
  return Math.max(0, Math.round(value)).toString().padStart(3, "0");
}

function slabPercent(meter: InsightsMeter): number {
  if (!meter.current_bracket) return 0;
  const { slab_min, slab_max } = meter.current_bracket;
  if (slab_max == null) return 100;
  const width = slab_max - slab_min;
  if (width <= 0) return 100;
  const into = meter.cumulative_units - slab_min;
  return Math.max(0, Math.min(100, (into / width) * 100));
}

// "100, 300" -> [0-100, 100-300, 300+] — the simplest input for the common
// case (a handful of breakpoints) without a repeatable min/max row editor.
function parseBreakpoints(text: string): { slab_min: number; slab_max: number | null }[] {
  const points = text
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  if (points.length === 0) return [];

  const slabs: { slab_min: number; slab_max: number | null }[] = [];
  let prev = 0;
  for (const point of points) {
    slabs.push({ slab_min: prev, slab_max: point });
    prev = point;
  }
  slabs.push({ slab_min: prev, slab_max: null });
  return slabs;
}

function Electricity() {
  const [meters, setMeters] = useState<InsightsMeter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [label, setLabel] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [breakpoints, setBreakpoints] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { meters: data } = await getInsights();
        if (cancelled) return;
        setMeters(data);
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

  const addMeter = async () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setAdding(true);
    setAddError(null);
    try {
      await createMeter({
        label: trimmed,
        meter_number: meterNumber.trim() || undefined,
        slab_thresholds: parseBreakpoints(breakpoints),
      });
      setLabel("");
      setMeterNumber("");
      setBreakpoints("");
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setAddError(err?.response?.data?.detail ?? "Couldn't add that meter.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="electricity-container">
      <h2>⚡ Electricity</h2>

      {loading && (
        <>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load your meters.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {meters.map((meter) => (
            <div key={meter.meter_id} className="electricity-meter-card">
              <div className="electricity-meter-head">
                <div>
                  <h3>{meter.label}</h3>
                  {meter.meter_number && (
                    <p className="electricity-meter-number">No. {meter.meter_number}</p>
                  )}
                </div>
                <span
                  className={`gym-badge ${
                    meter.status === "active"
                      ? "electricity-badge-active"
                      : "electricity-badge-standby"
                  }`}
                >
                  {meter.status === "active" ? "Active" : "Standby"}
                </span>
              </div>

              <div className="electricity-odometer-row">
                <span className="electricity-odometer">
                  {formatOdometer(meter.cumulative_units)}
                </span>
                <span className="dash-muted">units consumed</span>
              </div>

              {meter.last_reading && (
                <p className="electricity-meta">
                  last logged {meter.last_reading.reading_value} ·{" "}
                  {meter.last_reading.reading_date} · {meter.last_reading.entry_method}
                </p>
              )}

              {meter.current_bracket && (
                <>
                  <div className="electricity-slab-bar">
                    <div
                      className="electricity-slab-fill"
                      style={{ width: `${slabPercent(meter)}%` }}
                    />
                  </div>
                  <div className="electricity-slab-labels">
                    <span>
                      Slab {meter.current_bracket.slab_min}
                      {meter.current_bracket.slab_max != null
                        ? `–${meter.current_bracket.slab_max}`
                        : "+"}
                    </span>
                    {meter.next_slab_min != null && (
                      <span>Next at {meter.next_slab_min}</span>
                    )}
                  </div>
                </>
              )}

              {meter.nudge_text && (
                <p className="electricity-nudge">{meter.nudge_text}</p>
              )}
            </div>
          ))}

          {meters.length > 0 && (
            <div className="electricity-actions">
              <Link to="/electricity/log" className="electricity-btn-secondary">
                Log Reading
              </Link>
              {meters.length === MAX_METERS && (
                <Link to="/electricity/switch" className="electricity-btn-primary">
                  Switch Meter
                </Link>
              )}
            </div>
          )}

          {meters.length < MAX_METERS && (
            <div className="electricity-setup-form">
              <h3>{meters.length === 0 ? "Add your first meter" : "Add a second meter"}</h3>

              <label htmlFor="electricity-label">Label</label>
              <input
                id="electricity-label"
                type="text"
                placeholder="e.g. Old Meter"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />

              <label htmlFor="electricity-number">Meter number (optional)</label>
              <input
                id="electricity-number"
                type="text"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
              />

              <label htmlFor="electricity-breakpoints">
                Slab breakpoints (optional, comma-separated, e.g. "100, 300")
              </label>
              <input
                id="electricity-breakpoints"
                type="text"
                value={breakpoints}
                onChange={(e) => setBreakpoints(e.target.value)}
              />

              {addError && <p className="status-error">{addError}</p>}

              <button onClick={addMeter} disabled={adding || !label.trim()}>
                {adding ? "Adding…" : "Add Meter"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Electricity;