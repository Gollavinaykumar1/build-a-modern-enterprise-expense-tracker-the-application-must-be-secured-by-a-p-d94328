import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/build-a-modern-enterprise-expense-tracker-the-application-must-be-secured-by-a-p-d94328/",
  build: { outDir: "dist", assetsDir: "assets" },
  server: { port: 3000 },
});
