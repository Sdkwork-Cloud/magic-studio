
import { viewerRegistry } from '../viewers/viewerRegistry';
import { CodeViewer } from '../viewers/impl/CodeViewer';
import { MediaViewer } from '../viewers/impl/MediaViewer';
import { DocViewer } from '../viewers/impl/DocViewer';
import { ImageViewer } from '../viewers/impl/ImageViewer';
import { pathUtils } from '../../../utils/pathUtils';

export const initViewers = () => {
    // 1. Code / Text / Config / Scripts
    viewerRegistry.register({
        id: 'code-viewer',
        name: 'Code Editor',
        component: CodeViewer,
        priority: 10,
        supports: (item) => {
            const ext = pathUtils.extname(item.name).toLowerCase();
            return [
                // Code
                '.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.xml', '.yml', '.yaml', 
                '.py', '.rs', '.java', '.c', '.cpp', '.go', '.php', '.rb', '.sh', '.bat',
                // Text
                '.txt', '.md', '.log', '.csv', '.ini', '.conf' 
            ].includes(ext);
        }
    });

    // 2. Images
    viewerRegistry.register({
        id: 'image-viewer',
        name: 'Image Viewer',
        component: ImageViewer,
        priority: 10,
        supports: (item) => {
            const ext = pathUtils.extname(item.name).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.bmp', '.ico', '.tiff'].includes(ext) || item.mimeType?.startsWith('image/');
        }
    });

    // 3. Media (Audio/Video)
    viewerRegistry.register({
        id: 'media-viewer',
        name: 'Media Player',
        component: MediaViewer,
        priority: 10,
        supports: (item) => {
            const ext = pathUtils.extname(item.name).toLowerCase();
            const mime = item.mimeType || '';
            return mime.startsWith('video/') || mime.startsWith('audio/') || 
                   ['.mp4', '.mov', '.webm', '.mkv', '.m4v', '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'].includes(ext);
        }
    });

    // 4. Documents (PDF / Office / Fonts / 3D)
    // We map specialized types to DocViewer which acts as a fallback/download prompt or basic viewer
    viewerRegistry.register({
        id: 'doc-viewer',
        name: 'Document Viewer',
        component: DocViewer,
        priority: 10,
        supports: (item) => {
             const ext = pathUtils.extname(item.name).toLowerCase();
             const mime = item.mimeType || '';
             // PDF
             if (mime === 'application/pdf' || ext === '.pdf') return true;
             // Office
             if (['.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt', '.odt', '.ods', '.odp'].includes(ext)) return true;
             // Fonts
             if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) return true;
             // 3D
             if (['.obj', '.fbx', '.stl', '.glb', '.gltf'].includes(ext)) return true;
             
             return false;
        }
    });
};
