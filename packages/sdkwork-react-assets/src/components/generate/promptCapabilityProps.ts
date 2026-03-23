import type { PromptRecordBizType, PromptRecordType, ScopedSdkInstance } from '@sdkwork/react-core';
import type { PromptTextInputProps } from './PromptTextInput';
import type { PromptApplyMode } from './promptPickerUtils';

type PromptCapabilityProps = Pick<
  PromptTextInputProps,
  'enablePromptLibrary' | 'enablePromptHistory' | 'promptApplyMode' | 'promptBizType' | 'promptInstance' | 'promptType'
>;

interface PromptCapabilityOverrideOptions {
  enablePromptLibrary?: boolean;
  enablePromptHistory?: boolean;
  promptApplyMode?: PromptApplyMode;
  promptInstance?: ScopedSdkInstance;
  promptType?: PromptRecordType;
}

export function createPromptTextInputCapabilityProps(
  promptBizType: PromptRecordBizType,
  overrides: PromptCapabilityOverrideOptions = {}
): PromptCapabilityProps {
  return {
    enablePromptLibrary: overrides.enablePromptLibrary ?? true,
    enablePromptHistory: overrides.enablePromptHistory ?? true,
    promptApplyMode: overrides.promptApplyMode ?? 'replace',
    promptBizType,
    promptInstance: overrides.promptInstance,
    promptType: overrides.promptType ?? 'USER',
  };
}
