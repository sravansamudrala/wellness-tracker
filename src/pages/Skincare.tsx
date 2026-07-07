import { useState, useEffect } from "react";

const defaultRoutine = {
  faceWash: false,
  vitaminC: false,
  moisturizer: false,
  sunscreen: false,
  cleanser: false,
  eveningMoisturizer: false,
};

function Skincare() {
  const [routine, setRoutine] = useState(() => {
    const savedRoutine = localStorage.getItem("skincareRoutine");

    if (savedRoutine) {
      return JSON.parse(savedRoutine);
    }

    return defaultRoutine;
  });

  const completedCount = Object.values(routine).filter(Boolean).length;
  const totalCount = Object.keys(routine).length;
  const progress = Math.round((completedCount / totalCount) * 100);
  useEffect(() => {
    localStorage.setItem("skincareRoutine", JSON.stringify(routine));
  }, [routine]);
  const morningCompleted =
    Number(routine.faceWash) +
    Number(routine.vitaminC) +
    Number(routine.moisturizer) +
    Number(routine.sunscreen);

  const eveningCompleted =
    Number(routine.cleanser) + Number(routine.eveningMoisturizer);

  return (
    <div className="skincare-container">
      <h2>🧴 Skincare</h2>

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

      <h3>Morning Routine</h3>

      <ul>
        <li>
          <label>
            <input
              type="checkbox"
              checked={routine.faceWash}
              onChange={(e) =>
                setRoutine({ ...routine, faceWash: e.target.checked })
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
                setRoutine({ ...routine, vitaminC: e.target.checked })
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
                setRoutine({ ...routine, moisturizer: e.target.checked })
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
                setRoutine({ ...routine, sunscreen: e.target.checked })
              }
            />
            Sunscreen
          </label>
        </li>
        <p>{morningCompleted} / 4 Completed</p>
      </ul>

      <h3>Evening Routine</h3>

      <ul>
        <li>
          <label>
            <input
              type="checkbox"
              checked={routine.cleanser}
              onChange={(e) =>
                setRoutine({ ...routine, cleanser: e.target.checked })
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
                setRoutine({ ...routine, eveningMoisturizer: e.target.checked })
              }
            />
            Moisturizer
          </label>
        </li>
        <p>{eveningCompleted} / 2 Completed</p>
      </ul>

      <button onClick={() => setRoutine(defaultRoutine)}>
        Reset Today's Routine
      </button>
    </div>
  );
}

export default Skincare;
