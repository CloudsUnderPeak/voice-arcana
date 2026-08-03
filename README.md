# Voice Arcana

[繁體中文](README.zh-TW.md)

**[Open the live demo](https://cloudsunderpeak.github.io/voice-arcana/)**

A local-first voice portrait experiment that turns one minute of your voice into an original sound card.

Voice Arcana asks you to read a short passage aloud. Right in your browser, it analyzes the temporal and spectral features of the recording, draws a six-axis "sound portrait" — brightness, crispness, liveliness, spaciousness, texture, and energy — and picks the closest of eight original voice archetypes as your card. It borrows the ritual of card reading, not the deck: there is no traditional tarot system or divination involved.

## Why This Project

Voice analysis tools usually mean uploading recordings to someone's server. Voice Arcana explores the opposite: everything — recording, decoding, FFT, feature normalization, and card matching — runs inside the browser. Nothing is uploaded, no account exists, and closing the tab releases everything. The project doubles as a working reference for a browser-only audio pipeline: MediaRecorder capture, fixed-rate decoding, Web Worker analysis, and literature-calibrated acoustic features.

## How It Feels to Use

1. Read the privacy promise and a one-minute passage about Art Deco.
2. Tap record; a live level meter follows your voice, and recording stops at 60 seconds.
3. Preview the take, then send it to local analysis with a progress ritual.
4. Your sound card is revealed with the six-axis portrait, a reading, and a question for you.
5. Share a generated result image or a URL that carries only the card id and axis scores.

## Highlights

- **Fully local**: recording, analysis, and the share image never leave the device; the deployed site ships a CSP with `connect-src 'none'` as a technical guardrail.
- **Grounded acoustics**: the six axes build on spectral centroid, HNR-proxy periodicity, zero-crossing rate, and dynamics, calibrated against speech-acoustics literature, a synthetic-voice bench, and real recordings.
- **Eight original archetypes**: each card has its own artwork, reading, and question, matched by six-dimensional distance.
- **Bilingual**: Traditional Chinese and English, auto-detected with a one-tap toggle; share links and OG pages follow the language.
- **Shareable without a backend**: a Canvas-drawn result image, a stateless result URL, and pre-rendered per-card OG pages for social previews.
- **No framework**: native ES modules with a small hand-rolled store and i18n; Vite is used only for dev serving and static bundling.

## Who It Is For

- People curious about voice, storytelling, interactive art, or gentle self-reflection.
- Curators and design teams needing an exhibition or workshop piece with zero data liability.
- Frontend developers who want a worked example of a browser-only audio pipeline.

It is explicitly **not** a tool for speech therapy, medical diagnosis, speaker identification, or voiceprint verification.

## Quick Start

Requires Node.js 22.12+.

```bash
npm install
npm run dev      # development server
npm test         # domain and state-machine tests
npm run check    # syntax check across src/test/tools + tests
npm run build    # static build into dist/ (with CSP meta)
npm run preview  # preview the production build
```

`dist/` deploys to any static host — no application backend. With GNU Make installed, the same commands are available as `make dev`, `make build`, and so on (see [Makefile](Makefile)).

## Documentation

Start at [docs/SPEC_INDEX.md](docs/SPEC_INDEX.md) (documentation is written in Traditional Chinese). Product scope, behavior, and acceptance live in [docs/SPEC_BEHAVIOR.md](docs/SPEC_BEHAVIOR.md); architecture, milestones, and risks in [docs/SPEC_TECHNICAL.md](docs/SPEC_TECHNICAL.md); the acoustic method and its limits in [docs/AUDIO_ANALYSIS.md](docs/AUDIO_ANALYSIS.md); art delivery specs in [docs/ART_ASSET_BRIEF.md](docs/ART_ASSET_BRIEF.md).

```text
src/
├─ app/                  session state and experience flow coordination
├─ assets/               card artwork and other build-managed static assets
├─ domain/               card vectors, FFT, and six-axis analysis (no UI copy)
├─ i18n/                 locale dictionaries (zh-Hant / en) and runtime
├─ infrastructure/audio/ recording and AudioBuffer decoding
├─ pages/                experience, processing, and result pages
├─ ui/                   shared header, card art, share image
└─ styles/               tokens, base, pages, responsive rules
```

## Privacy and Boundaries

- Recordings stay in the tab's memory via `MediaRecorder`; decoding, FFT, normalization, and card matching all happen in the browser.
- No API, database, login, cookies, or analytics tracking; refreshing or closing the tab releases the recording.
- Share URLs carry only the card id and six axis scores — never audio or voice-recoverable data.
- The sound portrait is a creative interpretation, not a diagnosis of personality, emotion, gender, health, or identity.

## Known Limitations

- The "Intimate–Expansive" and "Clear–Husky" axes are creative translations of acoustic proxies, not professional timbre diagnostics.
- Microphones, room reflections, background noise, and reading distance all shift the result.
- Single-session only: no history is stored; the share image is generated locally and saved via long-press (or right-click) from the overlay.
- The current card faces are a shared generated visual system; per-card illustrations and motion are future milestone work.
