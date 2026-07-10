import { useEffect, useState } from "react";
import {
  getReminderSettings,
  updateReminderSettings,
} from "../services/reminderSettingsApi";
import { showTestNotification } from "../utils/notifications";
import { subscribeToPush } from "../services/pushApi";

function Settings() {
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningTime, setEveningTime] = useState("21:30");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const data = await getReminderSettings();
        if (cancelled) return;

        setMorningTime(data.morning_time.substring(0, 5));
        setEveningTime(data.evening_time.substring(0, 5));
        setNotificationsEnabled(data.notifications_enabled);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  // Turning the toggle on must register a push subscription first (needs the
  // permission prompt, which iOS only allows from a user gesture like this).
  async function handleNotificationsToggle(checked: boolean) {
    setPushError(null);

    if (!checked) {
      setNotificationsEnabled(false);
      return;
    }

    try {
      const subscribed = await subscribeToPush();
      if (subscribed) {
        setNotificationsEnabled(true);
      } else {
        setNotificationsEnabled(false);
        setPushError("Notification permission was denied.");
      }
    } catch (e) {
      setNotificationsEnabled(false);
      setPushError(
        e instanceof Error ? e.message : "Couldn't enable notifications."
      );
    }
  }

  async function saveSettings() {
    setSaving(true);
    setSaveError(false);

    try {
      await updateReminderSettings({
        morning_time: morningTime,
        evening_time: eveningTime,
        notifications_enabled: notificationsEnabled,
      });

      alert("Reminder settings saved!");
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-container">
      <h2>⚙️ Settings</h2>

      {loading && (
        <p className="status-msg">Loading… (the server may be waking up)</p>
      )}

      {!loading && error && (
        <div className="status-error">
          <p>Couldn't load your settings.</p>
          <button onClick={retryLoad}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
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
          onChange={(e) => handleNotificationsToggle(e.target.checked)}
        />
        Enable Notifications
      </label>

      {pushError && <p className="status-error">{pushError}</p>}

      <br />
      <br />

          <button onClick={saveSettings} disabled={saving}>
            {saving ? "Saving…" : "Save Reminder Settings"}
          </button>

          {saveError && (
            <p className="status-error">
              Couldn't save your settings — check your connection and try again.
            </p>
          )}

          <br />
          <br />

          <button onClick={showTestNotification}>🔔 Test Notification</button>
        </>
      )}
    </div>
  );
}

export default Settings;
