
import { SfxModelType } from './entities/sfx.entity';

export const STORAGE_KEY_SFX_HISTORY = 'open_studio_sfx_history_v1';

export const SFX_MODELS: { id: SfxModelType; name: string; badge?: string }[] = [
    { id: 'eleven-labs-sfx', name: 'ElevenLabs SFX', badge: 'PRO' },
    { id: 'audioldm-2', name: 'AudioLDM 2', badge: 'FAST' },
    { id: 'tango', name: 'Tango', badge: 'OPEN' },
];
