export function bindPublicAssetFallbacks(root) {
  const images = [...root.querySelectorAll("img[data-public-fallback]")];
  const bindings = images.map((image) => {
    const handleError = () => {
      if (image.dataset.fallbackAttempted === "true") {
        image.classList.add("is-missing");
        return;
      }

      image.dataset.fallbackAttempted = "true";
      image.src = image.dataset.publicFallback;
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
