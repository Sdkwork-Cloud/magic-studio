import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('ChooseAssetModal projectReference boundary', () => {
  it('threads projectReference through the modal type contract, ChooseAsset bridge, and modal content provider', () => {
    const modalTypes = fs.readFileSync(
      new URL('../src/components/ChooseAssetModal.types.ts', import.meta.url),
      'utf8'
    );
    const chooseAsset = fs.readFileSync(
      new URL('../src/components/ChooseAsset.tsx', import.meta.url),
      'utf8'
    );
    const modalContent = fs.readFileSync(
      new URL('../src/components/ChooseAssetModalContent.tsx', import.meta.url),
      'utf8'
    );

    expect(modalTypes).toContain('projectReference?: ChooseAssetProjectReference');
    expect(chooseAsset).toContain('projectReference={projectReference}');
    expect(modalContent).toContain('projectReference={props.projectReference}');
    expect(modalContent).toContain('persistChooseAssetModalSelectionProjectReferences');
  });
});
