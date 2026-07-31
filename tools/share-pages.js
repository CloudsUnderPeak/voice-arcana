import { VOICE_CARDS } from "../src/domain/cards/card-catalog.js";
import { ZH_HANT } from "../src/i18n/locales/zh-hant.js";
import { EN } from "../src/i18n/locales/en.js";

// One static HTML page per card: social crawlers do not run JS, so only
// pre-rendered pages let share links expand card-specific previews on
// LINE / Facebook / Twitter.
// Human visitors are redirected back into the app by an inline script that
// forwards the axes (and lang) params.
// One set per locale: share/<id>/ (Chinese) and share/en/<id>/ (English).
const SHARE_LOCALES = [
  { locale: "zh-Hant", dictionary: ZH_HANT, prefix: "" },
  { locale: "en", dictionary: EN, prefix: "en/" },
];

export function renderSharePage(card, siteUrl = "", localeEntry = SHARE_LOCALES[0]) {
  const { locale, dictionary, prefix } = localeEntry;
  const copy = dictionary.cards[card.id];
  const page = dictionary.sharePage;
  const title = page.title.replace("{name}", copy.name);
  const description = page.description.replace("{tagline}", copy.tagline);
  const appRoot = prefix ? "../../../" : "../../";
  const imagePath = `assets/art/cards/card-${card.id}.webp`;
  const image = siteUrl ? `${siteUrl}${imagePath}` : `${appRoot}${imagePath}`;
  const pageUrl = siteUrl ? `${siteUrl}share/${prefix}${card.id}/` : "";
  const langParam = locale === "zh-Hant" ? "" : `params.set("lang", "${locale}");`;
  const fallbackQuery = locale === "zh-Hant" ? `?card=${card.id}` : `?card=${card.id}&lang=${locale}`;

  return `<!doctype html>
<html lang="${dictionary.meta.htmlLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="theme-color" content="#17101f" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Voice Arcana" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    ${pageUrl ? `<meta property="og:url" content="${pageUrl}" />` : ""}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <script>
      const params = new URLSearchParams(location.search);
      params.set("card", "${card.id}");
      ${langParam}
      location.replace("${appRoot}?" + params.toString());
    </script>
    <noscript>
      <meta http-equiv="refresh" content="0; url=${appRoot}${fallbackQuery}" />
    </noscript>
  </head>
  <body>
    <p>${page.opening}<a href="${appRoot}${fallbackQuery}">${page.goto}</a></p>
  </body>
</html>
`;
}

export function sharePagesPlugin() {
  const siteUrl = normalizeSiteUrl(process.env.SITE_URL);

  return {
    name: "generate-share-pages",

    // build: emit dist/share/<id>/index.html and dist/share/en/<id>/index.html.
    generateBundle() {
      for (const localeEntry of SHARE_LOCALES) {
        for (const card of VOICE_CARDS) {
          this.emitFile({
            type: "asset",
            fileName: `share/${localeEntry.prefix}${card.id}/index.html`,
            source: renderSharePage(card, siteUrl, localeEntry),
          });
        }
      }
    },

    // dev: serve /share/(en/)<id>/ locally so the full share flow works.
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const match = request.url?.match(/^\/share\/(en\/)?([a-z0-9-]+)\/?(?:\?.*)?$/);
        const card = match && VOICE_CARDS.find(({ id }) => id === match[2]);
        if (!card) return next();
        const localeEntry = SHARE_LOCALES.find(({ prefix }) => prefix === (match[1] || ""));
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(renderSharePage(card, "", localeEntry));
      });
    },
  };
}

export function normalizeSiteUrl(value) {
  if (!value) return "";
  return value.endsWith("/") ? value : `${value}/`;
}
