import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // SOLO endpoints de API del backend
      "/auth": {
        target: "http://165.227.111.180:8081",
        changeOrigin: true,
      },
      "/me": {
        target: "https://renderbackend-ix9y.onrender.com",
        changeOrigin: true,
      },
      // Si tu backend tiene otros endpoints, agrégalos aquí
      // Por ejemplo: /api, /students, /coordinators, etc.
    },
  },
});
