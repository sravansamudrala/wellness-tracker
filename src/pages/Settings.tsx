import { useAuth } from "../context/AuthContext";
import ReminderSettingsSection from "../components/settings/ReminderSettingsSection";
import LogoutSection from "../components/settings/LogoutSection";

function Settings() {
  const { logout } = useAuth();

  return (
    <div className="settings-container">
      <h2>⚙️ Settings</h2>

      <ReminderSettingsSection />

      <LogoutSection onLogout={logout} />
    </div>
  );
}

export default Settings;