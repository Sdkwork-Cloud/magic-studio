
import { ArticlePayload, PublishResult } from '@sdkwork/react-commons';
import { IPublishingProvider } from './types';
import { MediaAccountConfig } from '../../../settings/entities/settings.entity';

export class ToutiaoProvider implements IPublishingProvider {
    platformType = 'toutiao';
    name = 'Toutiao / Jinri Toutiao';

    async validateConfig(config: MediaAccountConfig): Promise<boolean> {
        return !!config.token || (!!config.appId && !!config.appSecret);
    }

    async publish(articles: ArticlePayload[], config: MediaAccountConfig): Promise<PublishResult> {
        // Toutiao typically publishes items individually unless using a specific batch API.
        // For simulation, we process them sequentially or just publish the first one if the API implies single.
        console.log(`[ToutiaoProvider] Publishing batch of ${articles.length}...`);

        await new Promise(resolve => setTimeout(resolve, 1500 * articles.length));

        return {
            success: true,
            platformId: this.platformType,
            postId: `tt_${Date.now()}`,
            url: `https://www.toutiao.com/article/${Date.now()}/`,
            message: `Published ${articles.length} articles successfully.`
        };
    }
}
