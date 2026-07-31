// Workspaces and Hann-window tables cached per FFT size; magnitudeSpectrum runs
// once per frame, so reuse avoids heavy temporary allocation across 96+ frames.
const workspaces = new Map();

function getWorkspace(size) {
  let workspace = workspaces.get(size);
  if (!workspace) {
    const hannWindow = new Float64Array(size);
    for (let index = 0; index < size; index += 1) {
      hannWindow[index] = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1));
    }
    workspace = {
      real: new Float64Array(size),
      imaginary: new Float64Array(size),
      hannWindow,
    };
    workspaces.set(size, workspace);
  }
  return workspace;
}

export function magnitudeSpectrum(input) {
  const size = input.length;
  if ((size & (size - 1)) !== 0) {
    throw new Error("FFT input length must be a power of two");
  }

  const { real, imaginary, hannWindow } = getWorkspace(size);
  imaginary.fill(0);
  const bits = Math.log2(size);

  for (let index = 0; index < size; index += 1) {
    real[reverseBits(index, bits)] = input[index] * hannWindow[index];
  }

  for (let block = 2; block <= size; block *= 2) {
    const half = block / 2;
    const angle = (-2 * Math.PI) / block;
    for (let start = 0; start < size; start += block) {
      for (let offset = 0; offset < half; offset += 1) {
        const phase = angle * offset;
        const cosine = Math.cos(phase);
        const sine = Math.sin(phase);
        const even = start + offset;
        const odd = even + half;
        const oddReal = real[odd] * cosine - imaginary[odd] * sine;
        const oddImaginary = real[odd] * sine + imaginary[odd] * cosine;

        real[odd] = real[even] - oddReal;
        imaginary[odd] = imaginary[even] - oddImaginary;
        real[even] += oddReal;
        imaginary[even] += oddImaginary;
      }
    }
  }

  const magnitudes = new Float64Array(size / 2);
  for (let index = 0; index < magnitudes.length; index += 1) {
    magnitudes[index] = Math.hypot(real[index], imaginary[index]);
  }
  return magnitudes;
}

function reverseBits(value, bitCount) {
  let result = 0;
  for (let bit = 0; bit < bitCount; bit += 1) {
    result = (result << 1) | ((value >> bit) & 1);
  }
  return result;
}
