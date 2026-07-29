const initialState = Object.freeze({
  view: "experience",
  recordingStatus: "idle",
  recording: null,
  analysis: null,
  error: "",
});

export function createSessionStore() {
  let state = { ...initialState };
  const listeners = new Set();

  return {
    getState() {
      return state;
    },
    setState(patch) {
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener(state));
    },
    reset() {
      state = { ...initialState };
      listeners.forEach((listener) => listener(state));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

