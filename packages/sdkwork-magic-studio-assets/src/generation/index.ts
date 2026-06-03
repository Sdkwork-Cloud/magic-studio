export { GenerationChatWindow } from '../components/generate/GenerationChatWindow';
export type {
  GenerationTask,
  GenerationConfig,
  GenerationChatReferenceItem,
  GenerationChatWindowAdapter,
  GenerationChatWindowProps,
} from '../components/generate/GenerationChatWindow';
export {
  GenerationHistoryListPane,
  GENERATION_TABS,
} from '../components/generate/GenerationHistoryListPane';
export type {
  GenerationResultSelection,
  GenerationTaskRecord,
} from '@sdkwork/magic-studio-generation-history';
export { PromptTextInput } from '../components/generate/PromptTextInput';
export type { PromptTextInputProps } from '../components/generate/PromptTextInput';
export { createPromptTextInputCapabilityProps } from '../components/generate/promptCapabilityProps';
export { PromptPickerDialog } from '../components/generate/PromptPickerDialog';
export { PromptHistoryDialog } from '../components/generate/PromptHistoryDialog';
export {
  createImportData,
  resolveImportDataKey,
} from '../components/generate/upload/types';
export type { ImportData } from '../components/generate/upload/types';
