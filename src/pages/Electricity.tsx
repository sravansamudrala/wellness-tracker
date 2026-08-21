import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "../components/Skeleton";
import { createMeter, getInsights } from "../services/electricityApi";
import type { InsightsMeter, SlabRecommendation } from "../services/electricityApi";

const MAX_METERS = 2;
const WARN_AT_PERCENT = 75;
const DANGER_AT_PERCENT = 92;

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

type TierStatus = "safe" | "warn" | "danger";

// Only meaningful when there's a next tier to approach — an open-ended top
// tier (slab_max === null, so next_slab_min is also null) has nothing to
// warn about.
function tierStatus(meter: InsightsMeter): TierStatus | null {
  if (!meter.current_bracket || meter.next_slab_min == null) return null;
  const pct = slabPercent(meter);
  if (pct >= DANGER_AT_PERCENT) return "danger";
  if (pct >= WARN_AT_PERCENT) return "warn";
  return "safe";
}

const STATUS_LABEL: Record<TierStatus, string> = {
  safe: "On track",
  warn: "Getting close",
  danger: "Near limit",
};

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
  const [recommendation, setRecommendation] = useState<SlabRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [expandedMeterId, setExpandedMeterId] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [breakpoints, setBreakpoints] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { meters: data, slab_recommendation } = await getInsights();
        if (cancelled) return;
        setMeters(data);
        setRecommendation(slab_recommendation);
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

  const activeMeter = meters.find((m) => m.status === "active");
  const standbyMeter = meters.find((m) => m.status === "standby");
  const canSwitch = Boolean(activeMeter && standbyMeter);

  return (
    <div className="electricity-container">
      <div className="electricity-page-head">
        <Link to="/" className="electricity-back-link" aria-label="Back to Dashboard">
          ←
        </Link>
        <h2>Electricity</h2>
      </div>
      <p className="electricity-tagline">
        {meters.length > 0
          ? `Tracking usage across your ${meters.length} meter${meters.length > 1 ? "s" : ""}.`
          : "Track your usage and avoid pricier billing tiers."}
      </p>

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
          {canSwitch && (
            <div className="electricity-recommendation-card">
              <div className="electricity-recommendation-head">
                <span className="electricity-icon-bubble" aria-hidden="true">
                  {recommendation ? "💡" : "⚡"}
                </span>
                <div>
                  <h3>{recommendation ? "Time to switch meters" : "Switch meters anytime"}</h3>
                  {recommendation && (
                    <p className="electricity-recommendation-date">
                      By {formatDate(recommendation.recommended_switch_date)}
                    </p>
                  )}
                </div>
              </div>

              <p className="electricity-recommendation-body">
                {recommendation
                  ? recommendation.explanation
                  : `Currently using ${activeMeter!.label} (${Math.max(
                      0,
                      Math.round(activeMeter!.cumulative_units)
                    )} units this cycle). ${standbyMeter!.label} is on standby (${Math.max(
                      0,
                      Math.round(standbyMeter!.cumulative_units)
                    )} units) — you can switch to it anytime.`}
              </p>

              <Link to="/electricity/switch" className="electricity-banner-btn">
                <span aria-hidden="true">⇄</span> Switch to{" "}
                {recommendation?.standby_meter_label ?? standbyMeter!.label}
              </Link>
            </div>
          )}

          <div className="electricity-meters-list">
            {[...meters]
              .sort((a) => (a.status === "active" ? -1 : 1))
              .map((meter) => {
              const status = tierStatus(meter);
              const hasTierData = meter.current_bracket != null && meter.next_slab_min != null;
              const percent = hasTierData ? slabPercent(meter) : 0;
              const ringOffset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE;
              const isExpanded = expandedMeterId === meter.meter_id;

              return (
                <div key={meter.meter_id} className="electricity-meter-card">
                  <button
                    type="button"
                    className="electricity-meter-summary"
                    onClick={() =>
                      setExpandedMeterId((prev) => (prev === meter.meter_id ? null : meter.meter_id))
                    }
                    aria-expanded={isExpanded}
                  >
                    <div className="electricity-ring-wrap">
                      <svg className="electricity-ring" viewBox="0 0 60 60">
                        <circle className="electricity-ring-track" cx="30" cy="30" r={RING_RADIUS} />
                        <circle
                          className={`electricity-ring-fill${status ? ` is-${status}` : ""}`}
                          cx="30"
                          cy="30"
                          r={RING_RADIUS}
                          strokeDasharray={RING_CIRCUMFERENCE}
                          strokeDashoffset={ringOffset}
                        />
                      </svg>
                      <div className="electricity-ring-center">
                        {hasTierData ? `${Math.round(percent)}%` : Math.round(meter.cumulative_units)}
                      </div>
                    </div>

                    <div className="electricity-meter-summary-info">
                      <div className="electricity-meter-name-row">
                        <h3>{meter.label}</h3>
                        <span className="electricity-badge-chevron">
                          <span
                            className={`gym-badge ${
                              meter.status === "active"
                                ? "electricity-badge-active"
                                : "electricity-badge-standby"
                            }`}
                          >
                            {meter.status === "active" ? "In use" : "Standby"}
                          </span>
                          <span
                            className={`electricity-chevron${isExpanded ? " is-expanded" : ""}`}
                            aria-hidden="true"
                          >
                            ›
                          </span>
                        </span>
                      </div>
                      <p className="electricity-meter-units">
                        {Math.max(0, Math.round(meter.cumulative_units))}
                        {hasTierData ? ` of ${meter.next_slab_min}` : ""} units used
                      </p>
                      {status && (
                        <p className={`electricity-status-pill is-${status}`}>
                          {STATUS_LABEL[status]}
                        </p>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="electricity-meter-details">
                      {meter.meter_number && (
                        <div className="electricity-detail-row">
                          <span className="electricity-detail-label">Meter number</span>
                          <span className="electricity-detail-value">{meter.meter_number}</span>
                        </div>
                      )}

                      {meter.last_reading && (
                        <div className="electricity-detail-row">
                          <span className="electricity-detail-label">Last logged reading</span>
                          <span className="electricity-detail-value">
                            {meter.last_reading.reading_value} on{" "}
                            {formatDate(meter.last_reading.reading_date)}
                          </span>
                        </div>
                      )}

                      {meter.current_bracket && (
                        <p className="electricity-tier-info">
                          Current tier: {meter.current_bracket.slab_min}
                          {meter.current_bracket.slab_max != null
                            ? `–${meter.current_bracket.slab_max}`
                            : "+"}{" "}
                          units
                          {meter.next_slab_min != null && ` · Next tier at ${meter.next_slab_min} units`}
                        </p>
                      )}

                      <p className="electricity-nudge">
                        {meter.last_billed_reading
                          ? `Billing period started ${formatDate(
                              meter.last_billed_reading.reading_date
                            )} · ${Math.max(0, Math.round(meter.cumulative_units))} units used since then`
                          : `No bill logged yet · ${Math.max(
                              0,
                              Math.round(meter.cumulative_units)
                            )} units used so far`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {meters.length > 0 && (
            <div className="electricity-actions">
              <Link to="/electricity/log" className="electricity-btn-ink">
                <span aria-hidden="true">+</span> Log a reading
              </Link>
            </div>
          )}

          {meters.length < MAX_METERS && (
            <div className="electricity-setup-form">
              <div className="electricity-setup-head">
                <span className="electricity-icon-bubble" aria-hidden="true">
                  ➕
                </span>
                <h3>{meters.length === 0 ? "Add your first meter" : "Add a second meter"}</h3>
              </div>
              {meters.length === 0 && (
                <p className="electricity-setup-intro">
                  Track your usage here and get a heads-up before you cross into a pricier
                  billing tier.
                </p>
              )}

              <label htmlFor="electricity-label">Name</label>
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

              <label htmlFor="electricity-breakpoints">Price tier limits (optional)</label>
              <p className="electricity-field-hint">
                If your bill charges more per unit after a certain usage amount (sometimes
                labeled "slab" on the bill), enter those amounts separated by commas — e.g.
                "100, 300" for tiers of 0–100, 100–300, and 300+ units.
              </p>
              <input
                id="electricity-breakpoints"
                type="text"
                placeholder="e.g. 100, 300"
                value={breakpoints}
                onChange={(e) => setBreakpoints(e.target.value)}
              />

              {addError && <p className="status-error">{addError}</p>}

              <button
                className="electricity-submit-btn"
                onClick={addMeter}
                disabled={adding || !label.trim()}
              >
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
