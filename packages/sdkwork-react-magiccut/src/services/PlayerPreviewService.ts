import { audioEngine } from '../engine/AudioEngine';
import { PlayerPreviewCoordinator } from './PlayerPreviewCoordinator';

export type { AudioPreviewController } from './PlayerPreviewCoordinator';
export { PlayerPreviewCoordinator } from './PlayerPreviewCoordinator';

export const playerPreviewService = new PlayerPreviewCoordinator({
    preview: (resource, time) => audioEngine.previewResource(resource, time),
    stop: () => audioEngine.stopPreview()
});
