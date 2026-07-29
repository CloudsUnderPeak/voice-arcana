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

export async function createResultImageFile(analysis, artwork) {
  await Promise.all([
    document.fonts?.ready,
    waitForArtwork(artwork),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("此瀏覽器無法建立分享圖片。");
  }

  drawResultImage(context, analysis, artwork);
  const blob = await canvasToBlob(canvas);
  return new File([blob], resultImageFilename(analysis.card), {
    type: "image/png",
  });
}

export function canShareResultImage(file, shareNavigator = globalThis.navigator) {
  if (
    typeof shareNavigator?.share !== "function"
    || typeof shareNavigator?.canShare !== "function"
  ) {
    return false;
  }

  try {
    return shareNavigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export function shareResultImage(
  file,
  card,
  shareNavigator = globalThis.navigator,
) {
  return shareNavigator.share({
    files: [file],
    title: `Voice Arcana｜${card.name}`,
    text: `我的聲音牌是「${card.name}」。`,
  });
}

export function downloadResultImage(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function resultImageFilename(card) {
  return `voice-arcana-${card.id}.png`;
}

function drawResultImage(context, analysis, artwork) {
  const { card, portrait } = analysis;
  drawBackground(context, card.accent);
  drawFrame(context);

  context.fillStyle = COLORS.gold;
  context.font = '700 20px Inter, "Noto Sans TC", sans-serif';
  context.letterSpacing = "5px";
  context.fillText("VOICE ARCANA · YOUR SOUND PORTRAIT", 76, 89);

  drawCard(context, artwork, card);

  context.fillStyle = COLORS.gold;
  context.font = '700 18px Inter, "Noto Sans TC", sans-serif';
  context.letterSpacing = "3px";
  context.fillText(`SOUND CARD ${card.number}`, 540, 186);

  context.fillStyle = COLORS.paper;
  context.font = '500 34px "Noto Serif TC", "PMingLiU", serif';
  context.letterSpacing = "2px";
  context.fillText("你的聲音牌", 540, 243);

  context.fillStyle = card.accent || COLORS.coral;
  context.font = '500 78px "Noto Serif TC", "PMingLiU", serif';
  context.letterSpacing = "5px";
  context.fillText(card.name, 540, 333);

  context.fillStyle = COLORS.goldBright;
  context.font = '500 24px "Noto Serif TC", "PMingLiU", serif';
  context.letterSpacing = "3px";
  drawWrappedText(context, card.tagline, 540, 390, 440, 38);

  drawSectionTitle(context, "聲音肖像", 540, 478, 452);
  portrait.axes.forEach((axis, index) => {
    drawAxis(context, axis, 540, 525 + index * 62, 452);
  });

  drawQuestion(context, card.question);
  drawFooter(context);
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
  context.font = '500 32px "Noto Serif TC", "PMingLiU", serif';
  context.letterSpacing = "6px";
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

function drawAxis(context, axis, x, y, width) {
  const labelWidth = 76;
  const trackX = x + labelWidth;
  const trackWidth = width - labelWidth * 2;
  const score = Math.max(0, Math.min(100, Number(axis.score) || 0));

  context.fillStyle = COLORS.soft;
  context.font = '500 18px "Noto Serif TC", "PMingLiU", serif';
  context.letterSpacing = "1px";
  context.fillText(axis.lowLabel, x, y + 6);
  context.textAlign = "right";
  context.fillText(axis.highLabel, x + width, y + 6);
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

  context.fillStyle = COLORS.gold;
  context.font = '700 15px Inter, "Noto Sans TC", sans-serif';
  context.fillText(String(Math.round(score)).padStart(2, "0"), markerX - 9, y + 31);
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
  context.fillText("給你的提問", x + 48, y + 58);

  context.fillStyle = COLORS.paper;
  context.font = '500 38px "Noto Serif TC", "PMingLiU", serif';
  context.letterSpacing = "2px";
  drawWrappedText(context, question, x + 48, y + 122, width - 96, 58);
}

function drawFooter(context) {
  context.fillStyle = COLORS.gold;
  context.font = '700 18px Inter, "Noto Sans TC", sans-serif';
  context.letterSpacing = "3px";
  context.fillText("VOICE ARCANA", 76, 1212);

  context.fillStyle = COLORS.mist;
  context.font = '500 17px "Noto Sans TC", sans-serif';
  context.letterSpacing = "1px";
  context.fillText("圖片由本裝置產生；Voice Arcana 不接收或保存錄音。", 76, 1252);
  context.fillText("本結果是創意詮釋，不代表人格、身分、情緒或健康診斷。", 76, 1285);
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  let line = "";
  let lineIndex = 0;
  for (const character of text) {
    const candidate = line + character;
    if (line && context.measureText(candidate).width > maxWidth) {
      context.fillText(line, x, y + lineIndex * lineHeight);
      line = character;
      lineIndex += 1;
    } else {
      line = candidate;
    }
  }
  if (line) context.fillText(line, x, y + lineIndex * lineHeight);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("分享圖片產生失敗，請稍後再試。"));
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
