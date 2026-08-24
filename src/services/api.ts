import axios from "axios";

// Custom retry/failover bookkeeping stashed on the request config — declared
// here so both interceptors below can read/write them without `any` casts.
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retried?: boolean;
    _triedFallback?: boolean;
  }
}

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

// Sticky for the tab's lifetime once the primary is confirmed suspended, so
// every later request skips straight to the backup instead of re-discovering
// the outage on every single call. A fresh page load resets this, which is
// what lets it self-heal once the primary account is back.
let primarySuspended = false;

// Attach the auth token (if any) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (primarySuspended) {
    const fallbackUrl = import.meta.env.VITE_API_URL_FALLBACK;
    if (fallbackUrl) {
      config.baseURL = fallbackUrl;
      // Already on the backup — don't let a later failure try "falling back"
      // to it again (a no-op that would just waste a retry if it's also down).
      config._triedFallback = true;
    }
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

  if (!config) {
    return Promise.reject(error);
  }

  const fallbackUrl = import.meta.env.VITE_API_URL_FALLBACK;

  // Render's own edge (not our app) returns this exact signature when a
  // service is suspended/unrecognized — e.g. a free-tier account past its
  // usage cap. A same-host retry can't help here, so skip straight to the
  // backup account instead of wasting a round trip.
  const isSuspended = error.response?.headers?.["x-render-routing"] === "no-server";

  if (isSuspended) {
    primarySuspended = true;
    if (fallbackUrl && !config._triedFallback) {
      config._triedFallback = true;
      config.baseURL = fallbackUrl;
      return api(config);
    }
    return Promise.reject(error);
  }

  // Retry once on cold-start-shaped failures — a timeout, a network error (no
  // response), or a 502/503/504 while Render is still booting the service.
  const isColdStart =
    error.code === "ECONNABORTED" || // request timed out
    !error.response || // network error / server not responding yet
    (status !== undefined && status >= 502 && status <= 504);

  if (!isColdStart) {
    return Promise.reject(error);
  }

  if (!config._retried) {
    config._retried = true;
    return api(config);
  }

  // Same-host retry still failed the same way — the primary account itself
  // is likely down (not just a cold boot), not just a slow boot. Fall over to
  // the backup account once, if one is configured.
  if (fallbackUrl && !config._triedFallback) {
    primarySuspended = true;
    config._triedFallback = true;
    config.baseURL = fallbackUrl;
    return api(config);
  }

  return Promise.reject(error);
});

export default api;
