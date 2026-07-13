import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate("/");
    } catch (err) {
      // Surface the backend's message (e.g. "Incorrect email or password").
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

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
  };

  return (
    <div className="auth-container">
      <h2>🌿 Wellness Tracker</h2>

      <div className="auth-card">
        <h3>{mode === "login" ? "Welcome back" : "Create your account"}</h3>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          {error && <p className="status-error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting
              ? "Please wait…"
              : mode === "login"
              ? "Log in"
              : "Sign up"}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button type="button" className="auth-link" onClick={toggleMode}>
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;