import { siteHeader } from "../../ui/site-header.js";
import { bindArtworkFallbacks } from "../../ui/image-fallback.js";
import { escapeHtml } from "../../utils/escape-html.js";
import { t } from "../../i18n/i18n.js";

const LEVEL_SEGMENTS = 18;

export function mountExperiencePage(
  root,
  state,
  actions,
  { maxDurationSeconds = 60 } = {},
) {
  const status = state.recordingStatus;
  const isRecording = status === "recording";
  const isRequesting = status === "requesting";
  const isValidating = status === "validating";
  const isReady = status === "ready" && state.recording;
  const paragraphs = t("reading.paragraphs");

  root.innerHTML = `
    <div class="app-shell">
      ${siteHeader({ focusMode: true })}
      <main id="main-content" class="experience-page">
        <section class="intro-hero" aria-labelledby="intro-title">
          <div class="hero-ornament" aria-hidden="true"><span></span><i></i><span></span></div>
          <p class="eyebrow">${escapeHtml(t("hero.eyebrow"))}</p>
          <h1 id="intro-title">${escapeHtml(t("hero.titleLine1"))}<br/><em>${escapeHtml(t("hero.titleLine2"))}</em></h1>
          <p class="hero-lead">${escapeHtml(t("hero.lead"))}</p>
          <div class="privacy-note">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v10H6z"/></svg>
            ${escapeHtml(t("hero.privacy"))}
          </div>
          <div class="hero-deck-preview" aria-label="${escapeHtml(t("hero.deckAria"))}">
            <div class="hero-deck-preview__cards" aria-hidden="true">
              <img src="./assets/art/cards/thumbs/card-listener.webp" data-artwork alt="" width="400" height="600" />
              <img src="./assets/art/cards/thumbs/card-night-keeper.webp" data-artwork alt="" width="400" height="600" />
              <img src="./assets/art/cards/thumbs/card-wave-breaker.webp" data-artwork alt="" width="400" height="600" />
            </div>
            <p><strong>${escapeHtml(t("hero.deckTitle"))}</strong><span>${escapeHtml(t("hero.deckHint"))}</span></p>
          </div>
        </section>

        <section class="reading-section" id="experience" aria-labelledby="reading-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">${escapeHtml(t("reading.eyebrow"))}</p>
              <h2 id="reading-title">${escapeHtml(t("reading.sectionTitle"))}</h2>
            </div>
            <span class="step-indicator">01 <i></i> 03</span>
          </div>

          <article class="reading-card">
            <div class="reading-card__meta">
              <span>${escapeHtml(t("reading.topic"))}</span>
              <span>${escapeHtml(t("reading.duration"))}</span>
            </div>
            <h3>${escapeHtml(t("reading.title"))}</h3>
            <div class="reading-copy">
              ${(Array.isArray(paragraphs) ? paragraphs : []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
            </div>
          </article>

          <section
            class="recorder-panel recorder-panel--${status} ${isRecording ? "is-recording" : ""}"
            aria-label="${escapeHtml(t("recorder.panelAria"))}"
          >
            ${recordingPanelContent({
              state,
              isRecording,
              isRequesting,
              isValidating,
              isReady,
              maxDurationSeconds,
            })}
          </section>
        </section>

      </main>
    </div>
  `;

  const startButton = root.querySelector("[data-action='start']");
  const stopButton = root.querySelector("[data-action='stop']");
  const submitButton = root.querySelector("[data-action='submit']");
  const resetButton = root.querySelector("[data-action='reset']");
  const audioPreview = root.querySelector("[data-audio-preview]");
  const playbackMessage = root.querySelector("[data-playback-message]");
  const destroyAudioPlayer = bindAudioPlayer(root, audioPreview, {
    fallbackDuration: state.recording?.duration,
    onPlaybackError: handlePlaybackError,
  });
  startButton?.addEventListener("click", actions.onStart);
  stopButton?.addEventListener("click", actions.onStop);
  submitButton?.addEventListener("click", actions.onSubmit);
  resetButton?.addEventListener("click", actions.onReset);
  audioPreview?.addEventListener("error", handlePlaybackError);
  audioPreview?.addEventListener("loadedmetadata", handlePlaybackReady);
  if (audioPreview && state.recording?.url) {
    audioPreview.src = state.recording.url;
    audioPreview.load();
  }
  bindHomeLink(root);

  const meter = root.querySelector("[data-wave]");
  const segments = [...root.querySelectorAll("[data-level-segments] i")];
  const levelLabel = root.querySelector("[data-level-label]");
  const time = root.querySelector("[data-elapsed]");
  const destroyArtworkFallbacks = bindArtworkFallbacks(root);

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
        time.textContent = formatTime(seconds, maxDurationSeconds);
        time.parentElement.setAttribute("datetime", `PT${Math.floor(seconds)}S`);
      }
    },
    destroy() {
      startButton?.removeEventListener("click", actions.onStart);
      stopButton?.removeEventListener("click", actions.onStop);
      submitButton?.removeEventListener("click", actions.onSubmit);
      resetButton?.removeEventListener("click", actions.onReset);
      audioPreview?.removeEventListener("error", handlePlaybackError);
      audioPreview?.removeEventListener("loadedmetadata", handlePlaybackReady);
      destroyAudioPlayer();
      destroyArtworkFallbacks();
    },
  };

  function handlePlaybackError() {
    if (playbackMessage) {
      playbackMessage.hidden = false;
      playbackMessage.textContent = t("recorder.playbackError");
    }
    if (submitButton) submitButton.disabled = true;
  }

  function handlePlaybackReady() {
    if (playbackMessage) {
      playbackMessage.hidden = true;
      playbackMessage.textContent = "";
    }
    if (submitButton) submitButton.disabled = false;
  }
}

function bindAudioPlayer(
  root,
  audio,
  { fallbackDuration = 0, onPlaybackError } = {},
) {
  const player = root.querySelector("[data-audio-player]");
  if (!audio || !player) return () => {};

  const toggleButton = player.querySelector("[data-audio-toggle]");
  const muteButton = player.querySelector("[data-audio-mute]");
  const seekInput = player.querySelector("[data-audio-seek]");
  const currentTime = player.querySelector("[data-audio-current]");
  const durationTime = player.querySelector("[data-audio-duration]");
  const controls = [toggleButton, muteButton, seekInput].filter(Boolean);

  toggleButton?.addEventListener("click", handleToggle);
  muteButton?.addEventListener("click", handleMute);
  seekInput?.addEventListener("input", handleSeek);
  audio.addEventListener("loadedmetadata", syncTimeline);
  audio.addEventListener("durationchange", syncTimeline);
  audio.addEventListener("timeupdate", syncTimeline);
  audio.addEventListener("play", syncPlaybackState);
  audio.addEventListener("pause", syncPlaybackState);
  audio.addEventListener("ended", syncPlaybackState);
  audio.addEventListener("volumechange", syncMuteState);
  audio.addEventListener("error", disablePlayer);

  syncTimeline();
  syncPlaybackState();
  syncMuteState();

  return () => {
    toggleButton?.removeEventListener("click", handleToggle);
    muteButton?.removeEventListener("click", handleMute);
    seekInput?.removeEventListener("input", handleSeek);
    audio.removeEventListener("loadedmetadata", syncTimeline);
    audio.removeEventListener("durationchange", syncTimeline);
    audio.removeEventListener("timeupdate", syncTimeline);
    audio.removeEventListener("play", syncPlaybackState);
    audio.removeEventListener("pause", syncPlaybackState);
    audio.removeEventListener("ended", syncPlaybackState);
    audio.removeEventListener("volumechange", syncMuteState);
    audio.removeEventListener("error", disablePlayer);
    audio.pause();
  };

  function handleToggle() {
    if (!audio.paused && !audio.ended) {
      audio.pause();
      return;
    }

    if (audio.ended) audio.currentTime = 0;
    const playAttempt = audio.play();
    playAttempt?.catch(() => onPlaybackError?.());
  }

  function handleMute() {
    audio.muted = !audio.muted;
  }

  function handleSeek(event) {
    const nextTime = Number(event.currentTarget.value);
    if (!Number.isFinite(nextTime)) return;
    audio.currentTime = nextTime;
    syncTimeline();
  }

  function syncTimeline() {
    const duration = playbackDuration(audio.duration, fallbackDuration);
    const current = Number.isFinite(audio.currentTime)
      ? Math.min(Math.max(0, audio.currentTime), duration)
      : 0;
    const progress = duration > 0 ? (current / duration) * 100 : 0;

    if (seekInput) {
      seekInput.max = String(Math.max(duration, 0.01));
      seekInput.value = String(current);
      seekInput.style.setProperty("--audio-progress", `${progress}%`);
      seekInput.setAttribute(
        "aria-valuetext",
        `${formatPlaybackTime(current)} / ${formatPlaybackTime(duration)}`,
      );
    }
    updateTimeElement(currentTime, current);
    updateTimeElement(durationTime, duration);
  }

  function syncPlaybackState() {
    const isPlaying = !audio.paused && !audio.ended;
    toggleButton?.classList.toggle("is-playing", isPlaying);
    toggleButton?.setAttribute(
      "aria-label",
      t(isPlaying ? "recorder.pausePlayback" : "recorder.playPlayback"),
    );
  }

  function syncMuteState() {
    muteButton?.classList.toggle("is-muted", audio.muted);
    muteButton?.setAttribute("aria-pressed", String(audio.muted));
    muteButton?.setAttribute(
      "aria-label",
      t(audio.muted ? "recorder.unmutePlayback" : "recorder.mutePlayback"),
    );
  }

  function disablePlayer() {
    player.classList.add("is-disabled");
    controls.forEach((control) => {
      control.disabled = true;
    });
  }
}

function playbackDuration(actualDuration, fallbackDuration) {
  if (Number.isFinite(actualDuration) && actualDuration > 0) return actualDuration;
  if (Number.isFinite(fallbackDuration) && fallbackDuration > 0) return fallbackDuration;
  return 0;
}

function updateTimeElement(element, seconds) {
  if (!element) return;
  element.textContent = formatPlaybackTime(seconds);
  element.setAttribute("datetime", `PT${Math.max(0, Math.floor(seconds))}S`);
}

function formatPlaybackTime(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function recordingPanelContent({
  state,
  isRecording,
  isRequesting,
  isValidating,
  isReady,
  maxDurationSeconds,
}) {
  const error = state.error
    ? `<p class="form-message" role="alert">${escapeHtml(state.error)}</p>`
    : "";

  if (isRecording) {
    return `
      <div class="recording-status" aria-live="polite">
        <span><i aria-hidden="true"></i>${escapeHtml(t("recorder.recording"))}</span>
        <time class="recording-time" datetime="PT0S">
          <span data-elapsed>00:00</span><small>/ ${formatTime(maxDurationSeconds, maxDurationSeconds)}</small>
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
          <span>${escapeHtml(t("recorder.levelQuiet"))}</span>
          <strong data-level-label>${escapeHtml(t("recorder.levelWaiting"))}</strong>
          <span>${escapeHtml(t("recorder.levelFull"))}</span>
        </div>
      </div>
      <div class="recorder-actions">${recordingControls({ isRecording, isRequesting, isReady })}</div>
      ${error}
    `;
  }

  if (isReady) {
    return `
      <div class="recording-status" aria-live="polite">
        <span>${escapeHtml(t("recorder.done"))}</span>
        <time class="recording-time" datetime="PT${Math.floor(state.recording.duration)}S">
          <span data-elapsed>${formatTime(state.recording.duration, maxDurationSeconds)}</span>
        </time>
      </div>
      <div class="audio-preview" data-audio-player>
        <audio preload="metadata" data-audio-preview hidden></audio>
        <button
          class="audio-player__button audio-player__toggle"
          type="button"
          data-audio-toggle
          aria-label="${escapeHtml(t("recorder.playPlayback"))}"
        ><span class="audio-player__play-icon" aria-hidden="true"></span></button>
        <time class="audio-player__time" data-audio-current datetime="PT0S">00:00</time>
        <input
          class="audio-player__seek"
          type="range"
          min="0"
          max="${Math.max(0.01, state.recording.duration)}"
          value="0"
          step="0.01"
          data-audio-seek
          aria-label="${escapeHtml(t("recorder.seekPlayback"))}"
        />
        <time
          class="audio-player__time"
          data-audio-duration
          datetime="PT${Math.floor(state.recording.duration)}S"
        >${formatTime(state.recording.duration, maxDurationSeconds)}</time>
        <button
          class="audio-player__button audio-player__mute"
          type="button"
          data-audio-mute
          aria-label="${escapeHtml(t("recorder.mutePlayback"))}"
          aria-pressed="false"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9h4l5-4v14l-5-4H4z" />
            <path class="audio-player__waves" d="M16 9c1.4 1.7 1.4 4.3 0 6m2.7-8.5c3 3 3 8 0 11" />
            <path class="audio-player__mute-slash" d="m16 9 5 6" />
          </svg>
        </button>
      </div>
      <p class="form-message" role="alert" data-playback-message hidden></p>
      ${
        state.recording.qualityWarning
          ? `<p class="form-message" role="status">${escapeHtml(state.recording.qualityWarning)}</p>`
          : ""
      }
      ${error}
      <div class="recorder-actions">${recordingControls({
        isRecording,
        isRequesting,
        isValidating,
        isReady,
      })}</div>
    `;
  }

  return `
    ${error}
    <div class="recorder-actions">${recordingControls({
      isRecording,
      isRequesting,
      isValidating,
      isReady,
    })}</div>
  `;
}

function describeLevel(level) {
  if (level < 0.12) return t("recorder.levelWaiting");
  if (level < 0.38) return t("recorder.levelSoft");
  if (level < 0.72) return t("recorder.levelClear");
  return t("recorder.levelStrong");
}

function recordingControls({ isRecording, isRequesting, isValidating, isReady }) {
  if (isRecording) {
    return `<button class="record-button record-button--stop" type="button" data-action="stop"><span></span>${escapeHtml(t("recorder.stop"))}</button>`;
  }
  if (isReady) {
    return `
      <button class="button button--ghost" type="button" data-action="reset">${escapeHtml(t("recorder.retake"))}</button>
      <button class="button button--primary" type="button" data-action="submit">${escapeHtml(t("recorder.submit"))}</button>
    `;
  }
  return `
    <button class="record-button" type="button" data-action="start" ${
      isRequesting || isValidating ? "disabled" : ""
    }>
      <span class="record-button__dot"></span>${
        isRequesting
          ? escapeHtml(t("recorder.requesting"))
          : isValidating
            ? escapeHtml(t("recorder.validating"))
            : escapeHtml(t("recorder.start"))
      }
    </button>
  `;
}

function formatTime(seconds, maxSeconds = 60) {
  const safeSeconds = Math.min(maxSeconds, Math.max(0, Math.floor(seconds)));
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
