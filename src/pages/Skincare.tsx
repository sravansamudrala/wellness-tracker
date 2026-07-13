import { useState, useEffect } from "react";
import { SkeletonCard } from "../components/Skeleton";
import { getToday, updateToday } from "../services/skincareApi";
import { getStats } from "../services/skincareStatsApi";
import type { SkincareStats } from "../services/skincareStatsApi";

const defaultRoutine = {
  faceWash: false,
  vitaminC: false,
  moisturizer: false,
  sunscreen: false,
  lipcare: false,
  cleanser: false,
  eveningMoisturizer: false,
};

function Skincare() {
  const [routine, setRoutine] = useState(defaultRoutine);
  const [stats, setStats] = useState<SkincareStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadRoutine() {
      try {
        const data = await getToday();
        if (cancelled) return;

        setRoutine({
          faceWash: data.face_wash,
          vitaminC: data.vitamin_c,
          moisturizer: data.moisturizer,
          sunscreen: data.sunscreen,
          lipcare: data.lipcare,
          cleanser: data.cleanser,
          eveningMoisturizer: data.evening_moisturizer,
        });
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRoutine();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getStats();
        setStats(data);
      } catch {
        // Stats are non-critical — leave them hidden if the request fails.
      }
    }

    loadStats();
  }, []);

  const completedCount = Object.values(routine).filter(Boolean).length;
  const totalCount = Object.keys(routine).length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const morningCompleted =
    Number(routine.faceWash) +
    Number(routine.vitaminC) +
    Number(routine.moisturizer) +
    Number(routine.sunscreen) +
    Number(routine.lipcare);

  const eveningCompleted =
    Number(routine.cleanser) + Number(routine.eveningMoisturizer);

  const saveRoutine = async (updatedRoutine: typeof defaultRoutine) => {
    const previous = routine;

    setRoutine(updatedRoutine);
    setSaveError(false);

    try {
      await updateToday({
        face_wash: updatedRoutine.faceWash,
        vitamin_c: updatedRoutine.vitaminC,
        moisturizer: updatedRoutine.moisturizer,
        sunscreen: updatedRoutine.sunscreen,
        lipcare: updatedRoutine.lipcare,
        cleanser: updatedRoutine.cleanser,
        evening_moisturizer: updatedRoutine.eveningMoisturizer,
      });
    } catch {
      // Roll back so the checkbox state can't silently diverge from the server.
      setRoutine(previous);
      setSaveError(true);
    }
  };

  return (
    <div className="skincare-container">
      <h2>🧴 Skincare</h2>

      {loading && (
        <>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={5} />
        </>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load your routine.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {stats && (
            <div className="progress-card">
              <h3>📊 Your Skincare Stats</h3>

              <p>{stats.message}</p>

              <p>
                🔥 Current Streak:{" "}
                <strong>
                  {stats.current_streak}{" "}
                  {stats.current_streak === 1 ? "day" : "days"}
                </strong>
              </p>

              <p>
                🏆 Best Streak:{" "}
                <strong>
                  {stats.best_streak} {stats.best_streak === 1 ? "day" : "days"}
                </strong>
              </p>

              <p>
                📈 Average Completion:{" "}
                <strong>{stats.average_completion}%</strong>
              </p>

              <p>
                📅 Total Days Tracked: <strong>{stats.total_days}</strong>
              </p>
            </div>
          )}

          <div className="progress-card">
            <h3>Today's Progress</h3>

            <div>
              <progress value={progress} max="100"></progress>
              <p>{progress}%</p>
            </div>
            {progress === 0 && <p>💪 Let's start today's routine!</p>}

            {progress > 0 && progress < 100 && (
              <p>👍 Great progress! Keep going.</p>
            )}

            {progress === 100 && (
              <p>🎉 Amazing! Today's skincare routine is complete!</p>
            )}
          </div>

          {saveError && (
            <p className="status-error">
              Couldn't save that change — check your connection and try again.
            </p>
          )}

          <h3>Morning Routine</h3>

          <ul>
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={routine.faceWash}
                  onChange={(e) =>
                    saveRoutine({ ...routine, faceWash: e.target.checked })
                  }
                />
                Face Wash
              </label>
            </li>
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={routine.vitaminC}
                  onChange={(e) =>
                    saveRoutine({ ...routine, vitaminC: e.target.checked })
                  }
                />
                Vitamin C
              </label>
            </li>
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={routine.moisturizer}
                  onChange={(e) =>
                    saveRoutine({ ...routine, moisturizer: e.target.checked })
                  }
                />
                Moisturizer
              </label>
            </li>
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={routine.sunscreen}
                  onChange={(e) =>
                    saveRoutine({ ...routine, sunscreen: e.target.checked })
                  }
                />
                Sunscreen
              </label>
            </li>
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={routine.lipcare}
                  onChange={(e) =>
                    saveRoutine({ ...routine, lipcare: e.target.checked })
                  }
                />
                Lip Care
              </label>
            </li>
            <p>{morningCompleted} / 5 Completed</p>
          </ul>

          <h3>Evening Routine</h3>

          <ul>
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={routine.cleanser}
                  onChange={(e) =>
                    saveRoutine({ ...routine, cleanser: e.target.checked })
                  }
                />
                Cleanser
              </label>
            </li>
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={routine.eveningMoisturizer}
                  onChange={(e) =>
                    saveRoutine({
                      ...routine,
                      eveningMoisturizer: e.target.checked,
                    })
                  }
                />
                Moisturizer
              </label>
            </li>
            <p>{eveningCompleted} / 2 Completed</p>
          </ul>
        </>
      )}
    </div>
  );
}

export default Skincare;