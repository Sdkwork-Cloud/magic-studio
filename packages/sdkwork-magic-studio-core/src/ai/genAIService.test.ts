import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('genAIService runtime boundaries', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('keeps media generation out of the core AI service boundary', async () => {
    vi.stubEnv('API_KEY', '');
    vi.stubEnv('VITE_API_KEY', '');

    const { genAIService } = await import('./genAIService');

    expect('generateImage' in genAIService).toBe(false);
    expect('generateAudio' in genAIService).toBe(false);
    expect('generateVideo' in genAIService).toBe(false);
    expect('generateSpeech' in genAIService).toBe(false);
    expect('generateCoverPrompts' in genAIService).toBe(false);
    expect('enhancePrompt' in genAIService).toBe(false);
  });

  it('does not depend on legacy App SDK generation APIs', async () => {
    const sourcePath = fileURLToPath(new URL('./genAIService.ts', import.meta.url));
    const source = await readFile(sourcePath, 'utf8');

    expect(source).not.toContain('getAppSdkClientWithSession');
    expect(source).not.toContain('@sdkwork/app-sdk');
    expect(source).not.toContain('App SDK generation');
    expect(source).not.toContain('createGenerationImage');
    expect(source).not.toContain('textToSpeech');
    expect(source).not.toContain('enhanceGenerationPrompt');
  });
});
