export function renderCardArt(card) {
  const artwork = `./assets/art/cards/card-${card.id}.webp`;
  const localFallback = `./public/assets/art/cards/card-${card.id}.webp`;
  const description = CARD_DESCRIPTIONS[card.id] || "以聲波與幾何人物構成的裝飾藝術牌面";

  return `
    <figure class="arcana-frame" style="--card-accent: ${card.accent}">
      <div class="arcana-card-wrap">
        <img
          class="arcana-card"
          src="${artwork}"
          data-public-fallback="${localFallback}"
          width="1600"
          height="2400"
          alt="${card.name}聲音牌：${description}"
          decoding="sync"
          loading="eager"
          fetchpriority="high"
        />
        <span class="arcana-card__number" aria-hidden="true">${card.number}</span>
        <figcaption class="arcana-card__caption">
          <span>${card.name}</span>
          <small>${card.tagline}</small>
        </figcaption>
      </div>
    </figure>
  `;
}

const CARD_DESCRIPTIONS = Object.freeze({
  "blank-keeper": "人物站在空門與消退的聲波之間，雙手托住一段留白",
  "fire-starter": "人物高舉火光，放射線與星火向上展開",
  listener: "人物懷抱螺旋聲音容器，聲波向中心聚合",
  traveler: "人物穿越層疊拱門，沿著路徑走向遠方星光",
  "dream-builder": "人物將幾何拱門與階梯組成一座夢境建築",
  "night-keeper": "守護人物捧著微光，身後展開同心聲波與夜色拱門",
  "echo-bearer": "人物與半透明迴聲並肩，懷抱一只中空圓環",
  "wave-breaker": "人物穿過左右分開的聲浪，向光線升起的方向前進",
});
