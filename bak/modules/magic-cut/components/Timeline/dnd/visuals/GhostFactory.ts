
import { MediaResourceType } from '../../../../../../types';
import { TIMELINE_CONSTANTS } from '../../../../constants';
import React from 'react';
import { Film, Image as ImageIcon, Music, Type, FileVideo, Sparkles } from 'lucide-react';

export interface GhostVisualConfig {
    height: number;
    backgroundColor: string;
    borderColor: string;
    icon: React.ReactNode;
    opacity: number;
    filter: string;
    boxShadow: string;
    // Semantic info for rendering (optional override)
    status: 'valid' | 'collision' | 'snapped';
}

export class GhostFactory {
    static getTrackHeight(type: string): number {
        switch (type) {
            case 'video': return TIMELINE_CONSTANTS.TRACK_HEIGHT_VIDEO;
            case 'audio': 
            case 'music': 
            case 'voice': 
            case 'speech': return TIMELINE_CONSTANTS.TRACK_HEIGHT_AUDIO;
            case 'text': return TIMELINE_CONSTANTS.TRACK_HEIGHT_TEXT;
            case 'effect': return TIMELINE_CONSTANTS.TRACK_HEIGHT_EFFECT;
            default: return TIMELINE_CONSTANTS.TRACK_HEIGHT_DEFAULT;
        }
    }

    static getConfig(
        resourceType: MediaResourceType | string, 
        isValid: boolean, 
        isInsert: boolean,
        trackHeight?: number
    ): GhostVisualConfig {
        const height = trackHeight || this.getTrackHeight(this.mapResourceToTrackType(resourceType));
        const baseStyle = this.getStyleForType(resourceType);
        
        const status = !isValid ? 'collision' : 'valid';

        // Base styles
        let opacity = 0.95;
        let filter = 'none';
        let borderColor = baseStyle.border;
        let boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        let bg = baseStyle.bg;

        if (isInsert) {
             opacity = 0.9;
             borderColor = '#3b82f6'; // Blue for Insert
             boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
        } else if (!isValid) {
            opacity = 0.5;
            filter = 'grayscale(100%)';
            borderColor = '#ef4444'; // Red for Invalid
            bg = '#450a0a'; // Dark Red BG
            boxShadow = 'none';
        } else {
            // Valid drag within track
            borderColor = 'rgba(255,255,255,0.9)'; 
            if (resourceType === MediaResourceType.TEXT || resourceType === MediaResourceType.SUBTITLE) {
                // Ensure text is readable on ghost
                opacity = 1.0;
                boxShadow = '0 8px 20px rgba(250, 204, 21, 0.2)';
            }
        }

        return {
            height,
            backgroundColor: bg,
            borderColor,
            icon: baseStyle.icon,
            opacity,
            filter,
            boxShadow,
            status
        };
    }

    private static mapResourceToTrackType(type: MediaResourceType | string): string {
        const t = String(type);
        if (t === MediaResourceType.AUDIO || t === MediaResourceType.MUSIC || t === MediaResourceType.VOICE || t === MediaResourceType.SPEECH) return 'audio';
        if (t === MediaResourceType.TEXT || t === MediaResourceType.SUBTITLE) return 'text';
        if (t === MediaResourceType.EFFECT || t === MediaResourceType.TRANSITION) return 'effect';
        return 'video';
    }

    private static getStyleForType(type: MediaResourceType | string) {
        const t = String(type);
        if (t === MediaResourceType.AUDIO || t === MediaResourceType.MUSIC || t === MediaResourceType.VOICE || t === MediaResourceType.SPEECH) {
            return { icon: React.createElement(Music, { size: 12 }), border: '#059669', bg: '#064e3b' };
        }
        if (t === MediaResourceType.IMAGE) {
            return { icon: React.createElement(ImageIcon, { size: 12 }), border: '#a78bfa', bg: '#4c1d95' };
        }
        if (t === MediaResourceType.VIDEO) {
            return { icon: React.createElement(Film, { size: 12 }), border: '#3b82f6', bg: TIMELINE_CONSTANTS.COLOR_VIDEO_BG };
        }
        if (t === MediaResourceType.TEXT || t === MediaResourceType.SUBTITLE) {
             return { icon: React.createElement(Type, { size: 12 }), border: '#facc15', bg: '#713f12' };
        }
        if (t === MediaResourceType.EFFECT) {
             return { icon: React.createElement(Sparkles, { size: 12 }), border: '#d8b4fe', bg: '#581c87' };
        }
        return { icon: React.createElement(FileVideo, { size: 12 }), border: '#71717a', bg: '#27272a' };
    }
}
