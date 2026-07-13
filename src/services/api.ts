import axios from "axios";

// Where the JWT lives in the browser. Exported so AuthContext uses the same key.
export const TOKEN_KEY = "wt_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Render free-tier cold starts can take ~30-60s; without a timeout a request
  // during a cold boot would hang indefinitely.
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the auth token (if any) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(undefined, async (error) => {
  const config = error.config;
  const status = error.response?.status;

  // A 401 on a protected call means our token is missing/expired/invalid.
  // Clear it and send the user to the login screen. We SKIP the auth endpoints
  // themselves (a wrong password there is a normal 401 the Login page shows).
  if (
    status === 401 &&
    config &&
    !config.url?.includes("/api/v1/auth/")
  ) {
    localStorage.removeItem(TOKEN_KEY);
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }

  // Retry once on cold-start-shaped failures — a timeout, a network error (no
  // response), or a 502/503/504 while Render is still booting the service.
  if (!config || config._retried) {
    return Promise.reject(error);
  }

  const isColdStart =
    error.code === "ECONNABORTED" || // request timed out
    !error.response || // network error / server not responding yet
    (status !== undefined && status >= 502 && status <= 504);

  if (!isColdStart) {
    return Promise.reject(error);
  }

  config._retried = true;
  return api(config);
});

export default api;
