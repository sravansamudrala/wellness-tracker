import { useEffect, useState } from "react";
import { getMe, updateMe } from "../../services/authApi";

function ProfileSettingsSection() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await getMe();
        if (cancelled) return;

        setUsername(data.username ?? "");
        setEmail(data.email);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  async function saveProfile() {
    setSaving(true);
    setSaveError(null);

    try {
      const updated = await updateMe({ username: username || undefined, email });
      setUsername(updated.username ?? "");
      setEmail(updated.email);
      alert("Profile updated!");
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } };
      setSaveError(
        err.response?.data?.detail ??
          "Couldn't save your profile — check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="status-msg settings-card-body">
        Loading… (the server may be waking up)
      </p>
    );
  }

  if (error) {
    return (
      <div className="status-error settings-card-body">
        <p>Couldn't load your profile.</p>
        <button onClick={retryLoad}>Retry</button>
      </div>
    );
  }

  return (
    <div className="settings-card-body">
      <div className="settings-field">
        <label htmlFor="profile-username">Username</label>
        <input
          id="profile-username"
          type="text"
          placeholder="Not set"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="settings-field">
        <label htmlFor="profile-email">Email</label>
        <input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button
        className="settings-save-btn"
        onClick={saveProfile}
        disabled={saving}
      >
        {saving ? "Saving…" : "Save Profile"}
      </button>

      {saveError && <p className="status-error">{saveError}</p>}
    </div>
  );
}

export default ProfileSettingsSection;
