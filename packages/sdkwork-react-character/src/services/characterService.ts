import { CharacterConfig, CharacterTask } from '../entities';
import { BaseEntity } from '@sdkwork/react-commons';

class CharacterService {
    async generate(config: CharacterConfig): Promise<CharacterTask> {
        console.log('Generating character with config:', config);
        const task: CharacterTask & BaseEntity = {
            id: Date.now().toString(),
            uuid: `char-${Date.now()}`,
            config,
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        return task;
    }
}

export const characterService = new CharacterService();
