
import { CharacterConfig, GeneratedCharacterResult } from '../entities/character.entity';
import { genAIService } from '../../notes/services/genAIService';
import { CHARACTER_ARCHETYPES } from '../constants';
import { generateUUID } from '../../../utils';

export const characterService = {
    generateCharacter: async (config: CharacterConfig): Promise<GeneratedCharacterResult[]> => {
        const archetype = CHARACTER_ARCHETYPES.find(a => a.id === config.archetype);
        const archetypePrompt = archetype ? archetype.prompt : '';
        
        const fullPrompt = `Character Design Sheet, ${config.gender}, ${config.age}, ${config.name}. 
        Description: ${config.description}. 
        Style: ${archetypePrompt}. 
        High quality, detailed face, full body shot, clean background.`;

        const imageUrl = await genAIService.generateImage({
            prompt: fullPrompt,
            aspectRatio: config.aspectRatio
        });

        const results: GeneratedCharacterResult[] = [];
        
        for (let i = 0; i < (config.batchSize || 1); i++) {
            results.push({
                id: generateUUID(),
                url: imageUrl
            });
        }

        return results;
    }
};
