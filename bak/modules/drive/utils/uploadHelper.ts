
import { platform } from '../../../platform';

export interface UploadFile {
  name: string;
  data: Uint8Array;
  path?: string;
}

export const uploadHelper = {
  /**
   * Process generic DOM File objects (from Drag & Drop)
   */
  processFiles: async (files: File[]): Promise<UploadFile[]> => {
    const results: UploadFile[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // On Electron/Tauri, File object often has a 'path' property
        // @ts-ignore
        const path = file.path;
        
        // If we have a path, we might skip reading data if the consumer supports it.
        // But processFiles is usually called when data IS needed.
        // We read it for now to be safe, unless we refactor all consumers.
        // Optimizing this requires deep refactoring of drag-and-drop consumers.
        
        const buffer = await file.arrayBuffer();
        results.push({
            name: file.name,
            data: new Uint8Array(buffer),
            path
        });
    }
    return results;
  },

  /**
   * Open system dialog to pick files
   * @param multiple Allow multiple files
   * @param accept File types
   * @param readData If false, skips reading file content into memory (Desktop only optimization). 'data' will be empty.
   */
  pickFiles: async (multiple: boolean = true, accept: string = '*', readData: boolean = true): Promise<UploadFile[]> => {
    const isDesktop = platform.getPlatform() === 'desktop';

    if (isDesktop) {
      // Desktop: Get paths then read them
      let extensions: string[] | undefined;
      
      // Parse accept string for extensions (e.g. ".jpg,.png")
      if (accept && accept !== '*' && accept !== '*.*') {
          const parts = accept.split(',').map(s => s.trim());
          const extParts = parts.filter(p => p.startsWith('.'));
          
          if (extParts.length > 0) {
              extensions = extParts.map(e => e.substring(1));
          }
      }

      const paths = await platform.selectFile({ multiple, extensions });
      const results: UploadFile[] = [];
      
      for (const p of paths) {
        // Read file from disk ONLY if requested
        let data = new Uint8Array(0);
        if (readData) {
            try {
                data = new Uint8Array(await platform.readFileBinary(p));
            } catch (e) {
                console.error(`Failed to read file: ${p}`, e);
            }
        }
        
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

          const results: UploadFile[] = [];
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
