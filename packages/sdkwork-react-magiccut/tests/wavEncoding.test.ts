import { describe, expect, it } from 'vitest';

import { encodePcm16Wav } from '../src/domain/export/wavEncoding';

function readAscii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

describe('encodePcm16Wav', () => {
  it('writes a RIFF/WAVE header with 16-bit pcm metadata', () => {
    const bytes = encodePcm16Wav({
      sampleRate: 48000,
      channelData: [new Float32Array([0, -1, 1])],
    });
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    expect(readAscii(bytes, 0, 4)).toBe('RIFF');
    expect(readAscii(bytes, 8, 4)).toBe('WAVE');
    expect(readAscii(bytes, 12, 4)).toBe('fmt ');
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(48000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(readAscii(bytes, 36, 4)).toBe('data');
    expect(view.getUint32(40, true)).toBe(6);
  });

  it('encodes and interleaves sample data as signed 16-bit pcm', () => {
    const bytes = encodePcm16Wav({
      sampleRate: 44100,
      channelData: [
        new Float32Array([-1, 0.5]),
        new Float32Array([1, -0.5]),
      ],
    });
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    expect(view.getInt16(44, true)).toBe(-32768);
    expect(view.getInt16(46, true)).toBe(32767);
    expect(view.getInt16(48, true)).toBe(16384);
    expect(view.getInt16(50, true)).toBe(-16384);
  });
});
