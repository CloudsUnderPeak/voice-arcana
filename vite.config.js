import { defineConfig } from "vite";
import { normalizeSiteUrl, sharePagesPlugin } from "./tools/share-pages.js";

// The CSP from SPEC_TECHNICAL section 7: connect-src 'none' is the technical
// guardrail for "recordings never leave the device". GitHub Pages cannot set
// response headers, so the meta tag is injected at build time; dev mode skips
// it because Vite HMR needs a websocket connection.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
].join("; ");

export default defineConfig({
  // Relative asset URLs work on both user/organization Pages and
  // repository Pages mounted under /<repository>/.
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false,
  },
  plugins: [
    {
      name: "inject-csp-meta",
      apply: "build",
      transformIndexHtml(html) {
        return {
          html,
          tags: [
            {
              tag: "meta",
              attrs: {
                "http-equiv": "Content-Security-Policy",
                content: CONTENT_SECURITY_POLICY,
              },
              injectTo: "head-prepend",
            },
          ],
        };
      },
    },
    {
      // og:image / og:url need absolute URLs and only the deploy workflow knows the
      // production origin, so SITE_URL injects it at build time (skipped locally).
      name: "inject-og-absolute-urls",
      apply: "build",
      transformIndexHtml(html) {
        const siteUrl = normalizeSiteUrl(process.env.SITE_URL);
        if (!siteUrl) return html;
        return {
          html,
          tags: [
            {
              tag: "meta",
              attrs: { property: "og:url", content: siteUrl },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: {
                property: "og:image",
                content: `${siteUrl}assets/art/cards/card-fire-starter.webp`,
              },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: {
                name: "twitter:image",
                content: `${siteUrl}assets/art/cards/card-fire-starter.webp`,
              },
              injectTo: "head",
            },
          ],
        };
      },
    },
    sharePagesPlugin(),
  ],
});
