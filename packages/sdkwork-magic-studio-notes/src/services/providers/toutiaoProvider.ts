import type { ArticlePayload, PublishResult } from '@sdkwork/magic-studio-types/notes';
import { IPublishingProvider } from './types';
import { MediaAccountConfig } from '@sdkwork/magic-studio-settings';

export class ToutiaoProvider implements IPublishingProvider {
    platformType = 'toutiao';
    name = 'Toutiao / Jinri Toutiao';

    async validateConfig(config: MediaAccountConfig): Promise<boolean> {
        return !!config.token || (!!config.appId && !!config.appSecret);
    }

    async publish(articles: ArticlePayload[], _config: MediaAccountConfig): Promise<PublishResult> {
        void articles;
        void _config;
        throw new Error('Toutiao publishing is not connected to a canonical provider implementation');
    }
}
