import { describe, expect, it } from 'vitest';

import {
  formatDuration,
  formatFileSize,
  formatTime,
} from '../src/hooks/useMagicCutTranslation';

describe('magic cut translation formatters', () => {
  it('renders Chinese time labels without mojibake', () => {
    expect(formatTime(3723, 'zh-CN')).toBe('1小时2分3秒');
    expect(formatDuration(125, 'zh-CN')).toBe('2分5秒');
  });

  it('renders Chinese file sizes with readable units', () => {
    expect(formatFileSize(512, 'zh-CN')).toBe('512 字节');
    expect(formatFileSize(2048, 'zh-CN')).toBe('2.0 KB');
  });
});
