
import React, { useMemo } from 'react';
import { 
    Scissors, Trash2, Copy, Clipboard, 
    ArrowLeftToLine, ArrowRightToLine, MapPin, 
    Minimize2, ZoomIn, Eye, EyeOff, Lock, Unlock,
    Unlink
} from 'lucide-react';
import { useMagicCutStore } from '../../../store/magicCutStore';
import { MenuItemConfig, MenuContextType } from './types';
import { MediaResourceType } from 'sdkwork-react-commons';

export const useMenuLogic = (
    type: MenuContextType,
    targetId: string | null,
    time: number,
    closeMenu: () => void
) => {
    const { 
        splitClip, deleteSelected, copyClip, pasteClip,
        trimStart, trimEnd, addMarker,
        updateTrack, removeTrack, state, clipboard,
        selectClip,
        detachAudio,
        getResource,
        getClip
    } = useMagicCutStore();

    const actions = useMemo<MenuItemConfig[]>(() => {
        const items: MenuItemConfig[] = [];

        // --- CLIP CONTEXT ---
        if (type === 'clip' && targetId) {
            const clip = getClip(targetId);
            const resource = clip ? getResource(clip.resource.id) : null;
            const isVideo = resource?.type === MediaResourceType.VIDEO;

            items.push(
                {
                    id: 'split',
                    label: 'Split', // �ָ�
                    icon: React.createElement(Scissors, { size: 14 }),
                    shortcut: 'Ctrl+B',
                    action: () => splitClip(time) // Pass time
                },
                {
                    id: 'trim-start',
                    label: 'Trim Start (Delete Left)', // ���ɾ��?                    icon: React.createElement(ArrowLeftToLine, { size: 14 }),
                    shortcut: 'Q',
                    action: () => trimStart(time) // Pass time
                },
                {
                    id: 'trim-end',
                    label: 'Trim End (Delete Right)', // �Ҳ�ɾ��
                    icon: React.createElement(ArrowRightToLine, { size: 14 }),
                    shortcut: 'W',
                    action: () => trimEnd(time) // Pass time
                }
            );

            if (isVideo) {
                 items.push({
                    id: 'detach-audio',
                    label: 'Detach Audio', // ������Ƶ
                    icon: React.createElement(Unlink, { size: 14 }),
                    action: () => detachAudio(targetId)
                });
            }

            items.push(
                { id: 'sep1', label: '', icon: null, separator: true, action: () => {} },
                {
                    id: 'copy',
                    label: 'Copy',
                    icon: React.createElement(Copy, { size: 14 }),
                    shortcut: 'Ctrl+C',
                    action: () => copyClip(targetId)
                },
                { id: 'sep2', label: '', icon: null, separator: true, action: () => {} },
                {
                    id: 'delete',
                    label: 'Delete',
                    icon: React.createElement(Trash2, { size: 14 }),
                    shortcut: 'Del',
                    danger: true,
                    action: () => deleteSelected()
                }
            );
        }

        // --- TRACK BACKGROUND CONTEXT ---
        if (type === 'track' && targetId) {
            const track = state.tracks[targetId];
            const isLocked = track?.locked;
            const isVisible = track?.visible;

            items.push(
                {
                    id: 'paste',
                    label: 'Paste Here',
                    icon: React.createElement(Clipboard, { size: 14 }),
                    shortcut: 'Ctrl+V',
                    disabled: !clipboard,
                    action: () => pasteClip(targetId, time)
                },
                { id: 'sep1', label: '', icon: null, separator: true, action: () => {} },
                {
                    id: 'toggle-lock',
                    label: isLocked ? 'Unlock Track' : 'Lock Track',
                    icon: React.createElement(isLocked ? Unlock : Lock, { size: 14 }),
                    action: () => updateTrack(targetId, { locked: !isLocked })
                },
                {
                    id: 'toggle-visible',
                    label: isVisible ? 'Hide Track' : 'Show Track',
                    icon: React.createElement(isVisible ? EyeOff : Eye, { size: 14 }),
                    action: () => updateTrack(targetId, { visible: !isVisible })
                },
                { id: 'sep2', label: '', icon: null, separator: true, action: () => {} },
                {
                    id: 'delete-track',
                    label: 'Delete Track',
                    icon: React.createElement(Trash2, { size: 14 }),
                    danger: true,
                    action: () => removeTrack(targetId)
                }
            );
        }

        // --- EMPTY TIMELINE CONTEXT ---
        if (type === 'timeline') {
            items.push(
                {
                    id: 'paste-new',
                    label: 'Paste to New Track',
                    icon: React.createElement(Clipboard, { size: 14 }),
                    shortcut: 'Ctrl+V',
                    disabled: !clipboard,
                    action: () => pasteClip(null, time)
                },
                { id: 'sep1', label: '', icon: null, separator: true, action: () => {} },
                {
                    id: 'add-marker',
                    label: 'Add Marker',
                    icon: React.createElement(MapPin, { size: 14 }),
                    shortcut: 'M',
                    action: () => addMarker()
                },
                { id: 'sep2', label: '', icon: null, separator: true, action: () => {} },
                {
                    id: 'fit-view',
                    label: 'Fit to View',
                    icon: React.createElement(Minimize2, { size: 14 }),
                    shortcut: 'Shift+Z',
                    action: () => { /* Fit view logic handled by EventBus in parent, simplified here for context menu limitation */ }
                }
            );
        }

        return items;
    }, [type, targetId, time, clipboard, state.tracks, splitClip, trimStart, trimEnd, copyClip, deleteSelected, pasteClip, updateTrack, removeTrack, addMarker, detachAudio, getClip, getResource]);

    const handleAction = (item: MenuItemConfig) => {
        if (item.disabled) return;
        item.action();
        closeMenu();
    };

    return {
        actions,
        handleAction
    };
};

