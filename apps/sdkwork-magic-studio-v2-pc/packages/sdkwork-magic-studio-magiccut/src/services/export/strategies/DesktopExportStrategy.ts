
import { IFileSaveStrategy } from '../types';
import { getPlatformRuntime } from '@sdkwork/magic-studio-core/platform';
import { pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';

export class DesktopExportStrategy implements IFileSaveStrategy {
    async save(blob: Blob, filename: string, destinationPath?: string): Promise<void> {
        try {
            const runtime = getPlatformRuntime();
            let fullPath = '';

            if (destinationPath) {
                // If a directory is pre-selected, join it with filename
                fullPath = pathUtils.join(destinationPath, filename);
            } else {
                // Fallback to Save Dialog
                const savedPath = await runtime.fileSystem.saveText('', filename);
                if (!savedPath) return; // User cancelled
                fullPath = savedPath;
            }

            // Convert Blob to Binary
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Write via Platform API
            await runtime.fileSystem.writeBinary(fullPath, uint8Array);
            
            await runtime.dialog.notify('Export Complete', `Video saved to ${fullPath}`);
        } catch (e) {
            console.error('Desktop export failed', e);
            throw new Error('Failed to save file to disk.', { cause: e });
        }
    }
}

