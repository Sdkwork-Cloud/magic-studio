
import { Tabs, type TabItem } from '@sdkwork/react-commons';
import { CutTimeline } from '../../entities/magicCut.entity';
import React, { useState, useMemo } from 'react';
import { useMagicCutStore } from '../../store/magicCutStore';
;
import { Plus, Film, Edit3 } from 'lucide-react';
;
import { useMagicCutTranslation } from '../../hooks/useMagicCutTranslation';

export const TimelineTabBar: React.FC = React.memo(() => {
    const { tl } = useMagicCutTranslation();
    const {
        state,
        activeTimelineId,
        setActiveTimelineId,
        addTimeline,
        removeTimeline,
        updateTimeline
    } = useMagicCutStore();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const timelines = useMemo(() => {
        return (Object.values(state.timelines) as CutTimeline[]).sort((a, b) => {
            const aTime = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
            const bTime = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime();
            return aTime - bTime;
        });
    }, [state.timelines]);

    const handleSelect = (id: string) => {
        // Store handles pause logic now
        setActiveTimelineId(id);
    };

    const handleClose = (id: string) => {
        removeTimeline(id);
    };

    const handleAdd = () => {
        const name = tl('sequenceDefault', { index: timelines.length + 1 });
        addTimeline(name);
    };

    const startRenaming = (id: string) => {
        setEditingId(id);
        const tl = state.timelines[id];
        setEditValue(tl ? tl.name : '');
    };

    const commitRename = () => {
        if (editingId && editValue.trim()) {
            updateTimeline(editingId, { name: editValue.trim() });
        }
        setEditingId(null);
    };

    // Map timelines to generic TabItems
    const tabItems: TabItem[] = timelines.map((timeline) => {
        if (timeline.id === editingId) {
            return {
                id: timeline.id,
                title: (
                    <input
                        autoFocus
                        className="bg-[#333] text-white text-xs border border-blue-500 rounded px-1 outline-none w-24"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) as any,
                icon: <Edit3 size={12} className="text-blue-400" />,
                isEditing: true
            };
        }

        return {
            id: timeline.id,
            title: timeline.name,
            icon: <Film size={12} className={activeTimelineId === timeline.id ? "text-blue-400" : "text-gray-500"} />,
            tooltip: tl('durationSeconds', { duration: timeline.duration })
        };
    });

    const AddButton = (
        <div className="relative flex items-center h-[34px] mx-1">
            <button
                onClick={handleAdd}
                className="h-[28px] w-[28px] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#333] rounded-md transition-colors focus:outline-none"
                title={tl('newSequence')}
            >
                <Plus size={16} />
            </button>
        </div>
    );

    return (
        <Tabs
            items={tabItems}
            activeId={activeTimelineId}
            onSelect={handleSelect}
            onClose={handleClose}
            onDoubleClick={(id) => startRenaming(id)}
            addonAfterTabs={AddButton}
            height={40}
            className="bg-[#0a0a0a] border-b border-[#27272a]"
        />
    );
});

