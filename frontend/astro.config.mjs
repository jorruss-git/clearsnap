import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://clearsnap.app",
  output: "static",
  integrations: [preact(), sitemap()],
  vite: {
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
