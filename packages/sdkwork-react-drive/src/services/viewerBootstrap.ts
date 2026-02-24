
import { viewerRegistry } from '../viewers/viewerRegistry';
import { CodeViewer } from '../viewers/impl/CodeViewer';
import { MediaViewer } from '../viewers/impl/MediaViewer';
import { DocViewer } from '../viewers/impl/DocViewer';
import { ImageViewer } from '../viewers/impl/ImageViewer';
import { pathUtils } from 'sdkwork-react-commons';

export { DriveSidebar } from '../components/DriveSidebar';
export { DriveGrid } from '../components/DriveGrid';
export { DriveBreadcrumbs } from '../components/DriveBreadcrumbs';
export { DriveContextMenu } from '../components/DriveContextMenu';
export { FilePreviewModal } from '../components/FilePreviewModal';

export const initViewers = () => {
    viewerRegistry.register({
        id: 'code-viewer',
        name: 'Code Editor',
        component: CodeViewer,
        priority: 10,
        supports: (item) => {
            const ext = pathUtils.extname(item.name).toLowerCase();
            return [
                '.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.xml', '.yml', '.yaml', 
                '.py', '.rs', '.java', '.c', '.cpp', '.go', '.php', '.rb', '.sh', '.bat',
                '.txt', '.md', '.log', '.csv', '.ini', '.conf' 
            ].includes(ext);
        }
    });

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

    viewerRegistry.register({
        id: 'doc-viewer',
        name: 'Document Viewer',
        component: DocViewer,
        priority: 10,
        supports: (item) => {
             const ext = pathUtils.extname(item.name).toLowerCase();
             const mime = item.mimeType || '';
             if (mime === 'application/pdf' || ext === '.pdf') return true;
             if (['.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt', '.odt', '.ods', '.odp'].includes(ext)) return true;
             if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) return true;
             if (['.obj', '.fbx', '.stl', '.glb', '.gltf'].includes(ext)) return true;
             
             return false;
        }
    });
};
