import { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import { getToday } from "../services/skincareApi";
import { getNextCategory } from "../services/gymApi";
import { getWaterToday, getWaterSettings } from "../services/waterApi";
import { getToday as getFoodToday } from "../services/foodApi";

function Dashboard() {
  const [skincareProgress, setSkincareProgress] = useState<number | null>(null);
  const [skincareLoading, setSkincareLoading] = useState(true);
  const [gymSummary, setGymSummary] = useState<string | null>(null);
  const [gymLoading, setGymLoading] = useState(true);
  const [waterLiters, setWaterLiters] = useState<number | null>(null);
  const [waterGoalLiters, setWaterGoalLiters] = useState<number | null>(null);
  const [waterLoading, setWaterLoading] = useState(true);
  const [foodCalories, setFoodCalories] = useState<number | null>(null);
  const [foodLoading, setFoodLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSkincare() {
      try {
        const data = await getToday();
        if (cancelled) return;
        const completed = data.habits.filter((h) => h.completed).length;
        setSkincareProgress(
          data.habits.length
            ? Math.round((completed / data.habits.length) * 100)
            : 0
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
        const next = await getNextCategory();
        if (cancelled) return;

        setGymSummary(
          next.muscle_group ? `Next: ${next.muscle_group.name}` : "—"
        );
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

    async function loadFood() {
      try {
        const data = await getFoodToday();
        if (cancelled) return;
        setFoodCalories(data.total_calories);
      } catch {
        // Leave calories unknown if the request fails.
      } finally {
        if (!cancelled) setFoodLoading(false);
      }
    }

    loadFood();
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
        <DashboardCard
          to="/gym"
          icon="🏋️"
          title="Gym"
          loading={gymLoading}
          wide
        >
          <p className="dash-value">{gymSummary ?? "—"}</p>
        </DashboardCard>

        <DashboardCard
          to="/water"
          icon="💧"
          title="Water"
          loading={waterLoading}
        >
          <p className="dash-value">
            {(waterLiters ?? 0).toFixed(1)}L /{" "}
            {(waterGoalLiters ?? 2).toFixed(1)}L
          </p>
        </DashboardCard>

        <DashboardCard
          to="/skincare"
          icon="🧴"
          title="Skincare"
          loading={skincareLoading}
        >
          <progress value={skincareProgress ?? 0} max="100" />
          <p className="dash-value">{skincareProgress ?? 0}% complete</p>
        </DashboardCard>

        <DashboardCard to="/food" icon="🥗" title="Food" loading={foodLoading}>
          <p className="dash-value">{foodCalories ?? 0} kcal</p>
        </DashboardCard>

        <DashboardCard to="/weight" icon="⚖️" title="Weight">
          <p className="dash-value dash-muted">Coming soon</p>
        </DashboardCard>
      </div>
    </div>
  );
}

export default Dashboard;
