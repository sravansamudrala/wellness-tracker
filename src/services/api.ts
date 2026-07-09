import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Render free-tier cold starts can take ~30-60s; without a timeout a request
  // during a cold boot would hang indefinitely.
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Retry once on cold-start-shaped failures — a timeout, a network error (no
// response), or a 502/503/504 while Render is still booting the service. The
// cron pinger keeps the service warm so this is rare, but it makes the
// occasional genuine cold start (or a transient blip) recover on its own.
api.interceptors.response.use(undefined, async (error) => {
  const config = error.config;

  if (!config || config._retried) {
    return Promise.reject(error);
  }

  const status = error.response?.status;
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