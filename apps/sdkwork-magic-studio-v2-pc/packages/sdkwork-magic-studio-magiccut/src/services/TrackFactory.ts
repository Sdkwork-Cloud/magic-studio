import { CutTrackType } from '../entities/magicCut.entity';
import { TIMELINE_CONSTANTS } from '../constants';
import { TrackRulesFactory } from '../domain/dnd/TrackRulesFactory';
import { i18nService } from '@sdkwork/magic-studio-i18n';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';
import { resolveMagicCutTranslatedText } from '../domain/i18n/defaultMagicCutDomainTranslate';

export interface TrackCreationConfig {
    type: CutTrackType;
    height: number;
    name: string;
}

const translateTimelineText = (key: string): string => {
    const domainKey = `timeline.${key}`;
    const fullKey = `magicCut.${domainKey}`;
    return resolveMagicCutTranslatedText(domainKey, i18nService.t(fullKey));
};

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
        if (isMain) {
            return {
                type,
                height: TIMELINE_CONSTANTS.TRACK_HEIGHT_MAIN,
                name: translateTimelineText('mainTrack')
            };
        }

        switch (type) {
            case 'video':
                return {
                    type,
                    height: TIMELINE_CONSTANTS.TRACK_HEIGHT_VIDEO,
                    name: translateTimelineText('videoTrack')
                };
            case 'audio':
                return {
                    type,
                    height: TIMELINE_CONSTANTS.TRACK_HEIGHT_AUDIO,
                    name: translateTimelineText('audioTrack')
                };
            case 'effect':
                return {
                    type,
                    height: TIMELINE_CONSTANTS.TRACK_HEIGHT_EFFECT,
                    name: translateTimelineText('effectTrack')
                };
            case 'text':
                return {
                    type,
                    height: TIMELINE_CONSTANTS.TRACK_HEIGHT_TEXT,
                    name: translateTimelineText('textTrack')
                };
            case 'subtitle':
                return {
                    type,
                    height: TIMELINE_CONSTANTS.TRACK_HEIGHT_TEXT,
                    name: translateTimelineText('subtitleTrack')
                };
            case 'ai':
                return {
                    type,
                    height: TIMELINE_CONSTANTS.TRACK_HEIGHT_VIDEO,
                    name: translateTimelineText('aiTrack')
                };
            default:
                return {
                    type,
                    height: TIMELINE_CONSTANTS.TRACK_HEIGHT_DEFAULT,
                    name: translateTimelineText('track')
                };
        }
    }

    /**
     * Determines if a resource type is allowed on a specific track type.
     * Delegated to Domain Rule Engine.
     */
    public static isCompatible(trackType: CutTrackType, resourceType: MediaResourceType): boolean {
        return TrackRulesFactory.getRules(trackType).isCompatible(resourceType);
    }
}
