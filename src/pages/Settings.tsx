import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProfileSettingsSection from "../components/settings/ProfileSettingsSection";
import ReminderSettingsSection from "../components/settings/ReminderSettingsSection";
import AboutSection from "../components/settings/AboutSection";
import LogoutSection from "../components/settings/LogoutSection";

function Settings() {
  const { logout } = useAuth();
  const [profileOpened, setProfileOpened] = useState(false);
  const [remindersOpened, setRemindersOpened] = useState(false);

  return (
    <div className="settings-container">
      <h2>👤 Me</h2>

      <details
        className="settings-card"
        onToggle={(e) => {
          if (e.currentTarget.open) setProfileOpened(true);
        }}
      >
        <summary>👤 Profile</summary>
        {profileOpened && <ProfileSettingsSection />}
      </details>

      <details
        className="settings-card"
        onToggle={(e) => {
          if (e.currentTarget.open) setRemindersOpened(true);
        }}
      >
        <summary>🔔 Skincare Reminders</summary>
        {remindersOpened && <ReminderSettingsSection />}
      </details>

      <AboutSection />

      <LogoutSection onLogout={logout} />
    </div>
  );
}

export default Settings;
