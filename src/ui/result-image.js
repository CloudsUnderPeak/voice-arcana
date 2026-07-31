import { axisLabels, t } from "../i18n/i18n.js";

const IMAGE_WIDTH = 1080;
const IMAGE_HEIGHT = 1350;
const CARD_ASPECT_RATIO = 2 / 3;

const COLORS = Object.freeze({
  background: "#120d19",
  surface: "#21162b",
  paper: "#f3dfda",
  soft: "#d8bcc2",
  gold: "#bd806d",
  goldBright: "#e5ae99",
  coral: "#e98170",
  mist: "#aa8fa7",
  line: "rgba(197, 133, 111, 0.36)",
});

export async function createResultImageFile(analysis, artwork, shareUrl = "") {
  await Promise.all([
    document.fonts?.ready,
    waitForArtwork(artwork),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error(t("resultImage.cannotCreate"));
  }

  drawResultImage(context, analysis, artwork, shareUrl);
  const blob = await canvasToBlob(canvas);
  return new File([blob], resultImageFilename(analysis.card), {
    type: "image/png",
  });
}

export function resultImageFilename(card) {
  return `voice-arcana-${card.id}.png`;
}

function drawResultImage(context, analysis, artwork, shareUrl) {
  const { card, portrait } = analysis;
  drawBackground(context, card.accent);
  drawFrame(context);

  context.fillStyle = COLORS.gold;
  context.font = '700 20px Inter, "Noto Sans TC", sans-serif';
  context.letterSpacing = "5px";
  context.fillText(t("resultImage.banner"), 76, 89);

  drawCard(context, artwork, card);

  context.fillStyle = COLORS.gold;
  context.font = '700 18px Inter, "Noto Sans TC", sans-serif';
  context.letterSpacing = "3px";
  context.fillText(t("resultImage.soundCard", { number: card.number }), 540, 186);

  context.fillStyle = COLORS.paper;
  context.font = '500 34px "Noto Serif TC", "PMingLiU", serif';
  context.letterSpacing = "2px";
  context.fillText(t("resultImage.yourCard"), 540, 243);

  context.fillStyle = card.accent || COLORS.coral;
  context.letterSpacing = latinAware(card.name, "5px", "2px");
  fitFontSize(
    context,
    card.name,
    (size) => `500 ${size}px "Noto Serif TC", "PMingLiU", serif`,
    78,
    IMAGE_WIDTH - 540 - 76,
    40,
  );
  context.fillText(card.name, 540, 333);

  context.fillStyle = COLORS.goldBright;
  context.letterSpacing = latinAware(card.tagline, "3px", "1px");
  const taglineSize = fitWrappedFontSize(
    context,
    card.tagline,
    (size) => `500 ${size}px "Noto Serif TC", "PMingLiU", serif`,
    24,
    440,
    2,
    17,
  );
  drawWrappedText(context, card.tagline, 540, 390, 440, Math.round(taglineSize * 1.55));

  drawSectionTitle(context, t("resultImage.portraitTitle"), 540, 478, 452);
  // Measure the longest axis label for the locale and unify the label column
  // width so English labels never collide with the tick marks.
  context.font = '500 18px "Noto Serif TC", "PMingLiU", serif';
  const labelWidth = Math.min(
    118,
    portrait.axes.reduce((widest, axis) => {
      const labels = axisLabels(axis.id);
      return Math.max(
        widest,
        context.measureText(labels.low).width,
        context.measureText(labels.high).width,
      );
    }, 70) + 8,
  );
  portrait.axes.forEach((axis, index) => {
    drawAxis(context, axis, 540, 525 + index * 62, 452, labelWidth);
  });

  drawQuestion(context, card.question);
  drawFooter(context, shareUrl);
}

function drawBackground(context, accent) {
  context.fillStyle = COLORS.background;
  context.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  const leftGlow = context.createRadialGradient(210, 590, 30, 210, 590, 590);
  leftGlow.addColorStop(0, withAlpha(accent || COLORS.coral, 0.28));
  leftGlow.addColorStop(1, "rgba(18, 13, 25, 0)");
  context.fillStyle = leftGlow;
  context.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  const topGlow = context.createRadialGradient(930, 0, 10, 930, 0, 520);
  topGlow.addColorStop(0, "rgba(143, 97, 124, 0.25)");
  topGlow.addColorStop(1, "rgba(18, 13, 25, 0)");
  context.fillStyle = topGlow;
  context.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
}

function drawFrame(context) {
  context.strokeStyle = COLORS.line;
  context.lineWidth = 2;
  context.strokeRect(38, 38, IMAGE_WIDTH - 76, IMAGE_HEIGHT - 76);
  context.strokeStyle = "rgba(197, 133, 111, 0.16)";
  context.strokeRect(50, 50, IMAGE_WIDTH - 100, IMAGE_HEIGHT - 100);

  context.fillStyle = COLORS.gold;
  for (const [x, y] of [[38, 38], [1042, 38], [38, 1312], [1042, 1312]]) {
    context.save();
    context.translate(x, y);
    context.rotate(Math.PI / 4);
    context.fillRect(-6, -6, 12, 12);
    context.restore();
  }
}

function drawCard(context, artwork, card) {
  const x = 76;
  const y = 145;
  const width = 400;
  const height = width / CARD_ASPECT_RATIO;

  context.fillStyle = COLORS.surface;
  context.fillRect(x - 12, y - 12, width + 24, height + 24);
  context.strokeStyle = COLORS.goldBright;
  context.lineWidth = 2;
  context.strokeRect(x - 12, y - 12, width + 24, height + 24);

  if (artwork?.complete && artwork.naturalWidth > 0) {
    context.drawImage(artwork, x, y, width, height);
  } else {
    drawArtworkFallback(context, x, y, width, height, card.accent);
  }

  const captionY = y + height - 105;
  context.fillStyle = "rgba(18, 13, 25, 0.86)";
  context.fillRect(x + 28, captionY, width - 56, 78);
  context.strokeStyle = COLORS.goldBright;
  context.strokeRect(x + 28, captionY, width - 56, 78);
  context.textAlign = "center";
  context.fillStyle = COLORS.paper;
  context.letterSpacing = latinAware(card.name, "6px", "1px");
  fitFontSize(
    context,
    card.name,
    (size) => `500 ${size}px "Noto Serif TC", "PMingLiU", serif`,
    32,
    width - 56 - 28,
    18,
  );
  context.fillText(card.name, x + width / 2, captionY + 50);
  context.textAlign = "left";
}

function drawArtworkFallback(context, x, y, width, height, accent) {
  const gradient = context.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, COLORS.surface);
  gradient.addColorStop(1, withAlpha(accent || COLORS.coral, 0.42));
  context.fillStyle = gradient;
  context.fillRect(x, y, width, height);
  context.strokeStyle = COLORS.gold;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(x + width / 2, y + height * 0.43, width * 0.28, 0, Math.PI * 2);
  context.stroke();
}

function drawSectionTitle(context, title, x, y, width) {
  context.strokeStyle = COLORS.line;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + 130, y);
  context.moveTo(x + width - 130, y);
  context.lineTo(x + width, y);
  context.stroke();
  context.textAlign = "center";
  context.fillStyle = COLORS.paper;
  context.font = '500 24px "Noto Serif TC", "PMingLiU", serif';
  context.letterSpacing = "4px";
  context.fillText(title, x + width / 2, y + 8);
  context.textAlign = "left";
}

function drawAxis(context, axis, x, y, width, labelWidth = 76) {
  const labels = axisLabels(axis.id);
  const trackX = x + labelWidth;
  const trackWidth = width - labelWidth * 2;
  const score = Math.max(0, Math.min(100, Number(axis.score) || 0));

  context.fillStyle = COLORS.soft;
  context.font = '500 18px "Noto Serif TC", "PMingLiU", serif';
  context.letterSpacing = "1px";
  context.fillText(labels.low, x, y + 6);
  context.textAlign = "right";
  context.fillText(labels.high, x + width, y + 6);
  context.textAlign = "left";

  context.strokeStyle = COLORS.gold;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(trackX, y);
  context.lineTo(trackX + trackWidth, y);
  context.stroke();

  context.fillStyle = COLORS.gold;
  for (let tick = 0; tick <= 6; tick += 1) {
    context.fillRect(trackX + (trackWidth * tick) / 6, y - 6, 2, 12);
  }

  const markerX = trackX + (trackWidth * score) / 100;
  context.save();
  context.translate(markerX, y);
  context.rotate(Math.PI / 4);
  context.fillStyle = COLORS.goldBright;
  context.fillRect(-8, -8, 16, 16);
  context.restore();
}

function drawQuestion(context, question) {
  const x = 76;
  const y = 900;
  const width = 928;
  const height = 245;
  context.fillStyle = "rgba(39, 24, 49, 0.78)";
  context.fillRect(x, y, width, height);
  context.strokeStyle = COLORS.line;
  context.strokeRect(x, y, width, height);
  context.fillStyle = COLORS.coral;
  context.fillRect(x, y, 4, height);

  context.fillStyle = COLORS.coral;
  context.font = '700 17px Inter, "Noto Sans TC", sans-serif';
  context.letterSpacing = "4px";
  context.fillText(t("resultImage.questionLabel"), x + 48, y + 58);

  context.fillStyle = COLORS.paper;
  context.letterSpacing = latinAware(question, "2px", "1px");
  const questionSize = fitWrappedFontSize(
    context,
    question,
    (size) => `500 ${size}px "Noto Serif TC", "PMingLiU", serif`,
    38,
    width - 96,
    2,
    24,
  );
  drawWrappedText(context, question, x + 48, y + 122, width - 96, Math.round(questionSize * 1.5));
}

function drawFooter(context, shareUrl) {
  context.fillStyle = COLORS.gold;
  context.font = '700 18px Inter, "Noto Sans TC", sans-serif';
  context.letterSpacing = "3px";
  context.fillText("VOICE ARCANA", 76, 1196);

  // Referral entry point: viewers of the image can find the experience,
  // closing the record -> share -> friends-try loop.
  if (shareUrl) {
    const urlText = displayShareUrl(shareUrl);
    context.font = '600 22px Inter, "Noto Sans TC", sans-serif';
    context.letterSpacing = "1px";
    const urlWidth = context.measureText(urlText).width;

    context.fillStyle = COLORS.paper;
    context.letterSpacing = "1px";
    fitFontSize(
      context,
      t("resultImage.cta"),
      (size) => `700 ${size}px "Noto Sans TC", Inter, sans-serif`,
      24,
      IMAGE_WIDTH - 152 - urlWidth - 32,
      15,
    );
    context.fillText(t("resultImage.cta"), 76, 1232);

    context.fillStyle = COLORS.goldBright;
    context.font = '600 22px Inter, "Noto Sans TC", sans-serif';
    context.textAlign = "right";
    context.fillText(urlText, IMAGE_WIDTH - 76, 1232);
    context.textAlign = "left";
  }

  context.fillStyle = COLORS.mist;
  context.letterSpacing = "1px";
  fitFontSize(
    context,
    t("resultImage.footerNote"),
    (size) => `500 ${size}px "Noto Sans TC", sans-serif`,
    16,
    IMAGE_WIDTH - 152,
    12,
  );
  context.fillText(t("resultImage.footerLocal"), 76, 1265);
  context.fillText(t("resultImage.footerNote"), 76, 1292);
}

// Print only a clean short URL (no protocol or params) on the image; opened
// without params, the share page shows the card's archetype axes.
function displayShareUrl(shareUrl) {
  return shareUrl
    .replace(/^https?:\/\//, "")
    .replace(/[?#].*$/, "")
    .replace(/\/$/, "");
}

// Text containing spaces (English) wraps by word; CJK wraps per character.
function wrapLines(context, text, maxWidth) {
  const units = text.includes(" ")
    ? text.split(" ").map((word, index) => (index ? ` ${word}` : word))
    : [...text];
  const lines = [];
  let line = "";
  for (const unit of units) {
    const candidate = line + unit;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = unit.trimStart();
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  wrapLines(context, text, maxWidth).forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}

// Step the font size down from the base until one line fits; measurement includes letterSpacing.
function fitFontSize(context, text, font, baseSize, maxWidth, minSize) {
  for (let size = baseSize; size > minSize; size -= 1) {
    context.font = font(size);
    if (context.measureText(text).width <= maxWidth) return size;
  }
  context.font = font(minSize);
  return minSize;
}

// Shrink the font size until the wrapped text fits within maxLines lines.
function fitWrappedFontSize(context, text, font, baseSize, maxWidth, maxLines, minSize) {
  for (let size = baseSize; size > minSize; size -= 1) {
    context.font = font(size);
    if (wrapLines(context, text, maxWidth).length <= maxLines) return size;
  }
  context.font = font(minSize);
  return minSize;
}

// English (contains spaces) gets tighter tracking; Chinese keeps the wide stage-like tracking.
function latinAware(text, cjkSpacing, latinSpacing) {
  return text.includes(" ") ? latinSpacing : cjkSpacing;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error(t("resultImage.blobFailed")));
      }
    }, "image/png");
  });
}

async function waitForArtwork(artwork) {
  if (!artwork) return;

  for (let attempt = 0; attempt < 2 && !artwork.complete; attempt += 1) {
    await new Promise((resolve) => {
      function settle() {
        artwork.removeEventListener("load", settle);
        artwork.removeEventListener("error", settle);
        resolve();
      }
      artwork.addEventListener("load", settle, { once: true });
      artwork.addEventListener("error", settle, { once: true });
    });
  }
}

function withAlpha(hex, alpha) {
  const value = hex.replace("#", "");
  const normalized = value.length === 3
    ? value.split("").map((character) => character + character).join("")
    : value;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
