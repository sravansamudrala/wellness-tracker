import { useState, useEffect } from "react";
import { getToday, updateToday } from "../services/skincareApi";

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
  useEffect(() => {
    async function loadRoutine() {
      console.log("Loading skincare from API...");

      const data = await getToday();

      console.log(data);

      setRoutine({
        faceWash: data.face_wash,
        vitaminC: data.vitamin_c,
        moisturizer: data.moisturizer,
        sunscreen: data.sunscreen,
        lipcare: data.lipcare,
        cleanser: data.cleanser,
        eveningMoisturizer: data.evening_moisturizer,
      });
    }

    loadRoutine();
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
    setRoutine(updatedRoutine);
    await updateToday({
      face_wash: updatedRoutine.faceWash,
      vitamin_c: updatedRoutine.vitaminC,
      moisturizer: updatedRoutine.moisturizer,
      sunscreen: updatedRoutine.sunscreen,
      lipcare: updatedRoutine.lipcare,
      cleanser: updatedRoutine.cleanser,
      evening_moisturizer: updatedRoutine.eveningMoisturizer,
    });
  };

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

      <button onClick={() => setRoutine(defaultRoutine)}>
        Reset Today's Routine
      </button>
    </div>
  );
}

export default Skincare;
