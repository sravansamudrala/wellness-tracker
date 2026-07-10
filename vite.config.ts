import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      devOptions: {
        enabled: true,
      },
      registerType: "autoUpdate",
      // Pull our push / notificationclick handlers into the generated SW.
      workbox: {
        importScripts: ["push-sw.js"],
      },
      manifest: {
        name: "AI Wellness Tracker",
        short_name: "Wellness",
        description: "AI-powered Wellness Tracker",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
    }),
  ],
});
