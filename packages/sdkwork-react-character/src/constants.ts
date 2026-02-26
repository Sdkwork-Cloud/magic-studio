
import { CharacterArchetype, CharacterGender } from './entities';

export const STORAGE_KEY_CHARACTER_HISTORY = 'open_studio_character_history_v1';

export const CHARACTER_MODELS = [
    { id: 'gemini-3-flash-image', name: 'Gemini Avatar', badge: 'FAST', color: 'text-green-400', desc: 'Fast character concepts' },
    { id: 'midjourney-v6', name: 'Midjourney v6', badge: 'ART', color: 'text-purple-400', desc: 'High fidelity art' },
    { id: 'stable-diffusion-xl', name: 'SDXL Character', badge: 'PRO', color: 'text-blue-400', desc: 'Consistent style' },
];

export const CHARACTER_ARCHETYPES: { id: CharacterArchetype; label: string; prompt: string }[] = [
    { id: 'hero', label: 'Hero / Protagonist', prompt: 'heroic stance, confident expression, main character energy' },
    { id: 'villain', label: 'Villain / Antagonist', prompt: 'menacing aura, dark attire, sharp features, antagonist' },
    { id: 'npc', label: 'NPC / Civilian', prompt: 'casual clothing, neutral expression, background character' },
    { id: 'fantasy', label: 'Fantasy Warrior', prompt: 'intricate armor, magical weapon, fantasy setting, dnd character' },
    { id: 'cyberpunk', label: 'Cyberpunk Runner', prompt: 'techwear, neon accents, cybernetic implants, futuristic city background' },
    { id: 'anime', label: 'Anime Character', prompt: 'anime style, vibrant colors, expressive eyes, cel shaded' },
    { id: 'mascot', label: 'Mascot / Creature', prompt: 'cute, stylized, mascot design, character design sheet' },
];

export const CHARACTER_GENDERS: { id: CharacterGender; label: string }[] = [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
];
