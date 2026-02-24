
import { ArticlePayload, PublishResult } from '../../entities/publishing.entity';
import { MediaAccountConfig } from '../../../settings/entities/settings.entity';

/**
 * Standard Interface for Media Publishing Providers.
 */
export interface IPublishingProvider {
    /**
     * The unique identifier for the platform type (e.g. 'wechat-mp')
     */
    platformType: string;

    /**
     * Human readable name of the provider
     */
    name: string;

    /**
     * Publish the article(s) to the platform.
     * Supports single or multi-article (batch) publishing.
     * @param articles Array of standardized article data
     * @param config The account configuration (credentials)
     */
    publish(articles: ArticlePayload[], config: MediaAccountConfig): Promise<PublishResult>;

    /**
     * Validate if the configuration is sufficient for publishing
     */
    validateConfig(config: MediaAccountConfig): Promise<boolean>;

    /**
     * Get platform-specific constraints
     */
    getConstraints?(): {
        maxTitleLength?: number;
        supportedImageTypes?: string[];
        requiresCover?: boolean;
        maxArticlesPerPush?: number;
    };
}
