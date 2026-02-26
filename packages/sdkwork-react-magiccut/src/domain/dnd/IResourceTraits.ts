
import { AnyMediaResource } from '@sdkwork/react-commons';
import React from 'react';

export interface GhostVisualConfig {
    height: number;
    backgroundColor: string;
    borderColor: string;
    icon: React.ReactNode;
    opacity: number;
    filter: string;
    boxShadow: string;
    status: 'valid' | 'collision' | 'snapped';
}

/**
 * Defines the behavior of a specific resource type during a drag operation.
 */
export interface IResourceTraits {
    /**
     * Calculates the duration of the resource on the timeline.
     * Dynamic for video/audio, static default for images/text.
     */
    getDefaultDuration(resource: AnyMediaResource): number;

    /**
     * Returns the visual configuration for the ghost element during drag.
     */
    getGhostConfig(isValid: boolean, isInsert: boolean, trackHeight?: number): GhostVisualConfig;

    /**
     * Returns a list of generic track types this resource prefers to be dropped on.
     */
    getPreferredTrackTypes(): string[];
}

