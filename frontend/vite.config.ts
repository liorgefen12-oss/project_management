import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // must match the frontend port - (backend FRONTEND_ORIGIN)
    fs: { allow: [".."] }, // serve shared images from the repo-root assets/ folder
    proxy: {
      "/api": {
        //Match requests starting with /api
        target: "http://localhost:3000", //retarget to the backend port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        //backend endpoint routes dont have the "api" prefix, so it needs removing
      },
    },
  },
});
