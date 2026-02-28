import type { AnyMediaResource } from '@sdkwork/react-commons';
import { UniversalPlayerHandle } from '../components/Player/UniversalPlayer' 
class PlayerPreviewService {
    private playerRef: React.RefObject<UniversalPlayerHandle | null> | null = null;
    private pendingPreview: { resourceId: string; time: number } | null = null;
    private lastTimelineTime: number = 0;

    registerPlayer(ref: React.RefObject<UniversalPlayerHandle | null>) {
        this.playerRef = ref;
        
        if (this.pendingPreview && ref.current) {
            this.pendingPreview = null;
        }
    }

    unregisterPlayer() {
        this.playerRef = null;
    }

    previewResource(resource: AnyMediaResource, time: number) {
        if (this.playerRef?.current) {
            this.playerRef.current.renderPreview(resource, time);
        }
    }

    clearPreview() {
        if (this.playerRef?.current) {
            this.playerRef.current.setPreviewResource(null);
            this.playerRef.current.renderNow(this.lastTimelineTime, false);
        }
    }

    renderTime(time: number) {
        this.lastTimelineTime = time;
        if (this.playerRef?.current) {
            this.playerRef.current.setPreviewResource(null);
            this.playerRef.current.renderNow(time, false);
        }
    }
}

export const playerPreviewService = new PlayerPreviewService();
