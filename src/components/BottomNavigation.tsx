import { NavLink } from "react-router-dom";
import "./BottomNavigation.css";

const TABS: { to: string; icon: string; label: string }[] = [
  { to: "/", icon: "🏠", label: "Home" },
  { to: "/gym", icon: "🏋️", label: "Gym" },
  { to: "/skincare", icon: "🧴", label: "Skin" },
  { to: "/weight", icon: "⚖️", label: "Weight" },
  { to: "/water", icon: "💧", label: "Water" },
  { to: "/history", icon: "📈", label: "History" },
  { to: "/settings", icon: "⚙️", label: "Settings" },
];

function BottomNavigation() {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className="bottom-nav-tab"
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNavigation;
