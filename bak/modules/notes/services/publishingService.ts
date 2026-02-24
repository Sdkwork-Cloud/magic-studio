
import { IPublishingProvider } from './providers/types';
import { WeChatProvider } from './providers/wechatProvider';
import { ToutiaoProvider } from './providers/toutiaoProvider';
import { ArticlePayload, PublishResult } from '../entities/publishing.entity';
import { MediaAccountConfig } from '../../settings/entities/settings.entity';

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
        } catch (e: any) {
            console.error(`[PublishingService] Failed to publish to ${account.name}`, e);
            return {
                success: false,
                platformId: account.platform,
                message: e.message || 'Unknown Error'
            };
        }
    }
}

export const publishingService = new PublishingService();
