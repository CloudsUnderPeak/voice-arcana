import { siteHeader } from "../../ui/site-header.js";
import { escapeHtml } from "../../utils/escape-html.js";
import { t } from "../../i18n/i18n.js";
import { STEP_THRESHOLDS } from "./processing-progress.js";

export function mountProcessingPage(root) {
  root.innerHTML = `
    <div class="processing-shell">
      ${siteHeader({ compact: true, focusMode: true })}
      <main id="main-content" class="processing-page">
        <div class="processing-sigil" aria-hidden="true">
          <span class="processing-sigil__ring"></span>
          <span class="processing-sigil__ring"></span>
          <span class="processing-sigil__ring"></span>
          <i></i>
        </div>
        <p class="eyebrow">${escapeHtml(t("processing.eyebrow"))}</p>
        <h1>${escapeHtml(t("processing.title"))}</h1>
        <p class="processing-label" data-progress-label>${escapeHtml(t("processing.preparing"))}</p>
        <div
          class="progress-track"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="8"
          aria-label="${escapeHtml(t("processing.progressAria"))}"
        >
          <span data-progress-bar style="width: 8%"></span>
        </div>
        <div class="progress-meta"><span data-progress-number>08%</span><span>${escapeHtml(t("processing.privacy"))}</span></div>
        <div class="processing-steps" aria-hidden="true">
          ${t("processing.steps").map((step, index) => `<span class="${index === 0 ? "is-active" : ""}">${escapeHtml(step)}</span>`).join("<i></i>")}
        </div>
      </main>
    </div>
  `;

  const bar = root.querySelector("[data-progress-bar]");
  const progress = root.querySelector("[role='progressbar']");
  const number = root.querySelector("[data-progress-number]");
  const label = root.querySelector("[data-progress-label]");
  const steps = [...root.querySelectorAll(".processing-steps span")];

  return {
    setProgress(value, text) {
      const safeValue = Math.max(0, Math.min(100, value));
      bar.style.width = `${safeValue}%`;
      progress.setAttribute("aria-valuenow", String(safeValue));
      number.textContent = `${String(safeValue).padStart(2, "0")}%`;
      label.textContent = text;
      steps.forEach((step, index) => {
        step.classList.toggle("is-active", safeValue >= STEP_THRESHOLDS[index]);
      });
    },
    destroy() {},
  };
}
