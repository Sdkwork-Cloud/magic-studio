
import React, { useState } from 'react';
import { 
    MoreHorizontal, Loader2, ChevronRight
} from 'lucide-react';
import { CanvasElement } from '../entities/canvas.entity';
import { canvasActionService } from '../services/canvasActionService';
import { useTranslation } from '../../../i18n';

interface ElementToolbarProps {
    element: CanvasElement;
    onAction: (action: string) => void;
    isProcessing?: boolean;
}

export const ElementToolbar: React.FC<ElementToolbarProps> = ({ element, onAction, isProcessing: externalProcessing }) => {
    const { t } = useTranslation();
    const [showMore, setShowMore] = useState(false);
    const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

    // Get available actions from service
    const actions = canvasActionService.getActions(element);
    
    // Split into primary (toolbar) and overflow (menu) based on count or specific logic
    // For now, let's show first 4 items + separators, rest in More menu if too many
    const VISIBLE_LIMIT = 5;
    const primaryActions = actions.slice(0, VISIBLE_LIMIT);
    const overflowActions = actions.slice(VISIBLE_LIMIT);

    const handleExecute = async (actionId: string, executeFn: (ctx: any) => void | Promise<void>) => {
        setLoadingActionId(actionId);
        try {
            await executeFn({
                element,
                onCallback: onAction // Pass the callback for local UI handlers (like focus text)
            });
        } catch (e) {
            console.error("Action failed", e);
        } finally {
            setLoadingActionId(null);
            setShowMore(false);
        }
    };

    // Prevent propagation to canvas
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div 
            className="flex items-center h-10 bg-[#1e1e1e]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 px-1.5 gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-200 whitespace-nowrap select-none pointer-events-auto ring-1 ring-black/20"
            onMouseDown={stopPropagation}
            onClick={stopPropagation}
        >
            {primaryActions.map((action, idx) => {
                const Icon = action.icon;
                const isLoading = loadingActionId === action.id || (externalProcessing && action.category === 'ai');
                
                return (
                    <React.Fragment key={action.id}>
                        {action.separatorBefore && idx > 0 && (
                            <div className="w-[1px] h-4 bg-white/10 mx-1" />
                        )}
                        <ToolbarBtn 
                            icon={<Icon size={14} />} 
                            label={t(action.labelKey)} 
                            onClick={() => handleExecute(action.id, action.execute)}
                            loading={isLoading}
                            variant={action.category}
                        />
                    </React.Fragment>
                );
            })}

            {/* Overflow Menu */}
            {overflowActions.length > 0 && (
                <>
                    <div className="w-[1px] h-4 bg-white/10 mx-1" />
                    <div className="relative">
                        <button 
                            onClick={() => setShowMore(!showMore)}
                            className={`
                                p-2 rounded-lg transition-colors
                                ${showMore ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-400 hover:text-white'}
                            `}
                        >
                            <MoreHorizontal size={14} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showMore && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[#252526] border border-[#333] rounded-xl shadow-2xl py-1 z-[200] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/50">
                                {overflowActions.map((action, idx) => {
                                    const Icon = action.icon;
                                    return (
                                        <React.Fragment key={action.id}>
                                            {action.separatorBefore && idx > 0 && (
                                                <div className="h-[1px] bg-[#333] my-1 mx-2" />
                                            )}
                                            <button 
                                                onClick={() => handleExecute(action.id, action.execute)}
                                                className={`
                                                    flex items-center gap-3 px-3 py-2 text-xs text-left transition-colors w-full
                                                    ${action.category === 'danger' 
                                                        ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                                                        : 'text-gray-300 hover:bg-[#333] hover:text-white'
                                                    }
                                                `}
                                            >
                                                <span className={`opacity-70 ${action.category === 'ai' ? 'text-purple-400' : ''}`}>
                                                    <Icon size={14} />
                                                </span>
                                                <span>{t(action.labelKey)}</span>
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

interface ToolbarBtnProps { 
    icon: React.ReactNode; 
    label: string; 
    onClick: () => void; 
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'ai';
}

const ToolbarBtn: React.FC<ToolbarBtnProps> = ({ icon, label, onClick, loading, variant }) => {
    let baseClass = "text-gray-300 hover:text-white hover:bg-white/10";
    let iconClass = "text-gray-400 group-hover:text-white";

    if (variant === 'danger') {
        baseClass = "text-red-400 hover:text-red-300 hover:bg-red-500/20";
        iconClass = "text-red-400";
    } else if (variant === 'ai') {
        baseClass = "text-purple-300 hover:text-purple-200 hover:bg-purple-500/20";
        iconClass = "text-purple-400";
    }

    return (
        <div className="relative group/toolbar-btn">
            <button 
                onClick={onClick}
                disabled={loading}
                className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-wait
                    ${baseClass}
                `}
            >
                <span className={`${iconClass} transition-colors`}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
                </span>
                <span>{label}</span>
            </button>
        </div>
    );
};
