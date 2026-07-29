export function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function scale(value, minimum, maximum) {
  return clamp01((value - minimum) / (maximum - minimum));
}

export function mean(values) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function standardDeviation(values) {
  if (values.length < 2) return 0;
  const average = mean(values);
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance);
}

