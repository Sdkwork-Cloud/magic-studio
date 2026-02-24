
import { MusicStyle, MusicModelType } from './entities/music.entity';

export const STORAGE_KEY_MUSIC_HISTORY = 'open_studio_music_history_v1';

export const MUSIC_MODELS: { id: MusicModelType; name: string; badge?: string }[] = [
    { id: 'suno-v3.5', name: 'Suno v3.5', badge: 'LATEST' },
    { id: 'suno-v3', name: 'Suno v3', badge: 'STABLE' },
    { id: 'udio-v1', name: 'Udio v1', badge: 'BETA' },
    { id: 'musicgen-large', name: 'MusicGen Large' },
];

export const MUSIC_STYLES: MusicStyle[] = [
    { id: 'lofi', label: 'Lofi Hip Hop', value: 'lofi hip hop, chill, relax, study beats', color: 'bg-indigo-500' },
    { id: 'edm', label: 'EDM', value: 'edm, electronic, dance, high energy, synthesizer', color: 'bg-purple-500' },
    { id: 'rock', label: 'Rock', value: 'rock, electric guitar, drums, energetic, alternative', color: 'bg-red-500' },
    { id: 'jazz', label: 'Jazz', value: 'jazz, saxophone, piano, smooth, improvisation', color: 'bg-yellow-500' },
    { id: 'classical', label: 'Classical', value: 'classical, orchestra, piano, violin, symphony', color: 'bg-amber-600' },
    { id: 'pop', label: 'Pop', value: 'pop, catchy, vocal, upbeat, billboard', color: 'bg-pink-500' },
    { id: 'ambient', label: 'Ambient', value: 'ambient, atmospheric, ethereal, soundscape', color: 'bg-teal-500' },
    { id: 'cinematic', label: 'Cinematic', value: 'cinematic score, epic, movie soundtrack, dramatic', color: 'bg-blue-600' },
];
