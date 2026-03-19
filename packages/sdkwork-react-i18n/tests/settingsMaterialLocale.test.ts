import { describe, expect, it } from 'vitest';

import { settings as enSettings } from '../src/locales/en/settings';
import { settings as zhCNSettings } from '../src/locales/zh-CN/settings';

describe('settings material storage locales', () => {
  it('defines the MagicStudio material storage copy in english and simplified chinese', () => {
    expect(enSettings.storage.material.title).toBe('MagicStudio Material Storage');
    expect(enSettings.storage.material.mode.options.localFirstSync).toBe('Local First (Recommended)');

    expect(zhCNSettings.storage.material.title).toBe('MagicStudio 素材存储');
    expect(zhCNSettings.storage.material.mode.label).toBe('存储模式');
    expect(zhCNSettings.storage.material.mode.options.localFirstSync).toBe('本地优先（推荐）');
    expect(zhCNSettings.storage.material.desktop.rootDir).toBe('MagicStudio 根目录');
    expect(zhCNSettings.storage.material.behavior.keepOriginalFilename).toBe(
      '在元数据中保留原始文件名'
    );
  });
});
