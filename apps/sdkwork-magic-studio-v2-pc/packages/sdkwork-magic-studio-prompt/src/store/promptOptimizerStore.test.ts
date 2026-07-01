import { afterEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const stubPromptStorage = () => {
  const storage = new MemoryStorage();
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('window', { localStorage: storage });
  vi.stubGlobal('self', { localStorage: storage });
};

describe('promptOptimizerStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('hydrates templates and chat entities with stable uuid-first identities', async () => {
    stubPromptStorage();

    const { usePromptOptimizerStore } = await import('./promptOptimizerStore');
    const store = usePromptOptimizerStore;
    const templates = store.getState().templates;

    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every((template) => template.id === null)).toBe(true);
    expect(templates.every((template) => typeof template.uuid === 'string' && template.uuid.length > 0)).toBe(true);
    expect(
      templates.every((template) =>
        template.variables.every((variable) => variable.id === null && typeof variable.uuid === 'string')
      )
    ).toBe(true);

    store.getState().initChatContext('image');

    let chatContext = store.getState().chatContext;
    expect(chatContext).toMatchObject({
      id: null,
      uuid: expect.any(String),
      sessionId: expect.any(String),
      optimizationType: 'image',
    });
    expect(chatContext?.sessionId).not.toBe(chatContext?.uuid);

    store.getState().addChatMessage({
      role: 'user',
      content: 'keep the main subject centered',
    });

    chatContext = store.getState().chatContext;
    expect(chatContext?.messages).toHaveLength(1);
    expect(chatContext?.messages[0]).toMatchObject({
      id: null,
      uuid: expect.any(String),
      role: 'user',
      content: 'keep the main subject centered',
    });
  });

  it('removes templates by uuid with id fallback', async () => {
    stubPromptStorage();

    const { usePromptOptimizerStore } = await import('./promptOptimizerStore');
    const store = usePromptOptimizerStore;

    store.getState().addTemplate({
      id: 'prompt-template-db-1',
      uuid: 'prompt-template-uuid-1',
      name: 'Custom Prompt Template',
      description: 'A custom template stored with a database id',
      type: 'image',
      template: 'A portrait of {subject}',
      variables: [
        {
          id: 'prompt-template-variable-db-1',
          uuid: 'prompt-template-variable-uuid-1',
          name: 'subject',
          description: 'Subject',
          required: true,
        },
      ],
    });

    store.getState().removeTemplate('prompt-template-uuid-1');

    expect(
      store
        .getState()
        .templates.some((template) => template.uuid === 'prompt-template-uuid-1')
    ).toBe(false);
  });
});
