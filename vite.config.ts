import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// The Java API issues HttpOnly cookies, so the SPA reaches it same-origin through this proxy
// (in Docker the nginx container plays the same role).
const api = { "/api": "http://127.0.0.1:8080" };

export default defineConfig({
  plugins: [react()],
  server: { proxy: api },
  preview: { proxy: api },
  test: {
    include: ["src/tests/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    // A developer key in .env.local must never make tests call the real provider.
    env: { VITE_GOOGLE_PLACES_API_KEY: "" },
    setupFiles: ["./src/tests/setup.ts"],
  },
});
