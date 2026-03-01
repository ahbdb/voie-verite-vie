import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function buildSitemapXml(baseUrl: string, paths: string[]) {
  const lastmod = new Date().toISOString();
  const urlset = paths
    .map((p) => {
      const loc = `${baseUrl}${p}`;
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        "    <changefreq>weekly</changefreq>",
        "    <priority>0.7</priority>",
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
    urlset,
    "</urlset>",
    "",
  ].join("\n");
}

function sitemapPlugin(): Plugin {
  return {
    name: "3v-sitemap",
    apply: "build" as const,
    async generateBundle(this: any) {
      // Dynamically import site-links only at build time
      const { siteLinks } = await import('./src/data/site-links');
      const baseUrl = "https://voie-verite-vie.org";
      const paths = Array.from(new Set(siteLinks.flatMap((c: any) => c.items.map((i: any) => i.href))));
      const xml = buildSitemapXml(baseUrl, paths);
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: xml });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    middlewareMode: false,
  },
  plugins: [
    react(),
    sitemapPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
