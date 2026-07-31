import { getLocale, t } from "../i18n/i18n.js";
import { escapeHtml } from "../utils/escape-html.js";

export function siteHeader({ compact = false, focusMode = false } = {}) {
  const targetLocale = getLocale() === "en" ? "zh-Hant" : "en";
  return `
    <header class="site-header ${compact ? "site-header--compact" : ""}">
      <a class="brand" href="./" data-home-link aria-label="${escapeHtml(t("header.brandAria"))}">
        <span class="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 52 34" role="img">
            <path d="M26 2v25M18 5l8 22M10 10l16 17M4 18l22 9M34 5l-8 22M42 10 26 27M48 18l-22 9M12 31h28"/>
          </svg>
        </span>
        <span class="brand__name">
          <strong>Voice Arcana</strong>
          <small>${escapeHtml(t("header.subtitle"))}</small>
        </span>
      </a>
      <div class="site-header__side">
        ${focusMode ? `<p class="site-header__context">${escapeHtml(t("header.context"))}</p>` : ""}
        <button
          type="button"
          class="lang-switch"
          data-lang-switch="${targetLocale}"
          aria-label="${escapeHtml(t("header.langSwitchAria"))}"
          lang="${targetLocale === "en" ? "en" : "zh-Hant"}"
        >${escapeHtml(t("header.langSwitch"))}</button>
      </div>
    </header>
  `;
}
