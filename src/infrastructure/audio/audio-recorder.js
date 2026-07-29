export class AudioRecorder {
  constructor({ maxDurationSeconds = 60 } = {}) {
    this.maxDurationSeconds = maxDurationSeconds;
    this.stream = null;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.animationFrame = 0;
    this.chunks = [];
    this.startedAt = 0;
    this.displayLevel = 0;
    this.levelUpdatedAt = 0;
    this.options = {};
    this.stopPromise = null;
  }

  async start(options = {}) {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error("Recording API is unavailable");
    }

    this.options = options;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    const mimeType = selectMimeType();
    this.mediaRecorder = new MediaRecorder(
      this.stream,
      mimeType ? { mimeType } : undefined,
    );
    this.chunks = [];
    this.mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    });

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;
    source.connect(analyser);

    this.startedAt = performance.now();
    this.displayLevel = 0;
    this.levelUpdatedAt = this.startedAt;
    this.mediaRecorder.start(250);
    this.monitor(analyser);
  }

  monitor(analyser) {
    const samples = new Uint8Array(analyser.fftSize);

    const tick = () => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== "recording") return;

      analyser.getByteTimeDomainData(samples);
      let energy = 0;
      for (const sample of samples) {
        const normalized = (sample - 128) / 128;
        energy += normalized * normalized;
      }
      const rms = Math.sqrt(energy / samples.length);
      const targetLevel = Math.min(1, Math.pow(rms * 7, 0.65));
      const now = performance.now();
      const elapsed = Math.min(50, Math.max(0, now - this.levelUpdatedAt));
      const timeConstant = targetLevel > this.displayLevel ? 140 : 420;
      const blend = 1 - Math.exp(-elapsed / timeConstant);
      this.displayLevel += (targetLevel - this.displayLevel) * blend;
      if (targetLevel < 0.01 && this.displayLevel < 0.01) this.displayLevel = 0;
      this.levelUpdatedAt = now;

      const seconds = (now - this.startedAt) / 1000;
      this.options.onLevel?.(this.displayLevel);
      this.options.onTime?.(seconds);

      if (seconds >= this.maxDurationSeconds) {
        this.stop().then((recording) => this.options.onAutoStop?.(recording));
        return;
      }
      this.animationFrame = requestAnimationFrame(tick);
    };

    tick();
  }

  stop() {
    if (this.stopPromise) return this.stopPromise;
    if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
      return Promise.resolve(null);
    }

    this.stopPromise = new Promise((resolve) => {
      this.mediaRecorder.addEventListener(
        "stop",
        () => {
          const duration = Math.min(
            this.maxDurationSeconds,
            (performance.now() - this.startedAt) / 1000,
          );
          const type = this.mediaRecorder.mimeType || "audio/webm";
          const blob = new Blob(this.chunks, { type });
          const recording = { blob, duration, url: URL.createObjectURL(blob), type };
          this.cleanup();
          resolve(recording);
        },
        { once: true },
      );
      this.mediaRecorder.stop();
    });

    return this.stopPromise;
  }

  cancel() {
    if (this.mediaRecorder?.state === "recording") this.mediaRecorder.stop();
    this.cleanup();
  }

  cleanup() {
    cancelAnimationFrame(this.animationFrame);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.audioContext?.close();
    this.stream = null;
    this.audioContext = null;
  }
}

function selectMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}
