import { useEffect, useState } from "react";
import { getHistory } from "../services/skincareHistoryApi";
import type { SkincareHistoryItem } from "../services/skincareHistoryApi";

function History() {
  const [history, setHistory] = useState<SkincareHistoryItem[]>([]);

  useEffect(() => {
    async function loadHistory() {
      const data = await getHistory();
      setHistory(data);
    }

    loadHistory();
  }, []);

  return (
    <div className="history-container">
      <h2>📅 Skincare History</h2>

      {history.length === 0 && <p>No skincare history yet.</p>}

      {history.map((item) => (
        <div key={item.date} className="history-card">
          <h3>{item.date}</h3>

          <p>
            {item.completed} / {item.total} Completed
          </p>

          <progress value={item.progress} max="100" />

          <p>{item.progress}%</p>
        </div>
      ))}
    </div>
  );
}

export default History;
