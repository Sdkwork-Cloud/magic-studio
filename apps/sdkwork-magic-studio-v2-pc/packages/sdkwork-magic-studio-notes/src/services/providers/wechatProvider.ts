import type { ArticlePayload, PublishResult } from '@sdkwork/magic-studio-types/notes';
import { IPublishingProvider } from './types';
import { MediaAccountConfig } from '@sdkwork/magic-studio-settings';

export class WeChatProvider implements IPublishingProvider {
    platformType = 'wechat-mp';
    name = 'WeChat Official Account';

    async validateConfig(config: MediaAccountConfig): Promise<boolean> {
        return !!(config.appId && config.appSecret);
    }

    async publish(articles: ArticlePayload[], config: MediaAccountConfig): Promise<PublishResult> {
        void articles;
        void config;
        throw new Error('WeChat publishing is not connected to a canonical provider implementation');
    }

    getConstraints() {
        return {
            maxTitleLength: 64,
            requiresCover: true,
            maxArticlesPerPush: 8
        };
    }
}
