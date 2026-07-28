interface LogoutSectionProps {
  onLogout: () => void;
}

function LogoutSection({ onLogout }: LogoutSectionProps) {
  return (
    <>
      {/* Always available, even if other settings failed to load. Logging out
          clears the token; App then redirects to /login automatically. */}
      <hr className="settings-divider" />
      <button className="gym-danger-btn" onClick={onLogout}>
        🚪 Log out
      </button>
    </>
  );
}

export default LogoutSection;