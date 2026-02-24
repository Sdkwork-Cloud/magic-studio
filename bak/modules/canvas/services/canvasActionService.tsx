
import React from 'react';
import { 
    Maximize2, Eraser, Scissors, Layers, Wand2, 
    Type, ArrowUpCircle, ArrowDownCircle, Copy, 
    Trash2, Download
} from 'lucide-react';
import { CanvasElement } from '../entities/canvas.entity';
import { useCanvasStore } from '../store/canvasStore';

export interface CanvasActionContext {
    element: CanvasElement;
    onCallback?: (actionId: string) => void; // For callbacks to React components (e.g. focus input)
}

export interface CanvasActionDefinition {
    id: string;
    labelKey: string;
    icon: React.ElementType;
    category: 'primary' | 'secondary' | 'danger' | 'ai';
    separatorBefore?: boolean;
    /**
     * Determines if this action should be visible for the given element.
     */
    condition: (element: CanvasElement) => boolean;
    /**
     * Executes the action. Returns a promise for async operations (loading states).
     */
    execute: (context: CanvasActionContext) => Promise<void> | void;
}

class CanvasActionService {
    private actions: CanvasActionDefinition[] = [];

    constructor() {
        this.registerDefaultActions();
    }

    public register(action: CanvasActionDefinition) {
        this.actions.push(action);
    }

    public getActions(element: CanvasElement): CanvasActionDefinition[] {
        return this.actions.filter(action => action.condition(element));
    }

    private registerDefaultActions() {
        // --- View Actions ---
        this.register({
            id: 'zoom',
            labelKey: 'canvas.toolbar.zoom',
            icon: Maximize2,
            category: 'secondary',
            condition: () => true, // Always show
            execute: () => {
                // Logic to zoom to fit element
                // For now, we assume simple console or future store implementation
                console.log("Zoom to element");
            }
        });

        // --- AI Actions (Image/Video) ---
        this.register({
            id: 'remove-bg',
            labelKey: 'canvas.toolbar.remove_bg',
            icon: Scissors,
            category: 'ai',
            separatorBefore: true,
            condition: (el) => el.type === 'image' || el.type === 'video',
            execute: async ({ element }) => {
                // Simulate Async AI Operation
                console.log("Removing background for", element.id);
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log("Done");
            }
        });

        this.register({
            id: 'mockup',
            labelKey: 'canvas.toolbar.mockup',
            icon: Layers,
            category: 'ai',
            condition: (el) => el.type === 'image',
            execute: async () => {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        });

        // --- Editing Tools ---
        this.register({
            id: 'erase',
            labelKey: 'canvas.toolbar.erase',
            icon: Eraser,
            category: 'secondary',
            separatorBefore: true,
            condition: (el) => el.type === 'image',
            execute: () => {}
        });

        this.register({
            id: 'ai-edit',
            labelKey: 'canvas.toolbar.ai_edit',
            icon: Wand2,
            category: 'ai',
            condition: (el) => el.type === 'image',
            execute: () => {}
        });

        // --- Text Specific ---
        this.register({
            id: 'edit-text',
            labelKey: 'canvas.toolbar.edit_text',
            icon: Type,
            category: 'primary',
            condition: (el) => el.type === 'text' || el.type === 'note',
            execute: ({ onCallback }) => {
                // Determine if we need to enter edit mode in the UI
                if (onCallback) onCallback('edit-text');
            }
        });

        // --- General Operations ---
        this.register({
            id: 'duplicate',
            labelKey: 'canvas.toolbar.duplicate',
            icon: Copy,
            category: 'secondary',
            separatorBefore: true,
            condition: () => true,
            execute: () => {
                useCanvasStore.getState().duplicateSelected();
            }
        });

        this.register({
            id: 'front',
            labelKey: 'canvas.toolbar.bring_front',
            icon: ArrowUpCircle,
            category: 'secondary',
            condition: () => true,
            execute: () => {
                useCanvasStore.getState().bringToFront();
            }
        });

        this.register({
            id: 'back',
            labelKey: 'canvas.toolbar.send_back',
            icon: ArrowDownCircle,
            category: 'secondary',
            condition: () => true,
            execute: () => {
                useCanvasStore.getState().sendToBack();
            }
        });

        this.register({
            id: 'download',
            labelKey: 'canvas.toolbar.download',
            icon: Download,
            category: 'secondary',
            separatorBefore: true,
            condition: (el) => !!el.resource?.url && (el.type === 'image' || el.type === 'video'),
            execute: ({ element }) => {
                if (element.resource?.url) {
                    const a = document.createElement('a');
                    a.href = element.resource.url;
                    a.download = `canvas-export-${element.id}.${element.type === 'video' ? 'mp4' : 'png'}`;
                    a.click();
                }
            }
        });

        this.register({
            id: 'delete',
            labelKey: 'canvas.toolbar.delete',
            icon: Trash2,
            category: 'danger',
            separatorBefore: true,
            condition: () => true,
            execute: ({ element }) => {
                useCanvasStore.getState().deleteElement(element.id);
            }
        });
    }
}

export const canvasActionService = new CanvasActionService();
