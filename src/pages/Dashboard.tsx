import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getToday } from "../services/skincareApi";
import { getActive, getCurrentSession } from "../services/gymApi";

const SKINCARE_HABITS = [
  "face_wash",
  "vitamin_c",
  "moisturizer",
  "sunscreen",
  "lipcare",
  "cleanser",
  "evening_moisturizer",
] as const;

function Dashboard() {
  const [skincareProgress, setSkincareProgress] = useState<number | null>(null);
  const [gymSummary, setGymSummary] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSkincare() {
      try {
        const data = await getToday();
        if (cancelled) return;

        const completed = SKINCARE_HABITS.filter((habit) => data[habit]).length;
        setSkincareProgress(
          Math.round((completed / SKINCARE_HABITS.length) * 100)
        );
      } catch {
        // Leave progress unknown if the request fails.
      }
    }

    loadSkincare();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadGym() {
      try {
        const [active, current] = await Promise.all([
          getActive(),
          getCurrentSession(),
        ]);
        if (cancelled) return;

        if (current) {
          setGymSummary(`In progress — ${current.name}`);
        } else if (active.next_day) {
          setGymSummary(`Next: ${active.next_day.name}`);
        } else {
          setGymSummary("No active plan");
        }
      } catch {
        // Leave gym summary unknown if the request fails.
      }
    }

    loadGym();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="skincare-container">
      <h2>🏠 Dashboard</h2>

      <h3>Today's Summary</h3>

      <Link to="/skincare">
        🧴 Skincare:{" "}
        {skincareProgress === null
          ? "Loading…"
          : `${skincareProgress}% Complete`}
      </Link>
      <Link to="/gym">
        🏋️ Gym: {gymSummary === null ? "Loading…" : gymSummary}
      </Link>
      <Link to="/food">🥗 Food: Not Started</Link>
      <Link to="/water">💧 Water: 0 L</Link>
      <Link to="/weight">⚖️ Weight: --</Link>
    </div>
  );
}

export default Dashboard;
