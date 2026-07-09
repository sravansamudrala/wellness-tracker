import { useEffect, useState } from "react";
import { getHistory } from "../services/skincareHistoryApi";
import type { SkincareHistoryItem } from "../services/skincareHistoryApi";

function History() {
  const [history, setHistory] = useState<SkincareHistoryItem[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const data = await getHistory();
        if (cancelled) return;
        setHistory(data);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  function getStatusEmoji(progress: number) {
    if (progress === 100) return "🟢";
    if (progress >= 50) return "🟡";
    return "🔴";
  }

  function getDisplayDate(date: string, index: number) {
    if (index === 0) return "Today";
    if (index === 1) return "Yesterday";

    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="history-container">
      <h2>📅 Skincare History</h2>

      {loading && (
        <p className="status-msg">Loading… (the server may be waking up)</p>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load your history.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <p className="status-msg">No skincare history yet.</p>
      )}

      {!loading &&
        !error &&
        history.map((item, index) => (
        <div
          key={item.date}
          className="history-card"
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <h3>
            {getStatusEmoji(item.progress)} {getDisplayDate(item.date, index)}
          </h3>

          <p>
            {item.completed} / {item.total} Completed
          </p>

          <progress value={item.progress} max="100" />

          <p>{item.progress}%</p>

          <button
            onClick={() =>
              setExpandedDate(expandedDate === item.date ? null : item.date)
            }
          >
            {expandedDate === item.date ? "Hide Details" : "View Details"}
          </button>

          {expandedDate === item.date && (
            <>
              <h4>Morning</h4>

              <p>{item.face_wash ? "✅" : "❌"} Face Wash</p>
              <p>{item.vitamin_c ? "✅" : "❌"} Vitamin C</p>
              <p>{item.moisturizer ? "✅" : "❌"} Moisturizer</p>
              <p>{item.sunscreen ? "✅" : "❌"} Sunscreen</p>
              <p>{item.lipcare ? "✅" : "❌"} Lip Care</p>

              <h4>Evening</h4>

              <p>{item.cleanser ? "✅" : "❌"} Cleanser</p>
              <p>{item.evening_moisturizer ? "✅" : "❌"} Moisturizer</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default History;
