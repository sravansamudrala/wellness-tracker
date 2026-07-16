import { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import { getToday } from "../services/skincareApi";
import { getActive, getCurrentSession } from "../services/gymApi";
import { getWaterToday, getWaterSettings } from "../services/waterApi";

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
  const [skincareLoading, setSkincareLoading] = useState(true);
  const [gymSummary, setGymSummary] = useState<string | null>(null);
  const [gymLoading, setGymLoading] = useState(true);
  const [waterLiters, setWaterLiters] = useState<number | null>(null);
  const [waterGoalLiters, setWaterGoalLiters] = useState<number | null>(null);
  const [waterLoading, setWaterLoading] = useState(true);

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
      } finally {
        if (!cancelled) setSkincareLoading(false);
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
        // Leave summary unknown if the request fails.
      } finally {
        if (!cancelled) setGymLoading(false);
      }
    }

    loadGym();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWater() {
      try {
        const [today, settings] = await Promise.all([
          getWaterToday(),
          getWaterSettings(),
        ]);
        if (cancelled) return;

        setWaterLiters(today.amount_ml / 1000);
        setWaterGoalLiters(settings.daily_goal_ml / 1000);
      } catch {
        // Leave water totals unknown if the request fails.
      } finally {
        if (!cancelled) setWaterLoading(false);
      }
    }

    loadWater();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dash-container">
      <h2>🏠 Dashboard</h2>

      <div className="dash-grid">
        <DashboardCard to="/gym" icon="🏋️" title="Gym" loading={gymLoading} wide>
          <p className="dash-value">{gymSummary ?? "—"}</p>
        </DashboardCard>

        <DashboardCard
          to="/skincare"
          icon="🧴"
          title="Skincare"
          loading={skincareLoading}
          wide
        >
          <progress value={skincareProgress ?? 0} max="100" />
          <p className="dash-value">{skincareProgress ?? 0}% complete</p>
        </DashboardCard>

        <DashboardCard to="/food" icon="🥗" title="Food">
          <p className="dash-value dash-muted">Coming soon</p>
        </DashboardCard>

        <DashboardCard to="/water" icon="💧" title="Water" loading={waterLoading}>
          <p className="dash-value">
            {(waterLiters ?? 0).toFixed(1)}L / {(waterGoalLiters ?? 2).toFixed(1)}L
          </p>
        </DashboardCard>

        <DashboardCard to="/weight" icon="⚖️" title="Weight">
          <p className="dash-value dash-muted">—</p>
        </DashboardCard>
      </div>
    </div>
  );
}

export default Dashboard;
