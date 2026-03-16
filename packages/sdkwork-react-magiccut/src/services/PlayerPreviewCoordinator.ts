import React from 'react';
import { MediaResourceType, type AnyMediaResource } from '@sdkwork/react-commons';
import type { UniversalPlayerHandle } from '../components/Player/UniversalPlayer';

export interface AudioPreviewController {
    preview: (resource: AnyMediaResource, time: number) => Promise<void> | void;
    stop: () => void;
}

export class PlayerPreviewCoordinator {
    private playerRef: React.RefObject<UniversalPlayerHandle | null> | null = null;
    private pendingVisualPreview: { resource: AnyMediaResource; time: number } | null = null;
    private lastTimelineTime = 0;

    constructor(private readonly audioPreviewController: AudioPreviewController) {}

    registerPlayer(ref: React.RefObject<UniversalPlayerHandle | null>) {
        this.playerRef = ref;

        if (this.pendingVisualPreview && ref.current) {
            ref.current.renderPreview(this.pendingVisualPreview.resource, this.pendingVisualPreview.time);
            this.pendingVisualPreview = null;
        }
    }

    unregisterPlayer() {
        this.playerRef = null;
    }

    previewResource(resource: AnyMediaResource, time: number) {
        if (this.isAudioOnly(resource)) {
            this.pendingVisualPreview = null;
            this.playerRef?.current?.setPreviewResource(null);
            this.audioPreviewController.preview(resource, time);
            return;
        }

        this.audioPreviewController.stop();

        if (this.playerRef?.current) {
            this.playerRef.current.renderPreview(resource, time);
            this.pendingVisualPreview = null;
            return;
        }

        this.pendingVisualPreview = { resource, time };
    }

    clearPreview() {
        this.pendingVisualPreview = null;
        this.audioPreviewController.stop();

        if (this.playerRef?.current) {
            this.playerRef.current.setPreviewResource(null);
            this.playerRef.current.renderNow(this.lastTimelineTime, false);
        }
    }

    renderTime(time: number) {
        this.lastTimelineTime = time;
        this.audioPreviewController.stop();

        if (this.playerRef?.current) {
            this.playerRef.current.setPreviewResource(null);
            this.playerRef.current.renderNow(time, false);
        }
    }

    syncTimelineTime(time: number) {
        this.lastTimelineTime = time;
    }

    private isAudioOnly(resource: AnyMediaResource): boolean {
        return resource.type === MediaResourceType.AUDIO
            || resource.type === MediaResourceType.MUSIC
            || resource.type === MediaResourceType.VOICE
            || resource.type === MediaResourceType.SPEECH;
    }
}
