import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // must match backend FRONTEND_ORIGIN
    fs: { allow: [".."] }, // serve shared images from the repo-root assets/ folder
  },
});
