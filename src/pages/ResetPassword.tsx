import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { AxiosError } from "axios";

import * as authApi from "../services/authApi";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing its token — request a new one.");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      navigate("/login");
    } catch (err) {
      const detail =
        err instanceof AxiosError ? err.response?.data?.detail : null;
      setError(
        typeof detail === "string"
          ? detail
          : "Something went wrong — please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>🌿 Wellness Tracker</h2>

      <div className="auth-card">
        <h3>Choose a new password</h3>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="password"
            placeholder="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          {error && <p className="status-error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Please wait…" : "Reset password"}
          </button>
        </form>

        <p className="auth-toggle">
          <Link to="/login" className="auth-link">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;