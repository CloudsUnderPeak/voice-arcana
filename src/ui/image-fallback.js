// Mark failed artwork loads with is-missing so CSS can show a fallback visual.
// Assets resolve from src/ in a plain server and are rewritten by Vite in builds.
export function bindArtworkFallbacks(root) {
  const images = [...root.querySelectorAll("img[data-artwork]")];
  const bindings = images.map((image) => {
    const handleError = () => {
      image.classList.add("is-missing");
    };

    image.addEventListener("error", handleError);
    if (image.complete && image.naturalWidth === 0) {
      handleError();
    }

    return { image, handleError };
  });

  return () => {
    bindings.forEach(({ image, handleError }) => {
      image.removeEventListener("error", handleError);
    });
  };
}
