import { getPlatformRuntime } from '../platform';

export interface UploadFile {
  name: string;
  data: Uint8Array;
  path?: string;
}

export const uploadHelper = {
  processFiles: async (files: File[]): Promise<UploadFile[]> => {
    const results: UploadFile[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // @ts-ignore
        const path = file.path;
        
        const buffer = await file.arrayBuffer();
        results.push({
            name: file.name,
            data: new Uint8Array(buffer),
            path
        });
    }
    return results;
  },

  pickFiles: async (multiple: boolean = true, accept: string = '*', readData: boolean = true): Promise<UploadFile[]> => {
    const runtime = getPlatformRuntime();
    const isDesktop = runtime.system.kind() === 'desktop';

    if (isDesktop) {
      let extensions: string[] | undefined;
      
      if (accept && accept !== '*' && accept !== '*.*') {
          const parts = accept.split(',').map(s => s.trim());
          const extParts = parts.filter(p => p.startsWith('.'));
          
          if (extParts.length > 0) {
              extensions = extParts.map(e => e.substring(1));
          }
      }

      const paths = await runtime.fileSystem.selectFile({ multiple, extensions });
      const results: UploadFile[] = [];
      
      for (const p of paths) {
        let data = new Uint8Array(0);
        if (readData) {
            try {
                const binary = await runtime.fileSystem.readBinary(p);
                data = new Uint8Array(binary.byteLength);
                data.set(binary);
            } catch (e) {
                console.error(`Failed to read file: ${p}`, e);
            }
        }
        
        const name = p.split(/[/\\]/).pop() || 'unknown';
        results.push({ name, data, path: p });
      }
      return results;
    } else {
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
