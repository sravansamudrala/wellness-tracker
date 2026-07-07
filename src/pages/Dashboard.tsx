import { Link } from "react-router-dom";

function Dashboard() {
  const savedRoutine = localStorage.getItem("skincareRoutine");

  let skincareProgress = 0;

  if (savedRoutine) {
    const routine = JSON.parse(savedRoutine);

    const completedCount = Object.values(routine).filter(Boolean).length;
    const totalCount = Object.keys(routine).length;

    skincareProgress = Math.round((completedCount / totalCount) * 100);
  }

  return (
    <div className="skincare-container">
      <h2>🏠 Dashboard</h2>

      <h3>Today's Summary</h3>

      <Link to="/skincare">🧴 Skincare: {skincareProgress}% Complete</Link>
      <Link to="/food">🥗 Food: Not Started</Link>
      <Link to="/water">💧 Water: 0 L</Link>
      <Link to="/weight">⚖️ Weight: --</Link>
    </div>
  );
}

export default Dashboard;
