export type MediaRecorderFormat = 'mp4' | 'mov' | 'webm' | 'txt';

const MP4_CANDIDATES = [
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4',
];

const WEBM_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export function resolveMediaRecorderMimeType(
  format: MediaRecorderFormat,
  isTypeSupported: (candidate: string) => boolean
) {
  if (format === 'mov' || format === 'txt') {
    return '';
  }

  const preferred = format === 'webm' ? WEBM_CANDIDATES : MP4_CANDIDATES;

  return preferred.find((candidate) => isTypeSupported(candidate)) || '';
}
