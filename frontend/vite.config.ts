import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isBuild = process.env.NODE_ENV === "production" || process.argv.includes("build");

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;

if (!isBuild && (!rawPort || Number.isNaN(port) || port <= 0)) {
  if (process.env.REPL_ID) {
    throw new Error("PORT environment variable is required but was not provided.");
  }
}

const basePath = process.env.BASE_PATH || "/";

const devPlugins = async () => {
  if (isBuild || process.env.REPL_ID === undefined) return [];
  const plugins = [];
  try {
    plugins.push(
      await import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
      await import("@replit/vite-plugin-cartographer").then((m) =>
        m.cartographer({ root: path.resolve(import.meta.dirname, "..") })
      ),
      await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
    );
  } catch {}
  return plugins;
};

export default defineConfig(async () => ({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    ...(await devPlugins()),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
}));
