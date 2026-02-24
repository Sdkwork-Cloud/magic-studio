
import React from 'react';

export interface UploadedFile {
    data: Uint8Array | File;
    name: string;
    url: string;
    path?: string;
}

export interface BaseUploadProps {
    /** Current value (URL, Path, or assets://) */
    value?: string | null;
    /** Callback when file is selected */
    onChange?: (file: UploadedFile) => void;
    /** Callback to clear value */
    onRemove?: () => void;
    /** Callback to preview value (e.g. open modal) */
    onPreview?: () => void;
    /** External loading state */
    loading?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Custom class name */
    className?: string;
    /** Label text */
    label?: string;
    /** Custom Icon */
    icon?: React.ReactNode;
    /** Show delete button */
    allowDelete?: boolean;
    /** Fit mode for preview */
    fit?: 'cover' | 'contain' | 'fill';
    /** Aspect Ratio class or style */
    aspectRatio?: string | number;
    /** Callback for asset library selection */
    onAssetSelect?: () => void;
}
