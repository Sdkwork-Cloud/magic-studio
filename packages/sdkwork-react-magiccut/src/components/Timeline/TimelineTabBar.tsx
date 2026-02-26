
import { Tabs, type TabItem } from '@sdkwork/react-commons';
import { CutTimeline } from '../../entities/magicCut.entity';
import React, { useState, useMemo } from 'react';
import { useMagicCutStore } from '../../store/magicCutStore';
;
import { Plus, Film, Edit3 } from 'lucide-react';
;

export const TimelineTabBar: React.FC = React.memo(() => {
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
        return (Object.values(state.timelines) as CutTimeline[]).sort((a, b) => a.createdAt - b.createdAt);
    }, [state.timelines]);

    const handleSelect = (id: string) => {
        // Store handles pause logic now
        setActiveTimelineId(id);
    };

    const handleClose = (id: string) => {
        removeTimeline(id);
    };

    const handleAdd = () => {
        const name = `Sequence ${timelines.length + 1}`;
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
    const tabItems: TabItem[] = timelines.map(tl => {
        if (tl.id === editingId) {
            return {
                id: tl.id,
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
            id: tl.id,
            title: tl.name,
            icon: <Film size={12} className={activeTimelineId === tl.id ? "text-blue-400" : "text-gray-500"} />,
            tooltip: `Duration: ${tl.duration}s`
        };
    });

    const AddButton = (
        <div className="relative flex items-center h-[34px] mx-1">
            <button
                onClick={handleAdd}
                className="h-[28px] w-[28px] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#333] rounded-md transition-colors focus:outline-none"
                title="New Sequence"
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

