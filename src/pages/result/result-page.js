import { renderCardArt } from "../../ui/card-art.js";
import { bindArtworkFallbacks } from "../../ui/image-fallback.js";
import { escapeHtml } from "../../utils/escape-html.js";
import { createResultImageFile } from "../../ui/result-image.js";
import { siteHeader } from "../../ui/site-header.js";
import { createShareUrl } from "../../app/share-link.js";
import { axisLabels, localizeCard, t } from "../../i18n/i18n.js";

export function mountResultPage(root, analysis, actions) {
  // Locale copy is merged into the card at the UI edge; analysis.card holds domain data only.
  const card = localizeCard(analysis.card);
  const { portrait } = analysis;
  const isShared = Boolean(analysis.shared);
  root.innerHTML = `
    <div class="result-shell">
      ${siteHeader({ compact: true, focusMode: true })}
      <main id="main-content" class="result-page">
        <section class="result-art-column">
          <div class="result-art-ornament" aria-hidden="true"></div>
          ${renderCardArt(card)}
          <p class="local-seal">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v10H6z"/></svg>
            ${escapeHtml(t("result.localSeal"))}
          </p>
        </section>

        <section class="result-content" aria-labelledby="result-title">
          <div class="result-fan" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <p class="eyebrow">${escapeHtml(t("result.eyebrow", { number: card.number }))}</p>
          <h1 id="result-title">${escapeHtml(t("result.titlePrefix"))}<em>${escapeHtml(card.name)}</em></h1>
          <p class="result-tagline">${escapeHtml(card.tagline)}</p>

          <div class="portrait-heading">
            <span></span><i>◇</i><h2>${escapeHtml(t("result.portraitTitle"))}</h2><i>◇</i><span></span>
          </div>
          <div class="portrait-axes">
            ${portrait.axes.map(renderAxis).join("")}
          </div>

          <div class="result-reading">
            <p>${escapeHtml(card.profile)}</p>
          </div>

          <p class="result-question"><span>${escapeHtml(t("result.questionLabel"))}</span>${escapeHtml(card.question)}</p>

          <div class="result-actions">
            <button type="button" class="button ${isShared ? "button--primary" : "button--light"}" data-action="reset">${escapeHtml(isShared ? t("result.tryMine") : t("result.retake"))}</button>
            <button type="button" class="button button--share" data-action="share" disabled>${escapeHtml(t("result.preparingImage"))}</button>
          </div>
          <p class="share-status" data-share-status role="status" aria-live="polite"></p>
        </section>
      </main>
      <div class="share-overlay" data-share-overlay hidden>
        <div class="share-overlay__panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(t("result.overlayAria"))}">
          <img alt="${escapeHtml(t("result.overlayImageAlt", { name: card.name }))}" data-share-preview-image />
          <p>${escapeHtml(t("result.overlayHint"))}</p>
          <button type="button" class="button button--light" data-action="close-preview">${escapeHtml(t("result.close"))}</button>
        </div>
      </div>
    </div>
  `;

  const resetButton = root.querySelector("[data-action='reset']");
  const shareButton = root.querySelector("[data-action='share']");
  const shareStatus = root.querySelector("[data-share-status]");
  const homeLink = root.querySelector("[data-home-link]");
  const artwork = root.querySelector(".arcana-card");
  const shareOverlay = root.querySelector("[data-share-overlay]");
  const closePreviewButton = root.querySelector("[data-action='close-preview']");
  const sharePreviewImage = root.querySelector("[data-share-preview-image]");
  const destroyArtworkFallbacks = bindArtworkFallbacks(root);
  const shareUrl = createShareUrl(analysis);
  const localizedAnalysis = { ...analysis, card };
  let previewUrl = null;
  let destroyed = false;

  resetButton.addEventListener("click", actions.onReset);
  shareButton.addEventListener("click", openPreview);
  closePreviewButton.addEventListener("click", closePreview);
  shareOverlay.addEventListener("click", handleOverlayClick);
  document.addEventListener("keydown", handlePreviewKeydown);
  // Intercept the header link: a full reload would lose the local result, so route through reset instead.
  homeLink?.addEventListener("click", handleHomeLink);
  prepareResultImage();

  return {
    destroy() {
      destroyed = true;
      resetButton.removeEventListener("click", actions.onReset);
      shareButton.removeEventListener("click", openPreview);
      closePreviewButton.removeEventListener("click", closePreview);
      shareOverlay.removeEventListener("click", handleOverlayClick);
      document.removeEventListener("keydown", handlePreviewKeydown);
      homeLink?.removeEventListener("click", handleHomeLink);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      destroyArtworkFallbacks();
    },
  };

  function handleHomeLink(event) {
    event.preventDefault();
    actions.onReset();
  }

  function openPreview() {
    if (shareButton.disabled || !previewUrl) return;
    shareOverlay.hidden = false;
    closePreviewButton.focus();
  }

  function closePreview() {
    shareOverlay.hidden = true;
    shareButton.focus();
  }

  function handleOverlayClick(event) {
    if (event.target === shareOverlay) closePreview();
  }

  function handlePreviewKeydown(event) {
    if (event.key === "Escape" && !shareOverlay.hidden) closePreview();
  }

  function prepareResultImage() {
    createResultImageFile(localizedAnalysis, artwork, shareUrl)
      .then((file) => {
        if (destroyed) return;
        // Sharing always uses the overlay plus long-press/right-click save: it avoids
        // the share/download APIs that in-app browsers often break, keeping behavior
        // consistent across devices.
        previewUrl = URL.createObjectURL(file);
        sharePreviewImage.src = previewUrl;
        shareButton.textContent = t("result.share");
        shareButton.disabled = false;
      })
      .catch((error) => {
        if (destroyed) return;
        console.error(error);
        shareButton.textContent = t("result.imageFailed");
        shareStatus.textContent = error?.message || t("result.imageFailedStatus");
      });
  }
}

function renderAxis(axis, index) {
  const labels = axisLabels(axis.id);
  return `
    <div class="portrait-axis" style="--axis-value: ${axis.score}%; --axis-delay: ${index * 90}ms">
      <span class="portrait-axis__icon" aria-hidden="true">${axisIcon(axis.id)}</span>
      <span class="portrait-axis__low">${escapeHtml(labels.low)}</span>
      <div class="portrait-axis__track" aria-label="${escapeHtml(t("result.axisRangeAria", { low: labels.low, high: labels.high }))}">
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        <b></b>
      </div>
      <span class="portrait-axis__high">${escapeHtml(labels.high)}</span>
    </div>
  `;
}

function axisIcon(id) {
  const icons = {
    brightness: "◒",
    sharpness: "∿",
    bounce: "≋",
    openness: "◉",
    raspiness: "⁙",
    energy: "☼",
  };
  return icons[id] || "◇";
}
