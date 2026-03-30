import React, { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Mic, Bot, Workflow, ChevronDown, Check } from 'lucide-react';
import { findByIdOrFirst } from '@sdkwork/react-commons';
import { useTranslation } from '@sdkwork/react-i18n';
import { ChatMode } from '../entities';

interface ChatInputProps {
  onSend: (text: string, mode: ChatMode, model: string) => void;
  disabled?: boolean;
  placeholder?: string;
  mode?: ChatMode;
  setMode?: (mode: ChatMode) => void;
  model?: string;
  setModel?: (model: string) => void;
}

const AVAILABLE_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'gpt-4o', name: 'GPT-4o' },
];

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled,
  placeholder,
  mode: externalMode,
  setMode: externalSetMode,
  model: externalModel,
  setModel: externalSetModel,
}) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [internalMode, setInternalMode] = useState<ChatMode>('AGENT');
  const [internalModel, setInternalModel] = useState('gemini-3-flash-preview');

  const mode = externalMode || internalMode;
  const setMode = externalSetMode || setInternalMode;
  const model = externalModel || internalModel;
  const setModel = externalSetModel || setInternalModel;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);

  const modelMenuRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  const chatModes = [
    {
      id: 'AGENT',
      label: t('copilot.modes.agent.label'),
      icon: Bot,
      tone: 'primary' as const,
      desc: t('copilot.modes.agent.desc'),
    },
    {
      id: 'PLAN',
      label: t('copilot.modes.plan.label'),
      icon: Workflow,
      tone: 'success' as const,
      desc: t('copilot.modes.plan.desc'),
    },
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false);
      }
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target as Node)) {
        setShowModeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input, mode, model);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const currentModelName = AVAILABLE_MODELS.find(item => item.id === model)?.name || model;
  const currentMode = findByIdOrFirst(chatModes, mode);
  const ModeIcon = currentMode?.icon || Bot;

  return (
    <div className="px-4 pb-4">
      <div className="app-floating-panel relative flex flex-col rounded-[1.35rem] transition-colors focus-within:border-[var(--border-strong)]">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ||
            (mode === 'PLAN'
              ? t('copilot.input.placeholder_plan')
              : t('copilot.input.placeholder_agent'))
          }
          className="min-h-[56px] w-full resize-none border-none bg-transparent px-4 pt-4 pb-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-0 focus:outline-none scrollbar-hide overflow-y-auto"
          rows={1}
          style={{ maxHeight: '200px' }}
        />

        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="relative" ref={modeMenuRef}>
              <button
                onClick={() => setShowModeMenu(!showModeMenu)}
                className="app-surface-subtle group flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                title="Switch Chat Mode"
              >
                <span
                  className="app-status-icon flex h-5 w-5 items-center justify-center rounded-lg"
                  data-tone={currentMode?.tone || 'primary'}
                >
                  <ModeIcon size={12} />
                </span>
                <span>{currentMode?.label || mode}</span>
                <ChevronDown
                  size={10}
                  className="opacity-50 transition-opacity group-hover:opacity-100"
                />
              </button>

              {showModeMenu && (
                <div className="app-floating-panel absolute bottom-full left-0 z-50 mb-2 flex w-56 flex-col rounded-2xl p-1.5 animate-in fade-in zoom-in-95 duration-75">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Mode
                  </div>
                  {chatModes.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setMode(item.id as ChatMode);
                        setShowModeMenu(false);
                      }}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                        mode === item.id
                          ? 'app-surface-strong text-[var(--text-primary)]'
                          : 'text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span
                        className="app-status-icon flex h-7 w-7 items-center justify-center rounded-xl"
                        data-tone={item.tone}
                      >
                        <item.icon size={14} />
                      </span>
                      <div className="flex flex-1 flex-col">
                        <span className={mode === item.id ? 'font-medium text-[var(--text-primary)]' : ''}>
                          {item.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">{item.desc}</span>
                      </div>
                      {mode === item.id && <Check size={12} className="text-primary-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={modelMenuRef}>
              <button
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="app-header-action flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px]"
              >
                <span className="max-w-[100px] truncate">{currentModelName}</span>
                <ChevronDown size={10} />
              </button>

              {showModelMenu && (
                <div className="app-floating-panel absolute bottom-full left-0 z-50 mb-2 flex w-56 flex-col rounded-2xl p-1.5 animate-in fade-in zoom-in-95 duration-75">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Model
                  </div>
                  {AVAILABLE_MODELS.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setModel(item.id);
                        setShowModelMenu(false);
                      }}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                        model === item.id
                          ? 'app-surface-strong text-primary-500'
                          : 'text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="app-header-action rounded-xl p-2" title={t('copilot.input.attach')}>
              <Paperclip size={16} />
            </button>
            <button className="app-header-action rounded-xl p-2" title={t('copilot.input.voice')}>
              <Mic size={16} />
            </button>

            <div className="mx-1 h-4 w-px bg-[var(--border-color)]" />

            <button
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              className={`flex items-center justify-center rounded-xl p-2 transition-all duration-200 ${
                input.trim() && !disabled
                  ? 'bg-[var(--text-primary)] text-[var(--bg-panel-strong)] shadow-lg hover:bg-primary-600 hover:text-white'
                  : 'app-surface-subtle cursor-not-allowed text-[var(--text-muted)]'
              }`}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
export { ChatInput };
