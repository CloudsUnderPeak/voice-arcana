export const EN = Object.freeze({
  meta: {
    htmlLang: "en",
    title: "Voice Arcana | Hear Your Sound Portrait",
    description:
      "Voice Arcana analyzes one minute of your voice entirely in the browser, drawing a six-axis sound portrait and revealing your original sound card.",
  },
  header: {
    brandAria: "Voice Arcana home",
    subtitle: "Sound Portrait",
    context: "A sound-card reading",
    langSwitch: "中文",
    langSwitchAria: "切換為中文",
  },
  hero: {
    eyebrow: "VOICE ARCANA · SOUND PORTRAIT",
    titleLine1: "Let your voice",
    titleLine2: "become a card.",
    lead: "Read a short passage aloud. Right in your browser, we trace the light, texture, and energy of your voice to find the sound card that resonates with you now.",
    privacy: "Recording and analysis happen only on this device. Nothing is uploaded.",
    deckAria: "Eight original sound cards",
    deckTitle: "Eight voice archetypes",
    deckHint: "Which card will this minute turn over?",
  },
  reading: {
    eyebrow: "Today's reading · About one minute",
    sectionTitle: "Read a moment about beauty",
    topic: "Art Deco",
    duration: "Aim for 50–60 seconds",
    title: "Teaching Geometry to Shine",
    paragraphs: [
      "In the nineteen-twenties, cities suddenly learned to speak in straight lines, sunbursts, and gold. People folded ancient order, machine-age speed, and dreams of the future into buildings, jewelry, and posters. Symmetry steadied the eye; rising silhouettes made skylines look ready for takeoff. Even a doorway, a lamp, or a small powder case could carry the glow of a stage.",
      "When night fell, theaters and ballrooms lit up in layered outlines — glass reflecting copper, stone holding a confident rhythm. Art Deco was never mere decoration. It believed daily life deserved careful arrangement: a line can guide your steps, a color can change your breathing, and repeating geometry helps strangers find their way in the same city. Beauty stopped being distant — it waited in every pause and upward glance.",
    ],
  },
  recorder: {
    panelAria: "Recording controls",
    recording: "Recording",
    done: "Recording complete",
    start: "Start recording",
    stop: "Stop recording",
    requesting: "Opening the microphone…",
    validating: "Checking the recording…",
    retake: "Record again",
    submit: "Draw my sound portrait",
    levelQuiet: "Soft",
    levelFull: "Full",
    levelWaiting: "Waiting for sound",
    levelSoft: "A little quiet",
    levelClear: "Coming through clearly",
    levelStrong: "Rich and full",
    playPlayback: "Play recording",
    pausePlayback: "Pause recording",
    seekPlayback: "Seek through recording",
    mutePlayback: "Mute recording",
    unmutePlayback: "Unmute recording",
    playbackError:
      "This recording can't be played back in this browser. Please record again or switch to an up-to-date browser.",
    lowSignalWarning:
      "The signal is a little quiet. You can continue, or move closer to the microphone and record again.",
  },
  errors: {
    noRecordingData:
      "No usable audio was received. Please check your microphone and record again.",
    tooShort: "Please record at least {seconds} seconds so your portrait has enough to work with.",
    decodeFailed:
      "This recording couldn't be read. Please record again or switch to an up-to-date browser.",
    silentRecording:
      "This recording contains no usable sound. Please check your microphone and record again.",
    analysisFailed: "This recording couldn't be analyzed just now. Please record again.",
    unsupportedBrowser:
      "This browser doesn't support web recording. Please use the latest Chrome, Edge, Firefox, or Safari.",
    micDenied: "Microphone access is blocked. Please allow this site to use your microphone and try again.",
    micNotFound: "No microphone was found. Please make sure one is connected.",
    micFailed: "The microphone couldn't be started. Please check browser permissions and device settings.",
  },
  processing: {
    eyebrow: "LOCAL AUDIO ANALYSIS",
    title: "Listening to the shape of your voice",
    preparing: "Preparing local analysis",
    progressAria: "Voice analysis progress",
    privacy: "Your voice never leaves this device",
    steps: ["Waveform", "Timbre", "Your card"],
    stages: {
      decode: "Unfolding the spectrum of your voice",
      temporal: "Tracing sound and silence",
      spectral: "Reading the light and shade of your timbre",
      pitch: "Following the contour of your pitch",
      axes: "Comparing rhythm and energy",
      portrait: "Drawing your six voice dimensions",
      matching: "Finding the card that resonates with you",
      done: "Your sound portrait is ready",
    },
  },
  result: {
    localSeal: "Your voice never left this device",
    eyebrow: "VOICE ARCANA · SOUND CARD {number}",
    titlePrefix: "Your sound card: ",
    portraitTitle: "Sound Portrait",
    questionLabel: "A question for you",
    retake: "Record again",
    tryMine: "Try it with my voice",
    preparingImage: "Preparing image",
    share: "Share result",
    imageFailed: "Couldn't create image",
    imageFailedStatus: "The share image couldn't be created. Please try again later.",
    overlayAria: "Result share image",
    overlayImageAlt: "Sound card share image: {name}",
    overlayHint: "Long-press (or right-click) to save the image and share it anywhere.",
    close: "Close",
    axisRangeAria: "{low} to {high}",
  },
  resultImage: {
    banner: "VOICE ARCANA · YOUR SOUND PORTRAIT",
    soundCard: "SOUND CARD {number}",
    yourCard: "Your sound card",
    portraitTitle: "Sound Portrait",
    questionLabel: "A QUESTION FOR YOU",
    cta: "Try your own sound card",
    blobFailed: "The share image couldn't be created. Please try again later.",
    cannotCreate: "This browser can't create the share image.",
  },
  sharePage: {
    title: "My sound card is “{name}” | Voice Arcana",
    description:
      "{tagline}. Record one minute of your voice and see which sound card you turn over — the analysis never leaves your device.",
    opening: "Opening your sound card…",
    goto: "Go to Voice Arcana",
  },
  axes: {
    brightness: { low: "Deep", high: "Bright", description: "Tone color" },
    sharpness: { low: "Soft", high: "Crisp", description: "Treble contour" },
    bounce: { low: "Steady", high: "Lively", description: "Rhythmic motion" },
    openness: { low: "Intimate", high: "Expansive", description: "Sense of space" },
    raspiness: { low: "Clear", high: "Husky", description: "Vocal texture" },
    energy: { low: "Calm", high: "Energetic", description: "Overall drive" },
  },
  cards: {
    "blank-keeper": {
      name: "The Blank Keeper",
      tagline: "Let silence keep its shape",
      reading:
        "Your voice knows how to step back and let meaning surface between the pauses. Because you never rush to fill the space, the smallest feelings become easier to hear.",
      question: "If you didn't have to answer right away, what would you truly want to keep?",
      profile:
        "A voice that belongs to the Blank Keeper is usually quiet and measured: the tone settles low, and breath lives between the sentences instead of being squeezed out. Pauses become part of the message — listeners hear, inside those gaps, the things not yet said. That restraint is exactly what the Blank Keeper answers: silence has a shape of its own, and waiting is also a way of speaking.",
      artAlt: "A figure stands between an empty doorway and fading sound waves, holding a span of stillness",
    },
    "fire-starter": {
      name: "The Fire Starter",
      tagline: "Hand the first light to the world",
      reading:
        "Your voice carries a forward-moving warmth that can set vague ideas alight. When you believe in something, your rhythm reaches people before your words do.",
      question: "What is most worth taking the first step toward right now?",
      profile:
        "A voice that resonates with the Fire Starter is bright and forward-moving: the tone sits close, the rhythm rises and falls, and momentum carries from the first line to the last. A voice like this lights sentences up — attention gathers before they even end. That heat is what the Fire Starter answers: the first light handed to the world usually sounds exactly like this.",
      artAlt: "A figure raises a flame high as rays and sparks fan upward",
    },
    listener: {
      name: "The Listener",
      tagline: "Hear first, before drawing close",
      reading:
        "Your voice doesn't compete for attention — it makes room. Its softness and steadiness let people trust you with feelings they haven't sorted out yet.",
      question: "Do you offer yourself the same patience?",
      profile:
        "A voice that belongs to the Listener is warm and steady: the volume stays gathered, the contours soft, competing with no one for the room. What it builds is a sense of being held — people trust it with feelings they have not sorted out yet. The Listener answers that texture: hearing first, before drawing close, is a rare ability in itself.",
      artAlt: "A figure cradles a spiral vessel of sound as waves gather toward its center",
    },
    traveler: {
      name: "The Traveler",
      tagline: "Measure the unknown with your voice",
      reading:
        "Your voice moves — sentences wander like paths along a horizon. Change isn't restlessness for you; it's how you make sense of the world.",
      question: "On the next journey, what will you carry, and what are you willing to set down?",
      profile:
        "A voice that resonates with the Traveler visibly moves: the intonation swings wide, the dynamics open up, and sentences push forward like paths along a horizon. It does not settle in one place — change is how it makes sense of the world. That motion is what the Traveler answers: measuring the unknown with sound.",
      artAlt: "A figure passes through layered archways, following a path toward distant starlight",
    },
    "dream-builder": {
      name: "The Dream Builder",
      tagline: "Build a bridge to what doesn't exist yet",
      reading:
        "Your voice holds imagination and order at once. Its bright outline makes the vision visible, while its gentle momentum keeps it from staying only a dream.",
      question: "Which recurring thought is waiting for you to give it a name?",
      profile:
        "A voice that belongs to the Dream Builder is bright and clean without being loud: it keeps a clear outline and a gentle push, stacking imagination into something you can almost see. Order and vision live in it at once — things spoken in this voice sound one step closer to real. That is what the Dream Builder answers: building a bridge to what does not exist yet.",
      artAlt: "A figure assembles geometric arches and stairways into a dreamlike structure",
    },
    "night-keeper": {
      name: "The Night Keeper",
      tagline: "In the quiet, hear what is still unsaid",
      reading:
        "Your voice carries the weight of nightfall — not dazzling, but steadfast company. You guard the faint light inside confusion until things reveal their true outline.",
      question: "What needs to be protected rather than immediately solved?",
      profile:
        "A voice that belongs to the Night Keeper is low and still, its texture faintly grained, like something time has sanded. It does not dazzle; it keeps company — a lowered conversation late at night, where the important lines land heavier. The Night Keeper answers that steadiness: guarding the faint light inside confusion until things show their true outline.",
      artAlt: "A guardian figure holds a faint glow before concentric sound waves and arches of night",
    },
    "echo-bearer": {
      name: "The Echo Bearer",
      tagline: "Let one sentence travel beyond the moment",
      reading:
        "Your voice is full of space and afterglow, easily happening a second time in someone's mind. You speak more than content — you leave a climate that can be remembered.",
      question: "Which of today's words do you hope will still be heard in the future?",
      profile:
        "A voice that resonates with the Echo Bearer carries its own sense of space: it is unhurried about arriving, leaves an afterglow between phrases, and holds a trace of huskiness that makes people look back. Words spoken in it tend to happen twice — once now, and once later in someone's memory. That resonance is what the Echo Bearer answers: letting one sentence travel beyond the moment.",
      artAlt: "A figure stands beside a translucent echo of themselves, holding a hollow ring",
    },
    "wave-breaker": {
      name: "The Wave Breaker",
      tagline: "Turn resistance into a forward beat",
      reading:
        "Your voice has clear edges and momentum, like a bow cutting through water. It doesn't avoid friction — it finds direction inside it.",
      question: "Which wave is inviting you to prove your strength?",
      profile:
        "A voice that belongs to the Wave Breaker has visible edges: crisp articulation, a grained texture, and momentum like a bow cutting water. It does not avoid friction — it finds its beat inside resistance. That force is what the Wave Breaker answers: turning what pushes back into a rhythm that moves forward.",
      artAlt: "A figure strides through parted waves of sound, toward where the light rises",
    },
  },
  cardArt: {
    fallbackAlt: "An Art Deco card of sound waves and geometric figures",
    altTemplate: "{name} sound card: {artAlt}",
  },
});
