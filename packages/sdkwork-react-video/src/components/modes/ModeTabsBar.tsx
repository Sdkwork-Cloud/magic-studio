import React, { useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Popover } from '@sdkwork/react-commons';
import { VIDEO_GENERATION_MODES, VIDEO_MORE_GENERATION_TOOLS } from '../../constants';
import type { VideoGenerationMode, VideoModeAvailability } from '../../entities';

const MODE_TAB_LABEL_MAP: Partial<Record<VideoGenerationMode, string>> = {
    smart_reference: 'All-round',
    subject_ref: 'Subject',
    smart_multi: 'Multi-Frame',
    start_end: 'Start-End'
};

interface ModeTabsBarProps {
    mode: VideoGenerationMode;
    onModeChange: (mode: VideoGenerationMode) => void;
    availability?: Partial<Record<VideoGenerationMode, VideoModeAvailability>>;
}

export const ModeTabsBar: React.FC<ModeTabsBarProps> = ({ mode, onModeChange, availability }) => {
    const [showMoreToolsMenu, setShowMoreToolsMenu] = useState(false);
    const moreToolsButtonRef = useRef<HTMLButtonElement>(null);

    const resolveAvailability = (modeId: VideoGenerationMode): VideoModeAvailability => {
        const item = availability?.[modeId];
        return item || { mode: modeId, enabled: true };
    };

    return (
        <div className="rounded-xl border border-[#27272a] bg-[#121214] p-1">
            <div className="flex items-center gap-1">
                {VIDEO_GENERATION_MODES.map((item) => {
                    const modeAvailability = resolveAvailability(item.id);
                    const isActive = mode === item.id;
                    const isDisabled = !modeAvailability.enabled;
                    const tabLabel = MODE_TAB_LABEL_MAP[item.id] || item.label;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (isDisabled) {
                                    return;
                                }
                                onModeChange(item.id);
                            }}
                            disabled={isDisabled}
                            className={`
                                flex-1 min-w-0 rounded-lg border px-1.5 py-1.5 text-[10px] font-semibold transition truncate
                                ${isActive
                                    ? 'border-[#2563eb]/60 bg-[#2563eb]/12 text-white shadow-[0_0_0_1px_rgba(37,99,235,0.2)]'
                                    : 'border-transparent text-gray-400 hover:border-[#3b3b3f] hover:bg-[#17171a] hover:text-gray-200'
                                }
                                ${isDisabled ? 'cursor-not-allowed opacity-45 hover:border-transparent hover:bg-transparent hover:text-gray-500' : ''}
                            `}
                        >
                            {tabLabel}
                        </button>
                    );
                })}
                <button
                    ref={moreToolsButtonRef}
                    onClick={() => setShowMoreToolsMenu((prev) => !prev)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-[#2a2a2d] bg-[#161618] px-2 py-1.5 text-[10px] font-semibold text-gray-400 transition hover:border-[#3a3a3d] hover:text-white"
                >
                    <MoreHorizontal size={11} />
                    More
                </button>
            </div>

            <Popover
                isOpen={showMoreToolsMenu}
                onClose={() => setShowMoreToolsMenu(false)}
                triggerRef={moreToolsButtonRef}
                align="end"
                width={300}
                className="p-1.5"
            >
                <div className="mb-1 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    More Tools
                </div>
                <div className="space-y-1">
                    {VIDEO_MORE_GENERATION_TOOLS.map((tool) => {
                        const modeAvailability = resolveAvailability(tool.id);
                        const isActive = mode === tool.id;
                        const isDisabled = !modeAvailability.enabled;
                        const Icon = tool.icon;
                        return (
                            <button
                                key={tool.id}
                                disabled={isDisabled}
                                onClick={() => {
                                    if (isDisabled) {
                                        return;
                                    }
                                    onModeChange(tool.id);
                                    setShowMoreToolsMenu(false);
                                }}
                                className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                                    isActive
                                        ? 'border-[#2563eb]/50 bg-[#2563eb]/12'
                                        : 'border-transparent hover:border-white/10 hover:bg-[#1d1d21]'
                                } ${isDisabled ? 'cursor-not-allowed opacity-45 hover:border-transparent hover:bg-transparent' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon size={14} className={isActive ? 'text-[#60a5fa]' : 'text-gray-400'} />
                                        <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                            {tool.label}
                                        </span>
                                    </div>
                                    {tool.badge ? (
                                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${isActive ? 'bg-[#2563eb]/20 text-[#93c5fd]' : 'bg-[#27272a] text-gray-500'}`}>
                                            {tool.badge}
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-1 text-[10px] text-gray-500">{tool.description}</p>
                            </button>
                        );
                    })}
                </div>
            </Popover>
        </div>
    );
};
