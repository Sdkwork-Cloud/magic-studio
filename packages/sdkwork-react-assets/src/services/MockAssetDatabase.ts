import { VideoAsset, ImageAsset, AudioAsset, TextAsset, EffectAsset, TransitionAsset, DigitalHumanAsset, SfxAsset, MediaResourceType } from '../entities/enhancedAsset.entity';
import { AudioFormat } from 'sdkwork-react-commons';
import { generateUUID } from 'sdkwork-react-commons';

// --- Helper Generators ---
const createPage = <T>(content: T[], page: number, size: number): any => {
    const start = page * size;
    const end = start + size;
    const slice = content.slice(start, end);
    const total = content.length;
    
    return {
        content: slice,
        pageable: { pageNumber: page, pageSize: size },
        last: end >= total,
        totalPages: Math.ceil(total / size),
        totalElements: total,
        size: size,
        number: page,
        first: page === 0,
        numberOfElements: slice.length,
        empty: slice.length === 0,
        sort: { sorted: false, unsorted: true, empty: true }
    };
};

const now = Date.now();

// --- 1. VIDEO LIBRARY ---
const REAL_VIDEOS = [
    { name: "Big Buck Bunny", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", duration: 596, thumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg" },
    { name: "Elephants Dream", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", duration: 653, thumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/ElephantsDreamPoster.jpg/800px-ElephantsDreamPoster.jpg" },
    { name: "For Bigger Blazes", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", duration: 15, thumb: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=800&auto=format&fit=crop" },
    { name: "For Bigger Escapes", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", duration: 15, thumb: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=800&auto=format&fit=crop" },
    { name: "For Bigger Fun", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", duration: 60, thumb: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop" },
];

const VIDEOS: VideoAsset[] = Array(50).fill(null).map((_, i) => {
    const source = REAL_VIDEOS[i % REAL_VIDEOS.length];
    return {
        id: `vid-${i}`,
        uuid: generateUUID(),
        type: MediaResourceType.VIDEO,
        name: i < REAL_VIDEOS.length ? source.name : `${source.name} ${Math.floor(i/REAL_VIDEOS.length) + 1}`,
        url: source.url, // Remote URL
        mimeType: 'video/mp4',
        createdAt: now,
        updatedAt: now,
        duration: source.duration,
        resolution: "1920x1080",
        width: 1920,
        height: 1080,
        fps: 24,
        prompt: `Cinematic shot of ${source.name}, high quality`, // AI Native field
        metadata: {
             source: 'stock',
             thumbnailUrl: source.thumb
        },
        tags: { tags: ["cinematic", "hd"] },
        origin: i % 3 === 0 ? 'stock' : 'ai'
    };
});

// --- 2. IMAGE LIBRARY ---
const IMAGES: ImageAsset[] = Array(50).fill(null).map((_, i) => ({
    id: `img-${i}`,
    uuid: generateUUID(),
    type: MediaResourceType.IMAGE,
    name: `Cinematic Shot ${i + 1}`,
    url: `https://picsum.photos/id/${(i * 7) % 200 + 10}/1920/1080`,
    mimeType: 'image/jpeg',
    createdAt: now,
    updatedAt: now,
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    prompt: "Detailed landscape photography, 8k resolution, cinematic lighting",
    metadata: {
        thumbnailUrl: `https://picsum.photos/id/${(i * 7) % 200 + 10}/800/450`
    },
    tags: { tags: ["photo", "nature"] },
    origin: i % 2 === 0 ? 'stock' : 'ai'
}));

// --- 3. AUDIO LIBRARY ---
const AUDIOS: AudioAsset[] = [
    { name: "Cinematic Impact", type: MediaResourceType.AUDIO, duration: 2 },
    { name: "Whoosh Transition", type: MediaResourceType.AUDIO, duration: 1 },
    { name: "Upbeat Corporate", type: MediaResourceType.MUSIC, duration: 120 },
    { name: "Lofi Study Beat", type: MediaResourceType.MUSIC, duration: 180 },
].map((a, i) => ({
    id: `aud-${i}`,
    uuid: generateUUID(),
    type: a.type as any,
    name: a.name,
    url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    mimeType: 'audio/ogg',
    createdAt: now,
    updatedAt: now,
    duration: a.duration,
    format: AudioFormat.OGG,
    sampleRate: 44100,
    channels: 2,
    prompt: `Sound effect: ${a.name}`,
    metadata: {
        thumbnailUrl: "https://placehold.co/600x400/111/333?text=Audio"
    },
    tags: { tags: ["sfx", "music"] }
}));

// --- 4. TEXT LIBRARY (Enhanced) ---
// Generator for professional text presets
const generateTextAssets = (): TextAsset[] => {
    const PRESETS = [
        // BASIC
        { name: "Basic Title", family: "Inter", size: 80, color: "#ffffff", category: "Basic" },
        { name: "Simple Text", family: "Arial", size: 60, color: "#e4e4e7", category: "Basic" },
        { name: "Paragraph", family: "Roboto", size: 40, color: "#d4d4d8", category: "Basic" },
        
        // CINEMATIC
        { name: "Movie Title", family: "Cinzel", size: 120, color: "#f8fafc", category: "Cinematic", spacing: 0.2 },
        { name: "Trailer Fade", family: "Trajan Pro", size: 100, color: "#cbd5e1", category: "Cinematic" },
        { name: "Epic Block", family: "Impact", size: 140, color: "#ffffff", category: "Cinematic" },
        { name: "Noir Mystery", family: "Courier New", size: 70, color: "#fca5a5", category: "Cinematic" },

        // SOCIAL
        { name: "Vlog Header", family: "Poppins", size: 90, color: "#facc15", category: "Social" },
        { name: "Subscribe", family: "Oswald", size: 80, color: "#ef4444", category: "Social" },
        { name: "Comment Below", family: "Montserrat", size: 60, color: "#60a5fa", category: "Social" },
        { name: "Quote Card", family: "Merriweather", size: 50, color: "#ffffff", category: "Social" },

        // LOWER THIRDS
        { name: "News Lower 3rd", family: "Arial", size: 48, color: "#ffffff", category: "Lower Third" },
        { name: "Clean Name", family: "Inter", size: 54, color: "#ffffff", category: "Lower Third" },
        { name: "Location Tag", family: "Roboto Mono", size: 40, color: "#a1a1aa", category: "Lower Third" },

        // RETRO & GLITCH
        { name: "Neon Glow", family: "Monoton", size: 100, color: "#f0f", category: "Retro" },
        { name: "Pixel Art", family: "Press Start 2P", size: 60, color: "#4ade80", category: "Retro" },
        { name: "Glitch Text", family: "Rubik Glitch", size: 90, color: "#ffffff", category: "Retro" },
        { name: "Cyberpunk", family: "Orbitron", size: 80, color: "#22d3ee", category: "Retro" },
        
        // STYLIZED
        { name: "Handwritten", family: "Dancing Script", size: 70, color: "#fcd34d", category: "Style" },
        { name: "Brush Stroke", family: "Permanent Marker", size: 80, color: "#f87171", category: "Style" },
        { name: "Elegant Script", family: "Great Vibes", size: 90, color: "#e2e8f0", category: "Style" },
        { name: "Big Outline", family: "Anton", size: 130, color: "transparent", stroke: "#ffffff", category: "Style" }
    ];

    // Multiply to fill grid if needed, or just use these high quality ones
    return PRESETS.map((p, i) => ({
        id: `txt-preset-${i}`,
        uuid: generateUUID(),
        type: MediaResourceType.TEXT,
        name: p.name,
        createdAt: now,
        updatedAt: now,
        size: 0,
        path: '',
        extension: 'txt',
        mimeType: 'text/plain',
        category: p.category, // Virtual category
        metadata: {
            text: p.name,
            fontFamily: p.family,
            fontSize: p.size,
            color: p.color,
            textAlign: 'center',
            letterSpacing: p.spacing,
            strokeColor: p.stroke,
            strokeWidth: p.stroke ? 2 : 0,
            // We use a generated thumb URL pattern that the frontend can interpret or fallback
            thumbnailUrl: `text-preview:${p.name}` 
        },
        tags: { tags: ["text", p.category.toLowerCase()] }
    }));
};

const TEXTS = generateTextAssets();

// --- 5. EFFECTS & TRANSITIONS (Enhanced) ---
const EFFECTS: EffectAsset[] = [
    { name: 'Gaussian Blur', category: 'Blur', thumb: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=480&auto=format&fit=crop' },
    { name: 'Color Grade: Warm', category: 'Color', thumb: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?q=80&w=480&auto=format&fit=crop' },
    { name: 'Film Grain', category: 'Retro', thumb: 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=480&auto=format&fit=crop' },
    { name: 'Glitch', category: 'Glitch', thumb: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=480&auto=format&fit=crop' },
    { name: 'VHS', category: 'Retro', thumb: 'https://images.unsplash.com/photo-1582298538104-fe2e74c2ed54?q=80&w=480&auto=format&fit=crop' },
].map((e) => ({
    id: `builtin.filter.${e.name.toLowerCase().replace(/\s+/g, '_')}`,
    uuid: generateUUID(),
    type: MediaResourceType.EFFECT,
    name: e.name,
    size: 0,
    createdAt: now,
    updatedAt: now,
    path: '',
    extension: 'fx',
    mimeType: 'application/x-magic-cut-effect',
    category: e.category,
    metadata: { 
        thumbnailUrl: e.thumb 
    },
    tags: { tags: ["effect"] }
}));

const DIGITAL_HUMANS: DigitalHumanAsset[] = [
    { name: 'Alex Professional', rigType: 'full' as const, style: 'realistic' as const },
    { name: 'Maya Anime', rigType: 'face' as const, style: 'anime' as const },
    { name: 'Robot Sci-Fi', rigType: 'full' as const, style: 'stylized' as const },
    { name: 'Emma Cartoon', rigType: 'body' as const, style: 'cartoon' as const },
].map((dh, i) => ({
    id: `dh-${i}`,
    uuid: generateUUID(),
    type: MediaResourceType.CHARACTER,
    name: dh.name,
    size: 0,
    createdAt: now,
    updatedAt: now,
    path: '',
    extension: 'json',
    mimeType: 'application/json',
    category: 'avatar' as const,
    metadata: {
        modelName: dh.name,
        rigType: dh.rigType,
        style: dh.style,
        animationSupport: true,
        thumbnailUrl: `https://images.unsplash.com/photo-${100 + i}?q=80&w=480&auto=format&fit=crop`,
        voiceActor: `Actor ${i + 1}`,
        languages: ['en-US', 'zh-CN'],
        personality: ['friendly', 'professional'][i % 2]
    },
    tags: { tags: ["digital-human", dh.style] }
}));

const SFX_ASSETS: SfxAsset[] = [
    { name: 'Button Click', category: 'ui' as const, intensity: 'soft' as const },
    { name: 'Explosion', category: 'weapons' as const, intensity: 'loud' as const },
    { name: 'Forest Ambience', category: 'ambient' as const, intensity: 'medium' as const },
    { name: 'Footsteps', category: 'foley' as const, intensity: 'soft' as const },
    { name: 'Sci-Fi Whoosh', category: 'sci-fi' as const, intensity: 'medium' as const },
    { name: 'Magic Spell', category: 'fantasy' as const, intensity: 'loud' as const },
].map((sfx, i) => ({
    id: `sfx-${i}`,
    uuid: generateUUID(),
    type: MediaResourceType.AUDIO,
    name: sfx.name,
    url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    mimeType: 'audio/ogg',
    createdAt: now,
    updatedAt: now,
    duration: [0.5, 2.0, 30.0, 1.0, 1.5, 3.0][i],
    format: AudioFormat.OGG,
    sampleRate: 44100,
    channels: 2,
    category: sfx.category,
    metadata: {
        intensity: sfx.intensity,
        loopable: i === 2, // Forest ambience is loopable
        thumbnailUrl: `https://placehold.co/600x400/111/333?text=${encodeURIComponent(sfx.name)}`
    },
    tags: { tags: ["sfx", sfx.category] }
}));

const TRANSITIONS: TransitionAsset[] = [
    { name: 'Cross Dissolve', duration: 1.0, thumb: 'https://images.unsplash.com/photo-1550684848-86a5d8727436?q=80&w=480&auto=format&fit=crop' },
    { name: 'Wipe Left', duration: 1.0, thumb: 'https://images.unsplash.com/photo-1558470598-a5dda9640f6b?q=80&w=480&auto=format&fit=crop' },
    { name: 'Fade to Black', duration: 0.5, thumb: 'https://images.unsplash.com/photo-1483232539664-d89822fb5d3e?q=80&w=480&auto=format&fit=crop' },
].map((t) => ({
    id: `builtin.transition.${t.name.toLowerCase().replace(/\s+/g, '_')}`,
    uuid: generateUUID(),
    type: MediaResourceType.TRANSITION,
    name: t.name,
    size: 0,
    createdAt: now,
    updatedAt: now,
    duration: t.duration,
    path: '',
    extension: 'trans',
    mimeType: 'application/x-magic-cut-transition',
    metadata: { 
        thumbnailUrl: t.thumb
    },
    tags: { tags: ["transition"] }
}));


export const MockDatabase = {
    videos: VIDEOS,
    images: IMAGES,
    audio: AUDIOS,
    text: TEXTS,
    effects: EFFECTS,
    transitions: TRANSITIONS,
    digitalHumans: DIGITAL_HUMANS,
    sfx: SFX_ASSETS,
    
    query: async (type: string, page: number, size: number, query?: string) => {
        await new Promise(r => setTimeout(r, 100)); // Faster mock
        
        let source: any[] = [];
        switch(type) {
            case 'media': source = [...VIDEOS, ...IMAGES]; break; 
            case 'video': source = VIDEOS; break;
            case 'image': source = IMAGES; break;
            case 'audio': source = AUDIOS; break;
            case 'text': source = TEXTS; break;
            case 'effects': source = EFFECTS; break;
            case 'transitions': source = TRANSITIONS; break;
            case 'digital-human': 
            case 'digital-humans': source = DIGITAL_HUMANS; break;
            case 'sfx': source = SFX_ASSETS; break;
            default: source = [];
        }
        
        if (query) {
            source = source.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
        }
        
        return createPage(source, page, size);
    }
};