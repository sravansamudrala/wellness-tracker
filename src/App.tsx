import Header from "./components/Header";
import BottomNavigation from "./components/BottomNavigation";
import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Food from "./pages/Food";
import Skincare from "./pages/Skincare";
import Weight from "./pages/Weight";
import Water from "./pages/Water";
import History from "./pages/History";
import Settings from "./pages/Settings";
import GymHome from "./pages/GymHome";
import GymWorkout from "./pages/GymWorkout";
import GymPlans from "./pages/GymPlans";
import GymPlanDetail from "./pages/GymPlanDetail";
import GymHistory from "./pages/GymHistory";
import GymSessionDetail from "./pages/GymSessionDetail";
import GymInsights from "./pages/GymInsights";

function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* Food is retained but no longer in the bottom nav (replaced by Gym). */}
        <Route path="/food" element={<Food />} />
        <Route path="/skincare" element={<Skincare />} />
        <Route path="/weight" element={<Weight />} />
        <Route path="/water" element={<Water />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/gym" element={<GymHome />} />
        <Route path="/gym/workout" element={<GymWorkout />} />
        <Route path="/gym/plans" element={<GymPlans />} />
        <Route path="/gym/plans/:planId" element={<GymPlanDetail />} />
        <Route path="/gym/insights" element={<GymInsights />} />
        <Route path="/gym/history" element={<GymHistory />} />
        <Route path="/gym/history/:sessionId" element={<GymSessionDetail />} />
      </Routes>
      <BottomNavigation />
    </>
  );
}

export default App;