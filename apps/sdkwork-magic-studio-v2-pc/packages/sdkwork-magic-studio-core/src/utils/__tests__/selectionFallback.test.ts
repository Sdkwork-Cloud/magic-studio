import { describe, expect, it } from 'vitest';

import {
  resolvePreferredModelId,
  resolvePreferredSelectionId,
  resolvePreferredSelectionValue,
} from '../selectionFallback';

describe('selectionFallback', () => {
  it('returns the requested model id when it still exists', () => {
    expect(
      resolvePreferredModelId(
        [
          {
            models: [{ id: 'model-a' }, { id: 'model-b' }],
          },
        ],
        'model-b',
      ),
    ).toBe('model-b');
  });

  it('falls back to the first available model when the requested model is missing', () => {
    expect(
      resolvePreferredModelId(
        [
          {
            models: [{ id: 'model-a' }, { id: 'model-b' }],
          },
        ],
        'missing-model',
      ),
    ).toBe('model-a');
  });

  it('returns an empty string when no models exist', () => {
    expect(resolvePreferredModelId([], 'missing-model')).toBe('');
  });

  it('returns the requested option id when it is still valid', () => {
    expect(
      resolvePreferredSelectionId(
        [{ id: 'cinematic' }, { id: 'realistic' }],
        'realistic',
        '',
      ),
    ).toBe('realistic');
  });

  it('falls back to the first option id when the current id is invalid', () => {
    expect(
      resolvePreferredSelectionId(
        [{ id: 'cinematic' }, { id: 'realistic' }],
        'missing-style',
        '',
      ),
    ).toBe('cinematic');
  });

  it('uses the provided id fallback when no options exist', () => {
    expect(resolvePreferredSelectionId([], 'missing-style', 'default-style')).toBe(
      'default-style',
    );
  });

  it('returns the requested option value when it is still valid', () => {
    expect(
      resolvePreferredSelectionValue(
        [{ value: '5s' }, { value: '10s' }],
        '10s',
        '5s',
      ),
    ).toBe('10s');
  });

  it('falls back to the first option value when the current value is invalid', () => {
    expect(
      resolvePreferredSelectionValue(
        [{ value: '5s' }, { value: '10s' }],
        '15s',
        '5s',
      ),
    ).toBe('5s');
  });

  it('uses the provided value fallback when no options exist', () => {
    expect(resolvePreferredSelectionValue([], '15s', '5s')).toBe('5s');
  });
});
