export const getAssetLabel = (index: number, type: string) => {
    const idx = index + 1;
    switch (type) {
        case 'image': return `Image ${idx}`;
        case 'video': return `Video ${idx}`;
        case 'audio': return `Audio ${idx}`;
        case 'script': return `Script ${idx}`;
        default: return `File ${idx}`;
    }
};

export const getAssetColor = (type: string) => {
    switch (type) {
        case 'image': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        case 'video': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
        case 'audio': return 'text-green-400 bg-green-500/10 border-green-500/20';
        case 'script': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
};
