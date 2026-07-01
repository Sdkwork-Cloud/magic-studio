import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('ImageLeftGeneratorPanel project reference boundary', () => {
  it('reuses one project reference contract for both modal selection and local uploads', () => {
    const source = fs.readFileSync(
      new URL('./ImageLeftGeneratorPanel.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('IMAGE_REFERENCE_PROJECT_REFERENCE');
    expect(source).toContain("slot: 'image-reference-images'");
    expect(source).toContain("source: 'image-left-generator-panel'");
    expect(source).toContain('projectReference={IMAGE_REFERENCE_PROJECT_REFERENCE}');
    expect(source).toContain('persistChooseAssetProjectReference({');
    expect(source).toContain('projectReference: IMAGE_REFERENCE_PROJECT_REFERENCE');
  });
});
