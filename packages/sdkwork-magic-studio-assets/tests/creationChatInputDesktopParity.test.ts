import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const packageRoot = path.resolve(__dirname, '..');

const readSource = (relativePath: string): string =>
  fs.readFileSync(path.join(packageRoot, relativePath), 'utf8');

describe('desktop creation input parity guards', () => {
  it('keeps the global rich prose stylesheet scoped to note-like editors only', () => {
    const htmlSource = fs.readFileSync(path.resolve(packageRoot, '..', '..', 'index.html'), 'utf8');
    const noteEditorSource = fs.readFileSync(
      path.resolve(packageRoot, '..', 'sdkwork-magic-studio-notes', 'src/components/NoteEditor.tsx'),
      'utf8'
    );

    expect(htmlSource).toContain('.sdk-rich-prose .ProseMirror');
    expect(htmlSource).not.toMatch(/(^|\n)\s*\.ProseMirror\s*\{/);
    expect(noteEditorSource).toContain('sdk-rich-prose');
  });

  it('scopes CreationChatInput editor styles and keeps sizing-critical rules local', () => {
    const source = readSource('src/components/CreationChatInput/CreationChatInput.tsx');

    expect(source).toContain('.sdk-creation-chat-input .ProseMirror');
    expect(source).toContain('padding-bottom: 0 !important;');
    expect(source).toContain('data-creation-chat-input');
    expect(source).toContain('font-size: 16px');
    expect(source).toContain('padding-bottom: 0');
  });

  it('keeps a component-level placeholder overlay for empty creation inputs', () => {
    const source = readSource('src/components/CreationChatInput/CreationChatInput.tsx');

    expect(source).toContain('const showPlaceholderOverlay =');
    expect(source).toContain('data-creation-chat-input-placeholder');
    expect(source).toContain('pointer-events-none');
    expect(source).toContain('{showPlaceholderOverlay && (');
  });

  it('scopes PromptTextInput editor styles and keeps sizing-critical rules local', () => {
    const source = readSource('src/components/generate/PromptTextInput.tsx');

    expect(source).toContain('.sdk-prompt-text-input .ProseMirror');
    expect(source).toContain('padding-bottom: 0 !important;');
    expect(source).toContain('data-prompt-text-input');
    expect(source).toContain('font-size: 14px');
    expect(source).toContain('padding-bottom: 0');
  });
});
