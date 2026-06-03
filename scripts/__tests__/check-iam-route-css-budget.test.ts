import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { inspectIamRouteCssBudget } from '../check-iam-route-css-budget.mjs';

const tempRoots: string[] = [];

const createDistFixture = (files: Record<string, string>): string => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'magic-studio-iam-route-css-'));
  tempRoots.push(root);

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, 'utf8');
  }

  return root;
};

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

describe('inspectIamRouteCssBudget', () => {
  it('passes when auth and profile route css stay within budget and contain no foreign selectors', () => {
    const distRoot = createDistFixture({
      'assets/auth-abc123.css': '.auth{color:#111}.rounded-\\[32px\\]{border-radius:32px}',
      'assets/ProfilePage-def456.css': '.profile{color:#222}.xl\\:grid-cols-\\[minmax\\(0\\,1fr\\)_22rem\\]{display:grid}',
    });

    expect(
      inspectIamRouteCssBudget({
        distRoot,
        authMaxBytes: 1024,
        userMaxBytes: 1024,
      }),
    ).toEqual([]);
  });

  it('reports budget and foreign selector violations for route css regressions', () => {
    const oversizedAuthCss = `${'a'.repeat(2048)}::-webkit-media-controls-panel{display:flex}`;
    const userCss = '.ok{display:block}::-webkit-slider-thumb{width:12px}';

    const distRoot = createDistFixture({
      'assets/auth-oversized.css': oversizedAuthCss,
      'assets/ProfilePage-oversized.css': userCss,
    });

    expect(
      inspectIamRouteCssBudget({
        distRoot,
        authMaxBytes: 512,
        userMaxBytes: 512,
      }),
    ).toEqual([
      expect.stringContaining('auth route css exceeds budget'),
      expect.stringContaining('auth route css contains foreign selector `webkit-media-controls`'),
      expect.stringContaining('profile route css contains foreign selector `webkit-slider-thumb`'),
    ]);
  });
});
