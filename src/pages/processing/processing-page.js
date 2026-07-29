import { siteHeader } from "../../ui/site-header.js";

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
        <p class="eyebrow">LOCAL AUDIO ANALYSIS</p>
        <h1>正在聆聽聲音的形狀</h1>
        <p class="processing-label" data-progress-label>正在準備本機分析</p>
        <div
          class="progress-track"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="8"
          aria-label="聲音分析進度"
        >
          <span data-progress-bar style="width: 8%"></span>
        </div>
        <div class="progress-meta"><span data-progress-number>08%</span><span>聲音不會離開這台裝置</span></div>
        <div class="processing-steps" aria-hidden="true">
          <span class="is-active">波形</span><i></i><span>音色</span><i></i><span>聲音牌</span>
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
        step.classList.toggle("is-active", safeValue >= [10, 48, 82][index]);
      });
    },
    destroy() {},
  };
}
