const svgToDataUrl = (svg: string): string =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const hashSeed = (seed: string): number => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const normalizeColor = (color: string, fallback: string): string =>
  /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;

const shiftColor = (color: string, amount: number): string => {
  const safeColor = normalizeColor(color, '#5b8cff').slice(1);
  const red = clamp(parseInt(safeColor.slice(0, 2), 16) + amount, 0, 255);
  const green = clamp(parseInt(safeColor.slice(2, 4), 16) + amount, 0, 255);
  const blue = clamp(parseInt(safeColor.slice(4, 6), 16) + amount, 0, 255);
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const toInitials = (value: string): string => {
  const tokens = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return 'MS';
  }

  return tokens
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() || '')
    .join('');
};

export const OFFLINE_DEMO_AUDIO_URL = '/demo-media/magic-studio-preview.wav';
export const OFFLINE_DEMO_VIDEO_URL = '/demo-media/magic-studio-preview.mp4';

interface OfflineArtworkOptions {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: string;
  accent?: string;
  width?: number;
  height?: number;
}

export const createOfflineArtwork = ({
  title,
  subtitle,
  eyebrow = 'Magic Studio',
  badge,
  accent = '#5b8cff',
  width = 1280,
  height = 720,
}: OfflineArtworkOptions): string => {
  const baseAccent = normalizeColor(accent, '#5b8cff');
  const accentSoft = shiftColor(baseAccent, 48);
  const accentDeep = shiftColor(baseAccent, -42);
  const cardId = `card-${hashSeed(`${title}:${subtitle || ''}:${baseAccent}`)}`;
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle || 'Offline-ready bundled preview');
  const safeEyebrow = escapeXml(eyebrow);
  const safeBadge = badge ? escapeXml(badge) : '';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="${cardId}-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#04070d"/>
      <stop offset="45%" stop-color="#121826"/>
      <stop offset="100%" stop-color="#020304"/>
    </linearGradient>
    <linearGradient id="${cardId}-accent" x1="0.1" y1="0.1" x2="0.9" y2="0.9">
      <stop offset="0%" stop-color="${accentSoft}" stop-opacity="0.96"/>
      <stop offset="100%" stop-color="${accentDeep}" stop-opacity="0.88"/>
    </linearGradient>
    <radialGradient id="${cardId}-glow" cx="0.8" cy="0.2" r="0.9">
      <stop offset="0%" stop-color="${baseAccent}" stop-opacity="0.48"/>
      <stop offset="100%" stop-color="${baseAccent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="${Math.round(height * 0.06)}" fill="url(#${cardId}-bg)"/>
  <rect width="${width}" height="${height}" fill="url(#${cardId}-glow)"/>
  <circle cx="${Math.round(width * 0.84)}" cy="${Math.round(height * 0.18)}" r="${Math.round(height * 0.2)}" fill="${baseAccent}" fill-opacity="0.18"/>
  <circle cx="${Math.round(width * 0.14)}" cy="${Math.round(height * 0.9)}" r="${Math.round(height * 0.24)}" fill="${accentSoft}" fill-opacity="0.12"/>
  <rect x="${Math.round(width * 0.07)}" y="${Math.round(height * 0.12)}" width="${Math.round(width * 0.86)}" height="${Math.round(height * 0.76)}" rx="${Math.round(height * 0.05)}" fill="#0a1019" fill-opacity="0.72" stroke="rgba(255,255,255,0.14)"/>
  <rect x="${Math.round(width * 0.11)}" y="${Math.round(height * 0.18)}" width="${Math.round(width * 0.78)}" height="${Math.round(height * 0.52)}" rx="${Math.round(height * 0.04)}" fill="url(#${cardId}-accent)" fill-opacity="0.28"/>
  <path d="M${Math.round(width * 0.12)} ${Math.round(height * 0.63)}C${Math.round(width * 0.28)} ${Math.round(height * 0.44)} ${Math.round(width * 0.42)} ${Math.round(height * 0.84)} ${Math.round(width * 0.6)} ${Math.round(height * 0.6)}C${Math.round(width * 0.72)} ${Math.round(height * 0.46)} ${Math.round(width * 0.78)} ${Math.round(height * 0.7)} ${Math.round(width * 0.89)} ${Math.round(height * 0.48)}" stroke="${accentSoft}" stroke-width="${Math.max(6, Math.round(width * 0.007))}" stroke-linecap="round" stroke-opacity="0.85"/>
  <text x="${Math.round(width * 0.12)}" y="${Math.round(height * 0.24)}" fill="rgba(255,255,255,0.62)" font-size="${Math.round(height * 0.05)}" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">${safeEyebrow}</text>
  <text x="${Math.round(width * 0.12)}" y="${Math.round(height * 0.42)}" fill="#ffffff" font-size="${Math.round(height * 0.11)}" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${safeTitle}</text>
  <text x="${Math.round(width * 0.12)}" y="${Math.round(height * 0.52)}" fill="rgba(255,255,255,0.74)" font-size="${Math.round(height * 0.05)}" font-family="Segoe UI, Arial, sans-serif">${safeSubtitle}</text>
  ${
    safeBadge
      ? `<g>
    <rect x="${Math.round(width * 0.12)}" y="${Math.round(height * 0.58)}" width="${Math.round(width * 0.18)}" height="${Math.round(height * 0.08)}" rx="${Math.round(height * 0.02)}" fill="${baseAccent}"/>
    <text x="${Math.round(width * 0.14)}" y="${Math.round(height * 0.635)}" fill="#ffffff" font-size="${Math.round(height * 0.036)}" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${safeBadge}</text>
  </g>`
      : ''
  }
  <g opacity="0.6">
    <rect x="${Math.round(width * 0.69)}" y="${Math.round(height * 0.67)}" width="${Math.round(width * 0.17)}" height="${Math.round(height * 0.03)}" rx="${Math.round(height * 0.015)}" fill="#ffffff"/>
    <rect x="${Math.round(width * 0.69)}" y="${Math.round(height * 0.73)}" width="${Math.round(width * 0.13)}" height="${Math.round(height * 0.02)}" rx="${Math.round(height * 0.01)}" fill="#ffffff" fill-opacity="0.72"/>
    <rect x="${Math.round(width * 0.69)}" y="${Math.round(height * 0.79)}" width="${Math.round(width * 0.09)}" height="${Math.round(height * 0.02)}" rx="${Math.round(height * 0.01)}" fill="#ffffff" fill-opacity="0.48"/>
  </g>
</svg>`;

  return svgToDataUrl(svg.trim());
};

interface OfflineAvatarOptions {
  name: string;
  seed?: string;
  accent?: string;
  size?: number;
}

export const createOfflineAvatar = ({
  name,
  seed = name,
  accent = '#5b8cff',
  size = 96,
}: OfflineAvatarOptions): string => {
  const hash = hashSeed(seed);
  const baseAccent = normalizeColor(accent, '#5b8cff');
  const accentSoft = shiftColor(baseAccent, 36);
  const accentDeep = shiftColor(baseAccent, -32);
  const initials = escapeXml(toInitials(name));
  const orbitX = 24 + (hash % 32);
  const orbitY = 24 + ((hash >> 4) % 32);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 96 96" fill="none">
  <defs>
    <linearGradient id="avatar-${hash}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accentSoft}"/>
      <stop offset="100%" stop-color="${accentDeep}"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="48" fill="#08111e"/>
  <circle cx="${orbitX}" cy="${orbitY}" r="28" fill="${baseAccent}" fill-opacity="0.28"/>
  <circle cx="68" cy="68" r="24" fill="${accentSoft}" fill-opacity="0.2"/>
  <circle cx="48" cy="48" r="34" fill="url(#avatar-${hash})"/>
  <circle cx="48" cy="48" r="33" stroke="rgba(255,255,255,0.16)"/>
  <text x="48" y="58" text-anchor="middle" fill="#ffffff" font-size="30" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${initials}</text>
</svg>`;

  return svgToDataUrl(svg.trim());
};

interface OfflineQrCodeOptions {
  label: string;
  accent?: string;
}

export const createOfflineQrCode = ({
  label,
  accent = '#5b8cff',
}: OfflineQrCodeOptions): string => {
  const hash = hashSeed(label);
  const baseAccent = normalizeColor(accent, '#5b8cff');
  const blocks: string[] = [];

  for (let row = 0; row < 9; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      const isFinder =
        (row < 2 && column < 2) ||
        (row < 2 && column > 6) ||
        (row > 6 && column < 2);
      const bit = (hash >> ((row * 9 + column) % 24)) & 1;
      if (isFinder || bit === 1) {
        blocks.push(
          `<rect x="${12 + column * 12}" y="${12 + row * 12}" width="10" height="10" rx="2" fill="${isFinder ? '#0b1220' : baseAccent}"/>`,
        );
      }
    }
  }

  const safeLabel = escapeXml(label);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" fill="none">
  <rect width="160" height="160" rx="24" fill="#ffffff"/>
  <rect x="8" y="8" width="144" height="144" rx="18" stroke="${baseAccent}" stroke-opacity="0.3" stroke-width="2"/>
  ${blocks.join('')}
  <rect x="36" y="124" width="88" height="22" rx="11" fill="${baseAccent}" fill-opacity="0.12"/>
  <text x="80" y="139" text-anchor="middle" fill="#0b1220" font-size="11" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${safeLabel}</text>
</svg>`;

  return svgToDataUrl(svg.trim());
};
