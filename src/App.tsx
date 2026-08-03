import Header from "./components/Header";
import BottomNavigation from "./components/BottomNavigation";
import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Food from "./pages/Food";
import Skincare from "./pages/Skincare";
import Weight from "./pages/Weight";
import Water from "./pages/Water";
import Settings from "./pages/Settings";
import GymHome from "./pages/GymHome";
import GymLog from "./pages/GymLog";
import GymHistory from "./pages/GymHistory";
import GymSessionDetail from "./pages/GymSessionDetail";
import GymInsights from "./pages/GymInsights";
import Electricity from "./pages/Electricity";
import ElectricityLogReading from "./pages/ElectricityLogReading";
import ElectricitySwitchMeter from "./pages/ElectricitySwitchMeter";

function App() {
  const { isAuthenticated, hasFeature } = useAuth();

  return (
    <>
      {isAuthenticated && <Header />}

      <Routes>
        {/* Public. If already logged in, bounce away from the login screen. */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {isAuthenticated ? (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/food" element={<Food />} />
            <Route path="/skincare" element={<Skincare />} />
            <Route path="/weight" element={<Weight />} />
            <Route path="/water" element={<Water />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/gym" element={<GymHome />} />
            <Route path="/gym/log" element={<GymLog />} />
            <Route path="/gym/insights" element={<GymInsights />} />
            <Route path="/gym/history" element={<GymHistory />} />
            <Route path="/gym/history/:sessionId" element={<GymSessionDetail />} />
            {hasFeature("electricity_tracker") && (
              <>
                <Route path="/electricity" element={<Electricity />} />
                <Route path="/electricity/log" element={<ElectricityLogReading />} />
                <Route path="/electricity/switch" element={<ElectricitySwitchMeter />} />
              </>
            )}
          </>
        ) : (
          // Not logged in → any route falls through to the login screen.
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>

      {isAuthenticated && <BottomNavigation />}
    </>
  );
}

export default App;