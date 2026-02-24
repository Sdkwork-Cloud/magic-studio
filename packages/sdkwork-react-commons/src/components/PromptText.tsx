
import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

// Platform API will be injected at runtime
const getPlatformAPI = () => {
  if (typeof window !== 'undefined' && (window as any).__sdkworkPlatform) {
    return (window as any).__sdkworkPlatform;
  }
  return {
    copy: (text: string) => { navigator.clipboard.writeText(text); }
  };
};

export interface PromptTextProps {
    text: string;
    className?: string;
    /** If true, truncates text initially. Default: true */
    compact?: boolean;
    /** Max lines to show when compact. Default: 3 */
    maxLines?: number;
    enableCopy?: boolean;
    onCopy?: () => void;
    onClick?: () => void;
    style?: React.CSSProperties;
}

export const PromptText: React.FC<PromptTextProps> = ({ 
    text, 
    className = "", 
    compact = true, 
    maxLines = 3,
    enableCopy = true, 
    onCopy, 
    onClick,
    style
}) => {
    const [expanded, setExpanded] = useState(!compact);
    const [copied, setCopied] = useState(false);

    // Naive estimation to decide if we even need the expand button
    // 1 line ~ 50-80 chars depending on width, but let's assume if it's super short we don't need truncate logic visually
    const isLongText = text.length > 150 || (text.match(/\n/g) || []).length > 2;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const platform = getPlatformAPI();
        platform.copy(text);
        setCopied(true);
        if (onCopy) onCopy();
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    return (
        <div 
            className={`group relative bg-[#1c1c1f] border border-[#27272a] rounded-lg p-3 hover:border-[#3f3f46] transition-colors ${className}`} 
            onClick={onClick}
            style={style}
        >
            <div className={`relative ${!expanded ? 'overflow-hidden' : ''} ${!expanded ? `max-h-[${maxLines * 1.5}em]` : ''}`}>
                 <p 
                    className={`
                        text-sm text-gray-300 leading-relaxed font-normal break-words whitespace-pre-wrap font-sans
                        ${!expanded ? 'line-clamp-' + maxLines : ''}
                        ${onClick ? 'cursor-pointer' : 'cursor-text'}
                    `}
                    style={!expanded ? { 
                        display: '-webkit-box', 
                        WebkitLineClamp: maxLines, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden' 
                    } : undefined}
                >
                    {text}
                </p>
                
                {/* Gradient Overlay when collapsed */}
                {!expanded && isLongText && (
                    <div 
                        className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1c1c1f] to-transparent pointer-events-none"
                    />
                )}
            </div>
            
            {/* Actions Bar (Footer) */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#27272a]/50 opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    {enableCopy && (
                        <button 
                            onClick={handleCopy}
                            className={`
                                flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded transition-colors
                                ${copied ? 'text-green-500 bg-green-500/10' : 'text-gray-500 hover:text-white hover:bg-[#333]'}
                            `}
                            title="Copy Prompt"
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    )}
                </div>

                {isLongText && compact && (
                    <button 
                        onClick={toggleExpand}
                        className="flex items-center gap-1 text-[10px] font-medium text-gray-500 hover:text-blue-400 px-2 py-1 rounded hover:bg-blue-400/10 transition-colors"
                    >
                        {expanded ? (
                            <>Collapse <ChevronUp size={12} /></>
                        ) : (
                            <>Show more <ChevronDown size={12} /></>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
