
import { IFileSaveStrategy } from '../types';
import { platform } from '../../../../../platform';
import { pathUtils } from '../../../../../utils/pathUtils';

export class DesktopExportStrategy implements IFileSaveStrategy {
    async save(blob: Blob, filename: string, destinationPath?: string): Promise<void> {
        try {
            let fullPath = '';

            if (destinationPath) {
                // If a directory is pre-selected, join it with filename
                fullPath = pathUtils.join(destinationPath, filename);
            } else {
                // Fallback to Save Dialog
                const savedPath = await platform.saveFile('', filename);
                if (!savedPath) return; // User cancelled
                fullPath = savedPath;
            }

            // Convert Blob to Binary
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Write via Platform API
            await platform.writeFileBinary(fullPath, uint8Array);
            
            await platform.notify('Export Complete', `Video saved to ${fullPath}`);
        } catch (e) {
            console.error('Desktop export failed', e);
            throw new Error('Failed to save file to disk.');
        }
    }
}
