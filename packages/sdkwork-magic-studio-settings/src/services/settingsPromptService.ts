import {
    createRuntimeMagicStudioServerClient,
    readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';

const normalizePrompt = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

export const enhanceAgentSystemPrompt = async (systemPrompt: string): Promise<string> => {
    if (!systemPrompt.trim()) {
        return systemPrompt;
    }

    const runtime = readDefaultPlatformRuntime('SettingsPromptService');
    const client = createRuntimeMagicStudioServerClient(runtime);
    const response = await client.optimizePrompt({
        prompt: systemPrompt,
        scene: 'agent-system-prompt',
        maxWords: 400,
    });
    const optimizedPrompt = normalizePrompt(response.data.optimizedPrompt);
    if (!optimizedPrompt) {
        throw new Error('[SettingsPromptService] empty optimized prompt returned by server');
    }

    return optimizedPrompt;
};
