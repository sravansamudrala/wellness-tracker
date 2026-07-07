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

function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/food" element={<Food />} />
        <Route path="/skincare" element={<Skincare />} />
        <Route path="/weight" element={<Weight />} />
        <Route path="/water" element={<Water />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <BottomNavigation />
    </>
  );
}

export default App;