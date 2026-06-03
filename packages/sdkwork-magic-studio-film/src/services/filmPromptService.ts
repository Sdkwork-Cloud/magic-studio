import { imageService } from '@sdkwork/magic-studio-image/services';

export const enhanceFilmPrompt = async (prompt: string): Promise<string> => {
    if (!prompt.trim()) {
        return prompt;
    }

    try {
        return await imageService.enhancePrompt(prompt);
    } catch (error) {
        console.error('Film prompt enhancement failed', error);
        return prompt;
    }
};
