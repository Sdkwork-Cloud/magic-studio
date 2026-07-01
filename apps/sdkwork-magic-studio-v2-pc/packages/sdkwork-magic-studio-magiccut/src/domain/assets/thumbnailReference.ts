interface ThumbnailReferenceLike {
    thumbnailPath?: string | null;
    thumbnailUrl?: string | null;
}

const normalizeOptionalString = (value: string | null | undefined): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

export const resolveMagicCutThumbnailReference = (
    source: ThumbnailReferenceLike | null | undefined
): string | null => {
    return (
        normalizeOptionalString(source?.thumbnailPath) ||
        normalizeOptionalString(source?.thumbnailUrl)
    );
};
