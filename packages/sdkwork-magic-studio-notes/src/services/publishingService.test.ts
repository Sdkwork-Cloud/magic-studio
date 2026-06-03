import { describe, expect, it } from 'vitest';
import type { ArticlePayload } from '@sdkwork/magic-studio-types/notes';
import type { MediaAccountConfig } from '@sdkwork/magic-studio-settings';
import { publishingService } from './publishingService';
import { WeChatProvider } from './providers/wechatProvider';
import { ToutiaoProvider } from './providers/toutiaoProvider';

const article: ArticlePayload = {
  title: 'Release notes',
  content: 'Canonical publishing should fail closed until a real provider is wired.',
};

const baseAccount: MediaAccountConfig = {
  id: 'account-1',
  name: 'Publishing Account',
  platform: 'wechat-mp',
  enabled: true,
  appId: 'app-id',
  appSecret: 'app-secret',
};

describe('publishing providers', () => {
  it('does not fake-success WeChat publishing without a canonical provider implementation', async () => {
    const provider = new WeChatProvider();

    await expect(provider.publish([article], baseAccount)).rejects.toThrow(
      'WeChat publishing is not connected to a canonical provider implementation',
    );
  });

  it('does not fake-success Toutiao publishing without a canonical provider implementation', async () => {
    const provider = new ToutiaoProvider();

    await expect(
      provider.publish([article], {
        ...baseAccount,
        platform: 'toutiao',
        token: 'token',
      }),
    ).rejects.toThrow(
      'Toutiao publishing is not connected to a canonical provider implementation',
    );
  });

  it('fails custom publishing instead of reporting a fake webhook success', async () => {
    const result = await publishingService.publishToAccount(
      {
        ...baseAccount,
        platform: 'custom',
        endpoint: 'https://example.com/webhook',
      },
      article,
    );

    expect(result).toEqual({
      success: false,
      platformId: 'custom',
      message: 'No canonical publishing provider found for platform: custom',
    });
  });
});
