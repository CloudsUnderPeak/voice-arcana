import { renderCardArt } from "../../ui/card-art.js";
import { bindPublicAssetFallbacks } from "../../ui/image-fallback.js";
import { siteHeader } from "../../ui/site-header.js";

export function mountResultPage(root, analysis, actions) {
  const { card, portrait } = analysis;
  root.innerHTML = `
    <div class="result-shell">
      ${siteHeader({ compact: true, focusMode: true })}
      <main id="main-content" class="result-page">
        <section class="result-art-column">
          <div class="result-art-ornament" aria-hidden="true"></div>
          ${renderCardArt(card)}
          <p class="local-seal">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v10H6z"/></svg>
            你的聲音沒有離開這台裝置
          </p>
        </section>

        <section class="result-content" aria-labelledby="result-title">
          <div class="result-fan" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <p class="eyebrow">VOICE ARCANA · SOUND CARD ${card.number}</p>
          <h1 id="result-title">你的聲音牌：<em>${card.name}</em></h1>
          <p class="result-tagline">${card.tagline}</p>

          <div class="portrait-heading">
            <span></span><i>◇</i><h2>聲音肖像</h2><i>◇</i><span></span>
          </div>
          <div class="portrait-axes">
            ${portrait.axes.map(renderAxis).join("")}
          </div>

          <p class="result-question"><span>給你的提問</span>${card.question}</p>
          <p class="interpretation-note">本結果是這段錄音的創意詮釋，不代表人格、身分、情緒或健康診斷。</p>

          <div class="result-actions">
            <button type="button" class="button button--light" data-action="reset">再錄一次</button>
          </div>
        </section>
      </main>
    </div>
  `;

  const resetButton = root.querySelector("[data-action='reset']");
  const destroyArtworkFallbacks = bindPublicAssetFallbacks(root);

  resetButton.addEventListener("click", actions.onReset);

  return {
    destroy() {
      resetButton.removeEventListener("click", actions.onReset);
      destroyArtworkFallbacks();
    },
  };
}

function renderAxis(axis, index) {
  return `
    <div class="portrait-axis" style="--axis-value: ${axis.score}%; --axis-delay: ${index * 90}ms">
      <span class="portrait-axis__icon" aria-hidden="true">${axisIcon(axis.id)}</span>
      <span class="portrait-axis__low">${axis.lowLabel}</span>
      <div class="portrait-axis__track" aria-label="${axis.lowLabel}到${axis.highLabel}：${axis.score} 分">
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        <b></b>
      </div>
      <span class="portrait-axis__high">${axis.highLabel}</span>
      <span class="portrait-axis__score">${axis.score}</span>
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
