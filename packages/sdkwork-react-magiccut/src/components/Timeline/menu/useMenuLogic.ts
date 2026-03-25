
import React, { useMemo } from 'react';
import { 
    Scissors, Trash2, Copy, Clipboard, 
    ArrowLeftToLine, ArrowRightToLine, MapPin, 
    Minimize2, Eye, EyeOff, Lock, Unlock,
    Unlink
} from 'lucide-react';
import { useMagicCutStore } from '../../../store/magicCutStore';
import { MenuItemConfig, MenuContextType } from './types';
import { MediaResourceType } from '@sdkwork/react-commons';
import { useMagicCutTranslation } from '../../../hooks/useMagicCutTranslation';

export const useMenuLogic = (
    type: MenuContextType,
    targetId: string | null,
    time: number,
    closeMenu: () => void
) => {
    const { t, tc, tl } = useMagicCutTranslation();
    const { 
        splitClip, deleteSelected, copyClip, pasteClip,
        trimStart, trimEnd, addMarker,
        updateTrack, removeTrack, state, clipboard,
        detachAudio,
        selectClip,
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
                    label: t('contextMenu.actions.split'),
                    icon: React.createElement(Scissors, { size: 14 }),
                    shortcut: 'Ctrl+B',
                    action: () => {
                        selectClip(targetId);
                        splitClip(time);
                    }
                },
                {
                    id: 'trim-start',
                    label: t('contextMenu.actions.trimStart'),
                    icon: React.createElement(ArrowLeftToLine, { size: 14 }),
                    shortcut: 'Q',
                    action: () => {
                        selectClip(targetId);
                        trimStart(time);
                    }
                },
                {
                    id: 'trim-end',
                    label: t('contextMenu.actions.trimEnd'),
                    icon: React.createElement(ArrowRightToLine, { size: 14 }),
                    shortcut: 'W',
                    action: () => {
                        selectClip(targetId);
                        trimEnd(time);
                    }
                }
            );

            if (isVideo) {
                 items.push({
                    id: 'detach-audio',
                    label: t('contextMenu.actions.detachAudio'),
                    icon: React.createElement(Unlink, { size: 14 }),
                    action: () => detachAudio(targetId)
                });
            }

            items.push(
                { id: 'sep1', label: '', icon: null, separator: true, action: () => {} },
                {
                    id: 'copy',
                    label: tc('copy'),
                    icon: React.createElement(Copy, { size: 14 }),
                    shortcut: 'Ctrl+C',
                    action: () => copyClip(targetId)
                },
                { id: 'sep2', label: '', icon: null, separator: true, action: () => {} },
                {
                    id: 'delete',
                    label: t('contextMenu.actions.deleteLift'),
                    icon: React.createElement(Trash2, { size: 14 }),
                    shortcut: 'Del',
                    danger: true,
                    action: () => {
                        selectClip(targetId);
                        deleteSelected();
                    }
                },
                {
                    id: 'ripple-delete',
                    label: t('contextMenu.actions.rippleDelete'),
                    icon: React.createElement(Trash2, { size: 14 }),
                    shortcut: 'Shift+Del',
                    danger: true,
                    action: () => {
                        selectClip(targetId);
                        deleteSelected('ripple');
                    }
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
                    label: t('contextMenu.actions.pasteHere'),
                    icon: React.createElement(Clipboard, { size: 14 }),
                    shortcut: 'Ctrl+V',
                    disabled: !clipboard,
                    action: () => pasteClip(targetId, time)
                },
                {
                    id: 'paste-insert',
                    label: t('contextMenu.actions.pasteInsertHere'),
                    icon: React.createElement(Clipboard, { size: 14 }),
                    shortcut: 'Ctrl+Shift+V',
                    disabled: !clipboard,
                    action: () => pasteClip(targetId, time, 'insert')
                },
                {
                    id: 'paste-overwrite',
                    label: t('contextMenu.actions.pasteOverwriteHere'),
                    icon: React.createElement(Clipboard, { size: 14 }),
                    disabled: !clipboard,
                    action: () => pasteClip(targetId, time, 'overwrite')
                },
                { id: 'sep1', label: '', icon: null, separator: true, action: () => {} },
                {
                    id: 'toggle-lock',
                    label: isLocked ? tl('unlockTrack') : tl('lockTrack'),
                    icon: React.createElement(isLocked ? Unlock : Lock, { size: 14 }),
                    action: () => updateTrack(targetId, { locked: !isLocked })
                },
                {
                    id: 'toggle-visible',
                    label: isVisible ? tl('hideTrack') : tl('showTrack'),
                    icon: React.createElement(isVisible ? EyeOff : Eye, { size: 14 }),
                    action: () => updateTrack(targetId, { visible: !isVisible })
                },
                { id: 'sep2', label: '', icon: null, separator: true, action: () => {} },
                {
                    id: 'delete-track',
                    label: tl('deleteTrack'),
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
                    label: t('contextMenu.actions.pasteToNewTrack'),
                    icon: React.createElement(Clipboard, { size: 14 }),
                    shortcut: 'Ctrl+V',
                    disabled: !clipboard,
                    action: () => pasteClip(null, time)
                },
                {
                    id: 'paste-insert-new',
                    label: t('contextMenu.actions.pasteInsertToNewTrack'),
                    icon: React.createElement(Clipboard, { size: 14 }),
                    shortcut: 'Ctrl+Shift+V',
                    disabled: !clipboard,
                    action: () => pasteClip(null, time, 'insert')
                },
                {
                    id: 'paste-overwrite-new',
                    label: t('contextMenu.actions.pasteOverwriteToNewTrack'),
                    icon: React.createElement(Clipboard, { size: 14 }),
                    disabled: !clipboard,
                    action: () => pasteClip(null, time, 'overwrite')
                },
                { id: 'sep1', label: '', icon: null, separator: true, action: () => {} },
                {
                    id: 'add-marker',
                    label: tl('addMarker'),
                    icon: React.createElement(MapPin, { size: 14 }),
                    shortcut: 'M',
                    action: () => addMarker()
                },
                { id: 'sep2', label: '', icon: null, separator: true, action: () => {} },
                {
                    id: 'fit-view',
                    label: tl('fitToView'),
                    icon: React.createElement(Minimize2, { size: 14 }),
                    shortcut: 'Shift+Z',
                    action: () => { /* Fit view logic handled by EventBus in parent, simplified here for context menu limitation */ }
                }
            );
        }

        return items;
    }, [type, targetId, time, clipboard, state.tracks, splitClip, trimStart, trimEnd, copyClip, deleteSelected, pasteClip, updateTrack, removeTrack, addMarker, detachAudio, selectClip, getClip, getResource, t, tc, tl]);

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
