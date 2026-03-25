import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://clearsnap.app",
  output: "static",
  integrations: [preact(), sitemap()],
  vite: {
    server: {
      proxy: {
        "/api": "http://localhost:8000",
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Keep hashed filenames for cache-busting
          assetFileNames: "_astro/[name].[hash][extname]",
        },
      },
    },
  },
});
