
class BrowserService {
  
  normalizeUrl(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return 'about:blank';

    // 1. Check if valid URL
    try {
      const url = new URL(trimmed);
      if (['http:', 'https:', 'about:'].includes(url.protocol)) return trimmed;
    } catch {}

    // 2. Check for domain-like pattern (example.com)
    if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
      return `https://${trimmed}`;
    }

    // 3. Fallback to Search
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
  }

  getFaviconUrl(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return '';
    }
  }
}

export const browserService = new BrowserService();
