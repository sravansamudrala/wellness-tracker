import { useEffect, useState } from "react";
import { listMeters, shareMeter } from "../../services/electricityApi";
import type { Meter } from "../../services/electricityApi";

function ElectricitySharingSection() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [email, setEmail] = useState<Record<string, string>>({});
  const [sharing, setSharing] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await listMeters();
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

  const submitShare = async (meterId: string) => {
    const trimmed = (email[meterId] ?? "").trim();
    if (!trimmed) return;
    setSharing(meterId);
    setShareError(null);
    try {
      await shareMeter(meterId, trimmed);
      setEmail((prev) => ({ ...prev, [meterId]: "" }));
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setShareError(err?.response?.data?.detail ?? "Couldn't share that meter.");
    } finally {
      setSharing(null);
    }
  };

  if (loading) {
    return <p className="status-msg settings-card-body">Loading…</p>;
  }

  if (error) {
    return (
      <div className="status-error settings-card-body">
        <p>Couldn't load your meters.</p>
        <button onClick={retryLoad}>Retry</button>
      </div>
    );
  }

  const ownedMeters = meters.filter((m) => m.is_owner);

  if (ownedMeters.length === 0) {
    return (
      <p className="status-msg settings-card-body">
        Add a meter on the Electricity page first, then come back here to share it.
      </p>
    );
  }

  return (
    <div className="settings-card-body">
      {ownedMeters.map((meter) => (
        <div className="settings-field settings-field-stacked" key={meter.id}>
          <div>
            <label htmlFor={`electricity-share-${meter.id}`}>{meter.label}</label>
            {meter.shared_with.length > 0 && (
              <p className="settings-about-muted">
                shared with {meter.shared_with.join(", ")}
              </p>
            )}
          </div>
          <div className="electricity-share-row">
            <input
              id={`electricity-share-${meter.id}`}
              type="email"
              placeholder="Their email"
              value={email[meter.id] ?? ""}
              onChange={(e) =>
                setEmail((prev) => ({ ...prev, [meter.id]: e.target.value }))
              }
            />
            <button
              className="settings-save-btn"
              onClick={() => submitShare(meter.id)}
              disabled={sharing === meter.id || !(email[meter.id] ?? "").trim()}
            >
              {sharing === meter.id ? "Sharing…" : "Share"}
            </button>
          </div>
        </div>
      ))}

      {shareError && <p className="status-error">{shareError}</p>}
    </div>
  );
}

export default ElectricitySharingSection;
