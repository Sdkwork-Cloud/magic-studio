const PCM_BYTES_PER_SAMPLE = 2;
const WAV_HEADER_SIZE = 44;

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function clampSample(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(-1, Math.min(1, value));
}

function toPcm16(sample: number): number {
  const clamped = clampSample(sample);
  if (clamped <= -1) {
    return -32768;
  }
  if (clamped < 0) {
    return Math.round(clamped * 32768);
  }
  return Math.round(clamped * 32767);
}

export function encodePcm16Wav({
  sampleRate,
  channelData,
}: {
  sampleRate: number;
  channelData: Float32Array[];
}): Uint8Array {
  const channels = Math.max(1, channelData.length);
  const sampleCount = channelData[0]?.length ?? 0;
  const blockAlign = channels * PCM_BYTES_PER_SAMPLE;
  const byteRate = sampleRate * blockAlign;
  const dataSize = sampleCount * blockAlign;
  const buffer = new ArrayBuffer(WAV_HEADER_SIZE + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = WAV_HEADER_SIZE;
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < channels; channelIndex += 1) {
      const channel = channelData[channelIndex] ?? channelData[0];
      view.setInt16(offset, toPcm16(channel?.[sampleIndex] ?? 0), true);
      offset += PCM_BYTES_PER_SAMPLE;
    }
  }

  return new Uint8Array(buffer);
}

export function encodeAudioBufferToWav(
  audioBuffer: Pick<AudioBuffer, 'sampleRate' | 'numberOfChannels' | 'getChannelData'>
): Blob {
  const channelData = Array.from({ length: audioBuffer.numberOfChannels }, (_, index) =>
    audioBuffer.getChannelData(index)
  );
  const encoded = encodePcm16Wav({ sampleRate: audioBuffer.sampleRate, channelData });
  const arrayBuffer = new ArrayBuffer(encoded.byteLength);
  new Uint8Array(arrayBuffer).set(encoded);

  return new Blob([arrayBuffer], {
    type: 'audio/wav',
  });
}
