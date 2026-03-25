import { CutTrackType } from '../entities/magicCut.entity';
import { MediaResourceType } from '@sdkwork/react-commons';
import { TIMELINE_CONSTANTS } from '../constants';
import { TrackRulesFactory } from '../domain/dnd/TrackRulesFactory';
import { i18nService } from '@sdkwork/react-i18n';

export interface TrackCreationConfig {
    type: CutTrackType;
    height: number;
    name: string;
}

export class TrackFactory {
    /**
     * Infers the correct timeline track type based on a media resource type.
     */
    public static inferTrackType(resourceType: MediaResourceType | string): CutTrackType {
        const t = String(resourceType);
        if (t === MediaResourceType.AUDIO || t === MediaResourceType.MUSIC || t === MediaResourceType.VOICE || t === MediaResourceType.SPEECH) {
            return 'audio';
        }
        if (t === MediaResourceType.TEXT) {
            return 'text'; 
        }
        if (t === MediaResourceType.SUBTITLE) {
            return 'subtitle';
        }
        if (t === MediaResourceType.EFFECT || t === MediaResourceType.TRANSITION) {
            return 'effect'; 
        }
        return 'video';
    }

    /**
     * Returns the default configuration for a specific track type.
     */
    public static getTrackConfig(type: CutTrackType, isMain: boolean = false): TrackCreationConfig {
        let height = TIMELINE_CONSTANTS.TRACK_HEIGHT_DEFAULT;
        let name = i18nService.t('magicCut.timeline.track');

        if (isMain) {
            height = TIMELINE_CONSTANTS.TRACK_HEIGHT_MAIN;
            name = i18nService.t('magicCut.timeline.mainTrack');
        } else {
            switch (type) {
                case 'video':
                    height = TIMELINE_CONSTANTS.TRACK_HEIGHT_VIDEO;
                    name = i18nService.t('magicCut.timeline.videoTrack');
                    break;
                case 'audio':
                    height = TIMELINE_CONSTANTS.TRACK_HEIGHT_AUDIO;
                    name = i18nService.t('magicCut.timeline.audioTrack');
                    break;
                case 'effect':
                    height = TIMELINE_CONSTANTS.TRACK_HEIGHT_EFFECT;
                    name = i18nService.t('magicCut.timeline.effectTrack');
                    break;
                case 'text':
                    height = TIMELINE_CONSTANTS.TRACK_HEIGHT_TEXT;
                    name = i18nService.t('magicCut.timeline.textTrack');
                    break;
                case 'subtitle':
                    height = TIMELINE_CONSTANTS.TRACK_HEIGHT_TEXT;
                    name = i18nService.t('magicCut.timeline.subtitleTrack');
                    break;
                case 'ai':
                    height = TIMELINE_CONSTANTS.TRACK_HEIGHT_VIDEO;
                    name = i18nService.t('magicCut.timeline.aiTrack');
                    break;
                default:
                    height = TIMELINE_CONSTANTS.TRACK_HEIGHT_DEFAULT;
                    name = i18nService.t('magicCut.timeline.track');
            }
        }

        return { type, height, name };
    }

    /**
     * Determines if a resource type is allowed on a specific track type.
     * Delegated to Domain Rule Engine.
     */
    public static isCompatible(trackType: CutTrackType, resourceType: MediaResourceType): boolean {
        return TrackRulesFactory.getRules(trackType).isCompatible(resourceType);
    }
}
