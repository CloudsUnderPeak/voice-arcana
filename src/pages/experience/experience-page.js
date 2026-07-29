import { siteHeader } from "../../ui/site-header.js";
import { bindPublicAssetFallbacks } from "../../ui/image-fallback.js";
import { READING } from "./reading-copy.js";

const LEVEL_SEGMENTS = 18;

export function mountExperiencePage(root, state, actions) {
  const status = state.recordingStatus;
  const isRecording = status === "recording";
  const isRequesting = status === "requesting";
  const isReady = status === "ready" && state.recording;

  root.innerHTML = `
    <div class="app-shell">
      ${siteHeader({ focusMode: true })}
      <main id="main-content" class="experience-page">
        <section class="intro-hero" aria-labelledby="intro-title">
          <div class="hero-ornament" aria-hidden="true"><span></span><i></i><span></span></div>
          <p class="eyebrow">VOICE ARCANA · 聲音肖像</p>
          <h1 id="intro-title">讓你的聲音，<br/><em>成為一張牌。</em></h1>
          <p class="hero-lead">朗讀一段短文。我們會直接在瀏覽器裡描繪聲音的明暗、質地與能量，找出此刻與你共鳴的聲音牌。</p>
          <div class="privacy-note">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v10H6z"/></svg>
            錄音與分析都只發生在這台裝置，不會上傳。
          </div>
          <div class="hero-deck-preview" aria-label="八種原創聲音牌">
            <div class="hero-deck-preview__cards" aria-hidden="true">
              <img src="./assets/art/cards/card-listener.webp" data-public-fallback="./public/assets/art/cards/card-listener.webp" alt="" width="1600" height="2400" />
              <img src="./assets/art/cards/card-night-keeper.webp" data-public-fallback="./public/assets/art/cards/card-night-keeper.webp" alt="" width="1600" height="2400" />
              <img src="./assets/art/cards/card-wave-breaker.webp" data-public-fallback="./public/assets/art/cards/card-wave-breaker.webp" alt="" width="1600" height="2400" />
            </div>
            <p><strong>八種聲音原型</strong><span>這一分鐘，會翻出哪一張牌？</span></p>
          </div>
        </section>

        <section class="reading-section" id="experience" aria-labelledby="reading-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">${READING.eyebrow}</p>
              <h2 id="reading-title">讀出一段關於美的片刻</h2>
            </div>
            <span class="step-indicator">01 <i></i> 03</span>
          </div>

          <article class="reading-card">
            <div class="reading-card__meta">
              <span>${READING.topic}</span>
              <span>建議 50–60 秒</span>
            </div>
            <h3>${READING.title}</h3>
            <div class="reading-copy">
              ${READING.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
            </div>
          </article>

          <section
            class="recorder-panel recorder-panel--${status} ${isRecording ? "is-recording" : ""}"
            aria-label="錄音控制"
          >
            ${recordingPanelContent({ state, isRecording, isRequesting, isReady })}
          </section>
        </section>

      </main>
    </div>
  `;

  const startButton = root.querySelector("[data-action='start']");
  const stopButton = root.querySelector("[data-action='stop']");
  const submitButton = root.querySelector("[data-action='submit']");
  const resetButton = root.querySelector("[data-action='reset']");
  startButton?.addEventListener("click", actions.onStart);
  stopButton?.addEventListener("click", actions.onStop);
  submitButton?.addEventListener("click", actions.onSubmit);
  resetButton?.addEventListener("click", actions.onReset);
  bindHomeLink(root);

  const meter = root.querySelector("[data-wave]");
  const segments = [...root.querySelectorAll("[data-level-segments] i")];
  const levelLabel = root.querySelector("[data-level-label]");
  const time = root.querySelector("[data-elapsed]");
  const destroyArtworkFallbacks = bindPublicAssetFallbacks(root);

  return {
    updateLevel(level) {
      const safeLevel = Math.max(0, Math.min(1, level));
      meter?.style.setProperty("--voice-level", safeLevel);
      meter?.style.setProperty("--meter-scale", String(0.78 + safeLevel * 0.42));
      meter?.style.setProperty("--meter-glow", `${8 + safeLevel * 24}px`);
      segments.forEach((segment, index) => {
        const segmentLevel = Math.max(
          0,
          Math.min(1, safeLevel * segments.length - index),
        );
        segment.style.setProperty("--segment-level", String(segmentLevel));
        segment.classList.toggle("is-active", segmentLevel > 0.04);
      });
      if (levelLabel) levelLabel.textContent = describeLevel(safeLevel);
    },
    updateTime(seconds) {
      if (time) {
        time.textContent = formatTime(seconds);
        time.parentElement.setAttribute("datetime", `PT${Math.floor(seconds)}S`);
      }
    },
    destroy() {
      startButton?.removeEventListener("click", actions.onStart);
      stopButton?.removeEventListener("click", actions.onStop);
      submitButton?.removeEventListener("click", actions.onSubmit);
      resetButton?.removeEventListener("click", actions.onReset);
      destroyArtworkFallbacks();
    },
  };
}

function recordingPanelContent({ state, isRecording, isRequesting, isReady }) {
  const error = state.error ? `<p class="form-message" role="alert">${state.error}</p>` : "";

  if (isRecording) {
    return `
      <div class="recording-status" aria-live="polite">
        <span><i aria-hidden="true"></i>錄音中</span>
        <time class="recording-time" datetime="PT0S">
          <span data-elapsed>00:00</span><small>/ 01:00</small>
        </time>
      </div>
      <div class="voice-meter" aria-hidden="true" data-wave>
        <div class="voice-meter__signal">
          <span class="voice-meter__pulse"></span>
          <div class="voice-meter__segments" data-level-segments>
            ${Array.from({ length: LEVEL_SEGMENTS }, (_, index) => `<i style="--segment: ${index}"></i>`).join("")}
          </div>
        </div>
        <div class="voice-meter__scale">
          <span>輕聲</span>
          <strong data-level-label>等待聲音</strong>
          <span>飽滿</span>
        </div>
      </div>
      <div class="recorder-actions">${recordingControls({ isRecording, isRequesting, isReady })}</div>
      ${error}
    `;
  }

  if (isReady) {
    return `
      <div class="recording-status" aria-live="polite">
        <span>錄音完成</span>
        <time class="recording-time" datetime="PT${Math.floor(state.recording.duration)}S">
          <span data-elapsed>${formatTime(state.recording.duration)}</span>
        </time>
      </div>
      <div class="audio-preview">
        <audio controls preload="metadata" src="${state.recording.url}"></audio>
      </div>
      ${error}
      <div class="recorder-actions">${recordingControls({ isRecording, isRequesting, isReady })}</div>
    `;
  }

  return `
    ${error}
    <div class="recorder-actions">${recordingControls({ isRecording, isRequesting, isReady })}</div>
  `;
}

function describeLevel(level) {
  if (level < 0.12) return "等待聲音";
  if (level < 0.38) return "聲音偏輕";
  if (level < 0.72) return "聲音清楚";
  return "聲音飽滿";
}

function recordingControls({ isRecording, isRequesting, isReady }) {
  if (isRecording) {
    return `<button class="record-button record-button--stop" type="button" data-action="stop"><span></span>結束錄音</button>`;
  }
  if (isReady) {
    return `
      <button class="button button--ghost" type="button" data-action="reset">重新錄製</button>
      <button class="button button--primary" type="button" data-action="submit">送出並描繪聲音<span>→</span></button>
    `;
  }
  return `
    <button class="record-button" type="button" data-action="start" ${isRequesting ? "disabled" : ""}>
      <span class="record-button__dot"></span>${isRequesting ? "正在開啟麥克風…" : "開始錄音"}
    </button>
  `;
}

function formatTime(seconds) {
  const safeSeconds = Math.min(60, Math.max(0, Math.floor(seconds)));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function bindHomeLink(root) {
  root.querySelector("[data-home-link]")?.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
