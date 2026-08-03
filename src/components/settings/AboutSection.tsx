function AboutSection() {
  return (
    <details className="settings-card">
      <summary>ℹ️ About</summary>
      <div className="settings-card-body settings-about-body">
        <p>
          Small daily habits, tracked in one place — skincare, hydration,
          workouts, and meals, made simple.
        </p>
        <p className="settings-about-muted">Wellness Tracker v{__APP_VERSION__}</p>
        <p className="settings-about-muted">
          Questions or feedback?{" "}
          <a href="mailto:hello.wellnesstracker@gmail.com" className="auth-link">
            Contact us
          </a>
        </p>
        <p className="settings-about-muted">
          © 2026 Wellness Tracker. All rights reserved.
        </p>
      </div>
    </details>
  );
}

export default AboutSection;