export function siteHeader({ compact = false, focusMode = false } = {}) {
  return `
    <header class="site-header ${compact ? "site-header--compact" : ""}">
      <a class="brand" href="./" data-home-link aria-label="Voice Arcana 首頁">
        <span class="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 52 34" role="img">
            <path d="M26 2v25M18 5l8 22M10 10l16 17M4 18l22 9M34 5l-8 22M42 10 26 27M48 18l-22 9M12 31h28"/>
          </svg>
        </span>
        <span class="brand__name">
          <strong>Voice Arcana</strong>
          <small>聲音肖像</small>
        </span>
      </a>
      ${
        focusMode
          ? `<p class="site-header__context">聲音肖像牌探索</p>`
          : `<nav class="site-nav" aria-label="主要導覽">
              <a href="#experience">開始探索</a>
              <a href="#about">關於計畫</a>
              <a href="#privacy">隱私設計</a>
            </nav>`
      }
    </header>
  `;
}
