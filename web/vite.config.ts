import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";
import { davarApiPlugin } from "./vite.apiPlugin";

const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig(({ mode }) => {
  // Pull parent env for bible API exposure to client (optional NIV)
  const parentEnv = loadEnv(mode, workspaceRoot, "");
  const bibleKey = parentEnv.EXPO_PUBLIC_BIBLE_API_KEY || parentEnv.VITE_BIBLE_API_KEY || "";

  return {
    plugins: [
      react(),
      davarApiPlugin(workspaceRoot),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "apple-touch-icon.png"],
        manifest: {
          name: "Davar — Scripture Playlists",
          short_name: "Davar",
          description: "Listen to or read Scripture playlists curated for your journey",
          theme_color: "#0a0a0a",
          background_color: "#0a0a0a",
          display: "standalone",
          orientation: "portrait-primary",
          start_url: "/",
          icons: [
            { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
            { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.includes("/assets/") && url.pathname.endsWith(".js"),
              handler: "CacheFirst",
              options: {
                cacheName: "davar-js",
                expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: /^https:\/\/api\.scripture\.api\.bible\/.*/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "davar-niv",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "davar-fonts",
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    define: {
      "import.meta.env.EXPO_PUBLIC_BIBLE_API_KEY": JSON.stringify(bibleKey),
      "import.meta.env.VITE_BIBLE_API_KEY": JSON.stringify(bibleKey),
    },
    envDir: workspaceRoot,
    envPrefix: ["VITE_", "EXPO_PUBLIC_"],
    server: {
      port: 5173,
      host: true,
    },
    build: {
      chunkSizeWarningLimit: 5000,
    },
  };
});
