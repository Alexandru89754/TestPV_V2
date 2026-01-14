import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = "TestPV_V2";

export default defineConfig({
  base: `/${repoName}/`,
  plugins: [react()],
});
