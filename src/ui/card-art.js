import { escapeHtml } from "../utils/escape-html.js";
import { t } from "../i18n/i18n.js";

// card must already be localized via localizeCard() (name/tagline and other locale copy).
export function renderCardArt(card) {
  const artwork = `./assets/art/cards/card-${card.id}.webp`;
  const description = card.artAlt || t("cardArt.fallbackAlt");

  return `
    <figure class="arcana-frame" style="--card-accent: ${escapeHtml(card.accent)}">
      <div class="arcana-card-wrap">
        <img
          class="arcana-card"
          src="${artwork}"
          data-artwork
          width="1600"
          height="2400"
          alt="${escapeHtml(t("cardArt.altTemplate", { name: card.name, artAlt: description }))}"
          decoding="sync"
          loading="eager"
          fetchpriority="high"
        />
        <span class="arcana-card__number" aria-hidden="true">${escapeHtml(card.number)}</span>
        <figcaption class="arcana-card__caption">
          <span>${escapeHtml(card.name)}</span>
          <small>${escapeHtml(card.tagline)}</small>
        </figcaption>
      </div>
    </figure>
  `;
}
