
import { IFileSaveStrategy } from '../types';

export class BrowserExportStrategy implements IFileSaveStrategy {
    async save(blob: Blob, filename: string): Promise<void> {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
}

