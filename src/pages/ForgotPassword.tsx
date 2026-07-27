import { useState } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";

import * as authApi from "../services/authApi";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      const detail =
        err instanceof AxiosError ? err.response?.data?.detail : null;
      setError(
        typeof detail === "string"
          ? detail
          : "Something went wrong — please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>🌿 Wellness Tracker</h2>

      <div className="auth-card">
        <h3>Reset your password</h3>

        {message ? (
          <p className="status-msg">{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && <p className="status-error">{error}</p>}

            <button type="submit" disabled={submitting}>
              {submitting ? "Please wait…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="auth-toggle">
          <Link to="/login" className="auth-link">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;