export async function decodeAudioBlob(blob) {
  const context = new AudioContext();
  try {
    const bytes = await blob.arrayBuffer();
    return await context.decodeAudioData(bytes);
  } finally {
    await context.close();
  }
}

