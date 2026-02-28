
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Bot, Workflow, ChevronDown, Check } from 'lucide-react';
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
    setModel: externalSetModel
}) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  
  // Internal state fallback if not controlled
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

  // Dynamic Mode Definitions
  const chatModes = [
      { id: 'AGENT', label: t('copilot.modes.agent.label'), icon: Bot, color: 'text-indigo-400', desc: t('copilot.modes.agent.desc') },
      { id: 'PLAN', label: t('copilot.modes.plan.label'), icon: Workflow, color: 'text-emerald-400', desc: t('copilot.modes.plan.desc') },
  ];

  // Auto-resize logic
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Click outside menus
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  const currentModelName = AVAILABLE_MODELS.find(m => m.id === model)?.name || model;
  const currentMode = chatModes.find(m => m.id === mode) || chatModes[0];
  const ModeIcon = currentMode.icon;

  return (
    <div className="p-[5px] bg-[#111113]">
      <div className="relative bg-[#18181b] border border-[#333] rounded-xl shadow-sm transition-all focus-within:border-gray-600 flex flex-col">
          
          {/* Text Area */}
          <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || (mode === 'PLAN' ? t('copilot.input.placeholder_plan') : t('copilot.input.placeholder_agent'))}
              className="w-full bg-transparent border-none text-white placeholder-gray-500 text-sm px-4 pt-3 pb-2 resize-none focus:ring-0 focus:outline-none scrollbar-hide overflow-y-auto min-h-[48px]"
              rows={1}
              style={{ maxHeight: '200px' }}
          />
          
          {/* Toolbar */}
          <div className="flex items-center justify-between px-2 pb-2 pt-1 gap-2">
              
              {/* LEFT: Context Controls */}
              <div className="flex items-center gap-2">
                  
                  {/* Mode Selector */}
                  <div className="relative" ref={modeMenuRef}>
                      <button
                        onClick={() => setShowModeMenu(!showModeMenu)}
                        className="flex items-center gap-1.5 text-[11px] font-medium bg-[#27272a] hover:bg-[#333] text-gray-300 px-2 py-1 rounded transition-colors border border-[#333] group shadow-sm"
                        title="Switch Chat Mode"
                      >
                          <ModeIcon size={12} className={currentMode.color} />
                          <span>{currentMode.label}</span>
                          <ChevronDown size={10} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </button>

                      {showModeMenu && (
                          <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#252526] border border-[#333] rounded-lg shadow-xl py-1 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-75">
                              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mode</div>
                              {chatModes.map(m => (
                                  <button
                                    key={m.id}
                                    onClick={() => { setMode(m.id as ChatMode); setShowModeMenu(false); }}
                                    className={`flex items-center gap-3 px-3 py-2 text-xs text-left hover:bg-[#333] transition-colors ${mode === m.id ? 'bg-[#333]' : ''}`}
                                  >
                                      <m.icon size={14} className={m.color} />
                                      <div className="flex flex-col flex-1">
                                          <span className={mode === m.id ? 'text-white font-medium' : 'text-gray-300'}>{m.label}</span>
                                          <span className="text-[10px] text-gray-500">{m.desc}</span>
                                      </div>
                                      {mode === m.id && <Check size={12} className="text-blue-400" />}
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* Model Selector */}
                  <div className="relative" ref={modelMenuRef}>
                      <button 
                        onClick={() => setShowModelMenu(!showModelMenu)}
                        className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#27272a] transition-colors"
                      >
                          <span className="truncate max-w-[100px]">{currentModelName}</span>
                          <ChevronDown size={10} />
                      </button>

                      {showModelMenu && (
                          <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#252526] border border-[#333] rounded-lg shadow-xl py-1 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-75">
                              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Model</div>
                              {AVAILABLE_MODELS.map(m => (
                                  <button
                                    key={m.id}
                                    onClick={() => { setModel(m.id); setShowModelMenu(false); }}
                                    className={`flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-[#333] transition-colors ${model === m.id ? 'text-blue-400 bg-blue-500/10' : 'text-gray-300'}`}
                                  >
                                      {m.name}
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
              
              {/* RIGHT: Input Actions */}
              <div className="flex items-center gap-1">
                  <button 
                    className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-[#27272a] rounded-md transition-colors"
                    title={t('copilot.input.attach')}
                  >
                      <Paperclip size={16} />
                  </button>
                  <button 
                    className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-[#27272a] rounded-md transition-colors"
                    title={t('copilot.input.voice')}
                  >
                      <Mic size={16} />
                  </button>
                  
                  <div className="w-[1px] h-4 bg-[#333] mx-1" />

                  <button 
                      onClick={handleSend}
                      disabled={!input.trim() || disabled}
                      className={`
                          p-1.5 rounded-md transition-all duration-200 flex items-center justify-center
                          ${input.trim() && !disabled
                              ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-900/20' 
                              : 'bg-[#27272a] text-gray-600 cursor-not-allowed'
                          }
                      `}
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
