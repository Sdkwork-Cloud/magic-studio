export type PromptApplyMode = 'replace' | 'append';

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function applyPromptSelection(
  currentValue: string,
  selectedValue: string,
  mode: PromptApplyMode = 'replace'
): string {
  if (mode !== 'append') {
    return selectedValue;
  }

  const current = normalizeText(currentValue);
  const selected = normalizeText(selectedValue);
  if (!current) {
    return selectedValue;
  }
  if (!selected) {
    return currentValue;
  }
  return `${currentValue}\n${selectedValue}`;
}

export function resolvePromptHistoryContent(record: {
  usedContent?: string;
  promptContent?: string;
}): string {
  const usedContent = normalizeText(record.usedContent);
  if (usedContent) {
    return usedContent;
  }
  return normalizeText(record.promptContent);
}
