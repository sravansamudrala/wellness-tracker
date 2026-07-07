import { NavLink } from "react-router-dom";
import "./BottomNavigation.css";

function BottomNavigation() {
  return (
    <nav>
      <NavLink to="/">🏠</NavLink>
      <NavLink to="/food">🍽</NavLink>
      <NavLink to="/skincare">🧴</NavLink>
      <NavLink to="/weight">⚖</NavLink>
      <NavLink to="/water">💧</NavLink>
      <NavLink to="/history">📈</NavLink>
      <NavLink to="/settings">⚙</NavLink>
    </nav>
  );
}

export default BottomNavigation;