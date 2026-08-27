import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "../components/Skeleton";
import { createMeter, getInsights, listReadings } from "../services/electricityApi";
import type { InsightsMeter, Reading, SlabRecommendation } from "../services/electricityApi";

const MAX_METERS = 2;
const WARN_AT_PERCENT = 75;
const DANGER_AT_PERCENT = 92;

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type TabKey = "overview" | "insights" | "monthly";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "insights", label: "Insights" },
  { key: "monthly", label: "Monthly Usage" },
];

function formatDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// A billing period is named after the month it starts in — a period
// running Jun 8 to Jul 8 is "the June bill", even though it spans into July.
function formatMonthYear(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, { month: "long", year: "numeric" });
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

interface BillingPeriod {
  start: string;
  end: string;
  total: number;
  billedAmount: number | null;
}

// A completed billing period is the gap between two consecutive billed
// readings — the same anchor concept the backend's cumulative-units calc
// uses for the *current* period, just walked backward across history.
function billingPeriods(readings: Reading[]): BillingPeriod[] {
  const billed = readings
    .filter((r) => r.is_billed_reading)
    .slice()
    .sort((a, b) => a.reading_date.localeCompare(b.reading_date));

  const periods: BillingPeriod[] = [];
  for (let i = 1; i < billed.length; i++) {
    // Two billed readings on the same calendar date (e.g. testing the log
    // form twice in one sitting) would otherwise produce a meaningless
    // zero-day "period" — no real bill spans zero days.
    if (billed[i - 1].reading_date === billed[i].reading_date) continue;
    periods.push({
      start: billed[i - 1].reading_date,
      end: billed[i].reading_date,
      total: billed[i].reading_value - billed[i - 1].reading_value,
      billedAmount: billed[i].billed_amount,
    });
  }
  return periods.reverse();
}

// Illustrative fallback only, used when a period has no entered bill
// amount — never claimed as verified real tariff rates.
const FALLBACK_SLAB_RATES: { width: number; rate: number }[] = [
  { width: 50, rate: 1.95 },
  { width: 50, rate: 3.1 },
  { width: 100, rate: 3.4 },
  { width: 100, rate: 4.8 },
  { width: Infinity, rate: 6.0 },
];

function estimateCost(units: number): number {
  let remaining = units;
  let cost = 0;
  for (const { width, rate } of FALLBACK_SLAB_RATES) {
    if (remaining <= 0) break;
    const inBracket = Math.min(remaining, width);
    cost += inBracket * rate;
    remaining -= inBracket;
  }
  return Math.round(cost);
}

// Mirrors the backend's projection-rate choice (max of overall vs. recent
// pace) so the client-side "what if I switch" calc uses the same logic.
function projectionRateFor(meter: InsightsMeter): number | null {
  if (meter.daily_rate != null && meter.recent_rate != null) {
    return Math.max(meter.daily_rate, meter.recent_rate);
  }
  return meter.daily_rate ?? meter.recent_rate ?? null;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}


function Electricity() {
  const [meters, setMeters] = useState<InsightsMeter[]>([]);
  const [recommendation, setRecommendation] = useState<SlabRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [expandedMeterId, setExpandedMeterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [whatIfMeterIds, setWhatIfMeterIds] = useState<Set<string>>(new Set());

  const [label, setLabel] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [breakpoints, setBreakpoints] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [readingsByMeter, setReadingsByMeter] = useState<Record<string, Reading[]>>({});
  const [readingsLoading, setReadingsLoading] = useState(false);
  const fetchedMeterIdsRef = useRef<Set<string>>(new Set());

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

  // Recent-readings trend (Insights) and billing periods (Monthly Usage)
  // both need per-meter reading history — fetched lazily on first visit to
  // either tab, not on initial page load, and only once per meter id.
  useEffect(() => {
    if (activeTab !== "insights" && activeTab !== "monthly") return;
    const toFetch = meters.filter((m) => !fetchedMeterIdsRef.current.has(m.meter_id));
    if (toFetch.length === 0) return;
    toFetch.forEach((m) => fetchedMeterIdsRef.current.add(m.meter_id));

    let cancelled = false;
    setReadingsLoading(true);
    Promise.all(
      toFetch.map((m) => listReadings(m.meter_id).then((data) => [m.meter_id, data] as const))
    )
      .then((pairs) => {
        if (cancelled) return;
        setReadingsByMeter((prev) => {
          const next = { ...prev };
          pairs.forEach(([id, data]) => {
            next[id] = data;
          });
          return next;
        });
      })
      .finally(() => {
        if (!cancelled) setReadingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, meters]);

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

  // The active meter's current pace — reused for the "what if I switch"
  // projection on standby meters, since the household's actual consumption
  // rate doesn't change when you switch which meter it's drawn through.
  const activeRateForWhatIf = activeMeter ? projectionRateFor(activeMeter) : null;

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
          {meters.length > 0 && (
            <div className="gym-range-tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`gym-range-tab${activeTab === t.key ? " is-active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === "overview" && (
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

          {activeTab === "insights" && (
            <>
              {meters.map((meter) => {
                const weeklyRate = meter.daily_rate != null ? meter.daily_rate * 7 : null;
                const willCrossSlab =
                  meter.projected_units_at_billing_end != null &&
                  meter.next_slab_min != null &&
                  meter.projected_units_at_billing_end >= meter.next_slab_min;
                // Scoped to the current billing cycle, matching the rate
                // summary above it — otherwise this can mix in readings
                // from a previous, already-billed cycle. The anchor
                // reading itself is excluded (its delta belongs to the
                // tail of the prior cycle, not this one).
                const cycleStart = meter.last_billed_reading?.reading_date;
                const readings = (readingsByMeter[meter.meter_id] ?? [])
                  .filter((r) => r.units_consumed != null)
                  .filter((r) => !cycleStart || r.reading_date > cycleStart)
                  .slice()
                  .sort((a, b) => a.reading_date.localeCompare(b.reading_date))
                  .slice(-10);
                const maxUnits = Math.max(1, ...readings.map((r) => r.units_consumed ?? 0));

                const canShowWhatIf =
                  meter.status !== "active" &&
                  activeMeter != null &&
                  activeRateForWhatIf != null &&
                  activeMeter.expected_billing_period_end != null;
                const whatIfOpen = whatIfMeterIds.has(meter.meter_id);
                let whatIfProjected: number | null = null;
                let whatIfWillCross = false;
                if (canShowWhatIf && whatIfOpen) {
                  const todayIso = new Date().toISOString().slice(0, 10);
                  const daysRemaining = Math.max(
                    0,
                    daysBetween(todayIso, activeMeter!.expected_billing_period_end!)
                  );
                  whatIfProjected = meter.cumulative_units + activeRateForWhatIf! * daysRemaining;
                  whatIfWillCross =
                    meter.next_slab_min != null && whatIfProjected >= meter.next_slab_min;
                }

                return (
                  <div key={meter.meter_id} className="gym-exercise-card">
                    <h3>
                      {meter.label}{" "}
                      <span
                        className={`gym-badge ${
                          meter.status === "active"
                            ? "electricity-badge-active"
                            : "electricity-badge-standby"
                        }`}
                      >
                        {meter.status === "active" ? "In use" : "Standby"}
                      </span>
                    </h3>

                    {meter.daily_rate != null ? (
                      <>
                        <div className="electricity-detail-row">
                          <span className="electricity-detail-label">Daily rate</span>
                          <span className="electricity-detail-value">
                            {meter.daily_rate.toFixed(1)} units/day
                          </span>
                        </div>
                        <div className="electricity-detail-row">
                          <span className="electricity-detail-label">Weekly rate</span>
                          <span className="electricity-detail-value">
                            {weeklyRate!.toFixed(0)} units/week
                          </span>
                        </div>
                        {meter.last_billed_reading && meter.last_reading && (
                          <p className="electricity-meter-units">
                            {Math.round(meter.cumulative_units)} units used from{" "}
                            {formatDate(meter.last_billed_reading.reading_date)} to{" "}
                            {formatDate(meter.last_reading.reading_date)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="gym-preview-item">
                        Log a couple more readings to see this meter's rate.
                      </p>
                    )}

                    {meter.projected_units_at_billing_end != null &&
                      meter.expected_billing_period_end && (
                        <p
                          className="electricity-nudge"
                          style={{
                            background: "var(--accent-bg)",
                            color: "var(--text-h)",
                            fontWeight: willCrossSlab ? 600 : undefined,
                          }}
                        >
                          Projected ~{Math.round(meter.projected_units_at_billing_end)} units by{" "}
                          {formatDate(meter.expected_billing_period_end)}
                          {willCrossSlab && " — would cross into the next slab"}
                        </p>
                      )}

                    {canShowWhatIf && (
                      <>
                        <button
                          type="button"
                          className="gym-range-tab"
                          style={{ marginBottom: 8 }}
                          onClick={() =>
                            setWhatIfMeterIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(meter.meter_id)) {
                                next.delete(meter.meter_id);
                              } else {
                                next.add(meter.meter_id);
                              }
                              return next;
                            })
                          }
                        >
                          {whatIfOpen ? "Hide" : "See projection if I switch to this meter"}
                        </button>

                        {whatIfOpen && whatIfProjected != null && (
                          <p
                            className="electricity-nudge"
                            style={{
                              background: "var(--accent-bg)",
                              color: "var(--text-h)",
                              fontWeight: whatIfWillCross ? 600 : undefined,
                            }}
                          >
                            Using {activeMeter!.label}'s current pace (
                            {activeRateForWhatIf!.toFixed(1)} units/day), switching to{" "}
                            {meter.label} now would put it at ~{Math.round(whatIfProjected)} units
                            by {formatDate(activeMeter!.expected_billing_period_end!)}
                            {whatIfWillCross && " — would cross into the next slab"}
                          </p>
                        )}
                      </>
                    )}

                    <p className="gym-volume-total">Recent readings</p>
                    {readingsLoading && readings.length === 0 ? (
                      <span className="skeleton skeleton-line" />
                    ) : readings.length === 0 ? (
                      <p className="gym-preview-item">
                        {cycleStart
                          ? "No readings logged yet this billing cycle."
                          : "No readings logged yet."}
                      </p>
                    ) : (
                      <div className="gym-bars">
                        {readings.map((r) => (
                          <div key={r.id} className="gym-bar-row">
                            <span className="gym-bar-label">{formatShortDate(r.reading_date)}</span>
                            <span className="gym-bar-track">
                              <span
                                className="gym-bar-fill"
                                style={{ width: `${((r.units_consumed ?? 0) / maxUnits) * 100}%` }}
                              />
                            </span>
                            <span className="gym-bar-value">{r.units_consumed} units</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {activeTab === "monthly" && (
            <>
              <p className="electricity-field-hint">
                Costs are your entered bill amount when available, otherwise a rough estimate.
              </p>

              {meters.map((meter) => {
                const periods = billingPeriods(readingsByMeter[meter.meter_id] ?? []);

                return (
                  <div key={meter.meter_id} className="gym-exercise-card">
                    <h3>
                      {meter.label}{" "}
                      <span
                        className={`gym-badge ${
                          meter.status === "active"
                            ? "electricity-badge-active"
                            : "electricity-badge-standby"
                        }`}
                      >
                        {meter.status === "active" ? "In use" : "Standby"}
                      </span>
                    </h3>

                    {readingsLoading && periods.length === 0 ? (
                      <span className="skeleton skeleton-line" />
                    ) : periods.length === 0 ? (
                      <p className="gym-preview-item">
                        No completed billing periods yet — log a billed reading to start tracking
                        history.
                      </p>
                    ) : (
                      periods.map((p, i) => (
                        <div
                          key={p.start}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            padding: "12px 0",
                            borderBottom:
                              i < periods.length - 1 ? "1px solid var(--border)" : "none",
                          }}
                        >
                          <span
                            className="electricity-detail-label"
                            style={{ fontSize: 13, textTransform: "none", letterSpacing: 0 }}
                            title={`${formatShortDate(p.start)} – ${formatShortDate(p.end)}`}
                          >
                            {formatMonthYear(p.start)}
                          </span>
                          <span style={{ textAlign: "right" }}>
                            <span
                              style={{
                                display: "block",
                                fontSize: 20,
                                fontWeight: 700,
                                color: "var(--success)",
                              }}
                            >
                              {p.total} units
                            </span>
                            <span className="electricity-meter-units">
                              {p.billedAmount != null
                                ? `₹${p.billedAmount.toLocaleString()} your bill`
                                : `~₹${estimateCost(p.total).toLocaleString()} estimated`}
                            </span>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Electricity;
