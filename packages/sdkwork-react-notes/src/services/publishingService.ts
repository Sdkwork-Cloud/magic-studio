
import { ArticlePayload, PublishResult } from '@sdkwork/react-commons';
import { IPublishingProvider } from './providers/types';
import { WeChatProvider } from './providers/wechatProvider';
import { ToutiaoProvider } from './providers/toutiaoProvider';
import { MediaAccountConfig } from '@sdkwork/react-settings';

const toErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    if (typeof error === 'string' && error.trim()) {
        return error;
    }
    return 'Unknown Error';
};

class PublishingService {
    private providers: Map<string, IPublishingProvider> = new Map();

    constructor() {
        // Register default providers
        this.registerProvider(new WeChatProvider());
        this.registerProvider(new ToutiaoProvider());
    }

    registerProvider(provider: IPublishingProvider) {
        this.providers.set(provider.platformType, provider);
    }

    getProvider(type: string): IPublishingProvider | undefined {
        return this.providers.get(type);
    }

    /**
     * Publishes article(s) to a specific account configuration.
     */
    async publishToAccount(
        account: MediaAccountConfig, 
        payload: ArticlePayload | ArticlePayload[]
    ): Promise<PublishResult> {
        const provider = this.getProvider(account.platform);
        
        // Normalize to array
        const articles = Array.isArray(payload) ? payload : [payload];

        if (!provider) {
            if (account.platform === 'custom') {
                 return { success: true, platformId: 'custom', message: `Webhook triggered for ${articles.length} items`, url: '' };
            }
            throw new Error(`No provider found for platform: ${account.platform}`);
        }

        try {
            return await provider.publish(articles, account);
        } catch (error: unknown) {
            console.error(`[PublishingService] Failed to publish to ${account.name}`, error);
            return {
                success: false,
                platformId: account.platform,
                message: toErrorMessage(error)
            };
        }
    }
}

export const publishingService = new PublishingService();
