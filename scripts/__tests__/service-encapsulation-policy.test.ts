import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  loadServiceEncapsulationPolicy,
  ServiceEncapsulationPolicyError,
} from '../service-encapsulation-policy.mjs';

const tempRoots: string[] = [];

function createPolicyFixture(policySource?: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'magic-studio-service-policy-test-'));
  tempRoots.push(root);

  fs.mkdirSync(path.join(root, 'docs', 'plans'), { recursive: true });

  if (policySource !== undefined) {
    fs.writeFileSync(
      path.join(root, 'docs', 'plans', 'service-encapsulation-policy.json'),
      policySource,
      'utf8',
    );
  }

  return root;
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

describe('loadServiceEncapsulationPolicy', () => {
  it('fails closed when the policy file is missing', () => {
    const rootDir = createPolicyFixture();

    expect(() => loadServiceEncapsulationPolicy({ rootDir })).toThrow(
      ServiceEncapsulationPolicyError,
    );
    expect(() => loadServiceEncapsulationPolicy({ rootDir })).toThrow(
      'Policy file not found',
    );
  });

  it('fails closed when the policy file is not valid JSON', () => {
    const rootDir = createPolicyFixture('{ invalid json');

    expect(() => loadServiceEncapsulationPolicy({ rootDir })).toThrow(
      ServiceEncapsulationPolicyError,
    );
    expect(() => loadServiceEncapsulationPolicy({ rootDir })).toThrow(
      'Policy file is not valid JSON',
    );
  });

  it('fails closed when allowed outside service patterns are too broad', () => {
    const rootDir = createPolicyFixture(JSON.stringify({
      infrastructurePackages: ['sdkwork-magic-studio-types'],
      seamExemptPackages: ['sdkwork-magic-studio-core'],
      rootServiceExportExemptPackages: ['sdkwork-magic-studio-core'],
      allowedOutsideServicePatterns: ['.*'],
      interactionRules: [{ key: 'fetch', label: 'Network Fetch' }],
    }));

    expect(() => loadServiceEncapsulationPolicy({ rootDir })).toThrow(
      'too broad',
    );
  });

  it('loads a valid policy without falling back to defaults', () => {
    const rootDir = createPolicyFixture(JSON.stringify({
      infrastructurePackages: ['sdkwork-magic-studio-types'],
      seamExemptPackages: ['sdkwork-magic-studio-core'],
      rootServiceExportExemptPackages: ['sdkwork-magic-studio-core'],
      allowedOutsideServicePatterns: [
        'packages\\/sdkwork-magic-studio-core\\/src\\/platform\\/web\\.ts$',
      ],
      interactionRules: [{ key: 'fetch', label: 'Network Fetch' }],
    }));

    const { policy, policySource } = loadServiceEncapsulationPolicy({ rootDir });

    expect(policy.infrastructurePackages).toEqual(['sdkwork-magic-studio-types']);
    expect(policy.allowedOutsideServicePatterns).toEqual([
      'packages\\/sdkwork-magic-studio-core\\/src\\/platform\\/web\\.ts$',
    ]);
    expect(policySource).toBe('docs/plans/service-encapsulation-policy.json');
  });
});
