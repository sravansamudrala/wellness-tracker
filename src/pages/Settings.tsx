import { useEffect, useState } from "react";
import {
  getReminderSettings,
  updateReminderSettings,
} from "../services/reminderSettingsApi";
import { showTestNotification } from "../utils/notifications";

function Settings() {
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningTime, setEveningTime] = useState("21:30");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const data = await getReminderSettings();

      setMorningTime(data.morning_time.substring(0, 5));
      setEveningTime(data.evening_time.substring(0, 5));
      setNotificationsEnabled(data.notifications_enabled);
    }

    loadSettings();
  }, []);

  async function saveSettings() {
    await updateReminderSettings({
      morning_time: morningTime,
      evening_time: eveningTime,
      notifications_enabled: notificationsEnabled,
    });

    alert("Reminder settings saved!");
  }

  return (
    <div className="settings-container">
      <h2>⚙️ Settings</h2>

      <h3>🔔 Skincare Reminders</h3>

      <div>
        <label>Morning Reminder</label>
        <br />
        <input
          type="time"
          value={morningTime}
          onChange={(e) => setMorningTime(e.target.value)}
        />
      </div>

      <br />

      <div>
        <label>Evening Reminder</label>
        <br />
        <input
          type="time"
          value={eveningTime}
          onChange={(e) => setEveningTime(e.target.value)}
        />
      </div>

      <br />

      <label>
        <input
          type="checkbox"
          checked={notificationsEnabled}
          onChange={(e) => setNotificationsEnabled(e.target.checked)}
        />
        Enable Notifications
      </label>

      <br />
      <br />

      <button onClick={saveSettings}>Save Reminder Settings</button>
      <br />
      <br />

      <button onClick={showTestNotification}>🔔 Test Notification</button>
    </div>
  );
}

export default Settings;
