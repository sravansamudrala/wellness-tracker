import { useTheme } from "../../context/ThemeContext";

const OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

function AppearanceSettingsSection() {
  const { preference, setPreference } = useTheme();

  return (
    <details className="settings-card">
      <summary>🎨 Appearance</summary>
      <div className="settings-card-body">
        <div className="settings-field settings-field-stacked">
          <label>Theme</label>
          <div className="settings-segmented">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`settings-segmented-option${
                  preference === opt.value ? " is-active" : ""
                }`}
                onClick={() => setPreference(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}

export default AppearanceSettingsSection;
