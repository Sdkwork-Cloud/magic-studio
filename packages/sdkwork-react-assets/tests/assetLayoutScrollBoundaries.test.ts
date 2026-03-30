import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('asset layout scroll boundaries', () => {
  it('keeps the assets page sidebar on a fixed rail and clips horizontal overflow in the content pane', () => {
    const source = readSource('packages/sdkwork-react-assets/src/pages/AssetsPage.tsx');

    expect(source).toContain('hidden w-[296px] shrink-0 overflow-hidden');
    expect(source).toContain('min-h-0 flex-1 overflow-y-auto overflow-x-hidden');
  });

  it('gives the asset sidebar one scroll surface instead of nesting a type-only scroller', () => {
    const source = readSource('packages/sdkwork-react-assets/src/components/AssetSidebar.tsx');

    expect(source).toContain('h-full min-h-0 w-full select-none overflow-hidden');
    expect(source).toContain('overflow-y-auto overflow-x-hidden');
    expect(source).not.toContain('h-full min-h-0 overflow-y-auto pr-1');
  });

  it('uses a responsive modal library layout with a drawer on narrow screens instead of forcing SplitView scroll stacks', () => {
    const source = readSource('packages/sdkwork-react-assets/src/components/ChooseAssetModal.tsx');

    expect(source).toContain("import { AssetFilterDrawer } from './AssetFilterDrawer';");
    expect(source).toContain('const [isLibraryFiltersOpen, setIsLibraryFiltersOpen] = useState(false);');
    expect(source).toContain('hidden h-full w-[296px] shrink-0 overflow-hidden');
    expect(source).toContain('overflow-y-auto overflow-x-hidden bg-[#111]');
    expect(source).not.toContain('SplitView');
  });
});
