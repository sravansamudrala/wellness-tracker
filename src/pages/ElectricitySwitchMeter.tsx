import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "../components/Skeleton";
import { createSwitchEvent, getInsights } from "../services/electricityApi";
import type { InsightsMeter } from "../services/electricityApi";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function ElectricitySwitchMeter() {
  const [meters, setMeters] = useState<InsightsMeter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [readingDate, setReadingDate] = useState(todayIso());
  const [outgoingValue, setOutgoingValue] = useState("");
  const [incomingValue, setIncomingValue] = useState("");
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
  }, []);

  // Switching is always between the two meters that exist — active becomes
  // outgoing, standby becomes incoming. No meter picker needed.
  const outgoing = meters.find((m) => m.status === "active");
  const incoming = meters.find((m) => m.status === "standby");

  const confirmSwitch = async () => {
    if (!incoming) return;
    const outVal = Number(outgoingValue);
    const inVal = Number(incomingValue);
    if (!Number.isFinite(outVal) || !Number.isFinite(inVal)) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createSwitchEvent({
        incoming_meter_id: incoming.meter_id,
        reading_date: readingDate,
        outgoing_reading_value: outVal,
        incoming_reading_value: inVal,
        is_billed_reading: isBilled,
      });
      setSaved(true);
    } catch (err: any) {
      setSaveError(err?.response?.data?.detail ?? "Couldn't switch meters.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="electricity-container">
      <h2>🔀 Switch Meter</h2>

      <Link to="/electricity" className="gym-nav-link">
        ← Back to Electricity
      </Link>

      {loading && <SkeletonCard lines={4} />}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load your meters.</p>
        </div>
      )}

      {!loading && !error && (!outgoing || !incoming) && (
        <div className="status-error">
          <p>You need 2 meters set up before you can switch.</p>
        </div>
      )}

      {!loading && !error && outgoing && incoming && saved && (
        <div className="progress-card">
          <h3>✅ Switched to {incoming.label}</h3>
          <Link to="/electricity" className="gym-nav-link">
            ⚡ Back to Electricity
          </Link>
        </div>
      )}

      {!loading && !error && outgoing && incoming && !saved && (
        <div className="electricity-setup-form">
          {step === 1 ? (
            <>
              <h3>Step 1 — Closing reading for {outgoing.label}</h3>
              <p className="dash-muted">Currently active. This becomes standby.</p>

              <label htmlFor="switch-date">Date</label>
              <input
                id="switch-date"
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
              />

              <label htmlFor="switch-outgoing">
                {outgoing.label} — closing reading
              </label>
              <input
                id="switch-outgoing"
                type="number"
                inputMode="decimal"
                value={outgoingValue}
                onChange={(e) => setOutgoingValue(e.target.value)}
              />

              <label className="electricity-checkbox-row">
                <input
                  type="checkbox"
                  checked={isBilled}
                  onChange={(e) => setIsBilled(e.target.checked)}
                />
                This was the bill reading for {outgoing.label}
              </label>

              <button onClick={() => setStep(2)} disabled={!outgoingValue}>
                Next
              </button>
            </>
          ) : (
            <>
              <h3>Step 2 — Opening reading for {incoming.label}</h3>
              <p className="dash-muted">Becomes active once you confirm.</p>

              <label htmlFor="switch-incoming">
                {incoming.label} — opening reading
              </label>
              <input
                id="switch-incoming"
                type="number"
                inputMode="decimal"
                value={incomingValue}
                onChange={(e) => setIncomingValue(e.target.value)}
              />

              {saveError && <p className="status-error">{saveError}</p>}

              <button onClick={confirmSwitch} disabled={saving || !incomingValue}>
                {saving ? "Switching…" : "Confirm Switch"}
              </button>
              <button
                onClick={() => setStep(1)}
                disabled={saving}
                className="electricity-ghost-btn"
              >
                ← Back
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ElectricitySwitchMeter;
