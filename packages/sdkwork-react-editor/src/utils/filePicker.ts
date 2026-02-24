
import { platform } from 'sdkwork-react-core';

export interface PickedFile {
  name: string;
  data: Uint8Array;
  path?: string; // Optional path for native optimizations
}

export const filePicker = {
  /**
   * Pick files.
   * On Desktop: Uses native dialog + FS read.
   * On Web: Uses HTML input.
   */
  pickFiles: async (multiple: boolean = false, accept: string = '*'): Promise<PickedFile[]> => {
    const isDesktop = platform.getPlatform() === 'desktop';

    if (isDesktop) {
      // Desktop: Get paths then read them
      const paths = await platform.selectFile({ multiple });
      const results: PickedFile[] = [];
      
      for (const p of paths) {
        // Read file from disk
        const data = await platform.readFileBinary(p);
        // Extract name from path (simple split)
        const name = p.split(/[/\\]/).pop() || 'unknown';
        results.push({ name, data, path: p });
      }
      return results;
    } else {
      // Web: Use Input Element
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = multiple;
        input.accept = accept;
        
        input.onchange = async (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (!files || files.length === 0) {
            resolve([]);
            return;
          }

          const results: PickedFile[] = [];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const buffer = await file.arrayBuffer();
            results.push({
              name: file.name,
              data: new Uint8Array(buffer)
            });
          }
          resolve(results);
        };

        input.oncancel = () => resolve([]);
        input.click();
      });
    }
  }
};
