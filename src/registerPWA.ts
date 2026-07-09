import { registerSW } from "virtual:pwa-register";

const UPDATE_INTERVAL_MS = 60 * 60 * 1000; // check for a new deployed version hourly

// With registerType "autoUpdate", once registration.update() detects a new
// service worker it installs + skipWaiting/clientsClaim, and this registration
// auto-reloads the page. The problem on mobile is that nothing triggers that
// detection while the app is alive, so we drive it ourselves.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    // Periodic background check.
    setInterval(() => registration.update(), UPDATE_INTERVAL_MS);

    // Check when the app returns to the foreground — the key case for mobile
    // PWAs, which resume from a frozen state instead of doing a fresh load.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") registration.update();
    });
  },
});
