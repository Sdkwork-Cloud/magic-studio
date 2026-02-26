
import { Button } from '@sdkwork/react-commons'
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFilmStore } from '../store/filmStore';
import { Sparkles, Loader2, FileText, List, ChevronRight, Hash, Type } from 'lucide-react';

const SCENE_REGEX = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)\s/i;

interface OutlineItem {
    id: number;
    text: string;
    lineIndex: number;
    charIndex: number;
}

export const ScriptEditor: React.FC = () => {
    const { project, updateScript, analyzeScript, isProcessing } = useFilmStore();
    const [showOutline, setShowOutline] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [activeLine, setActiveLine] = useState(0);

    // Auto-generate outline
    const outline = useMemo(() => {
        const lines = project.script.content.split('\n');
        const items: OutlineItem[] = [];
        let charCount = 0;

        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (SCENE_REGEX.test(trimmed) || (trimmed === trimmed.toUpperCase() && trimmed.length > 4 && !trimmed.endsWith(':'))) {
                if (SCENE_REGEX.test(trimmed) || trimmed.includes(' - ')) {
                    items.push({
                        id: idx,
                        text: trimmed,
                        lineIndex: idx,
                        charIndex: charCount
                    });
                }
            }
            charCount += line.length + 1;
        });

        return items;
    }, [project.script.content]);

    const scrollToScene = (item: OutlineItem) => {
        if (!textareaRef.current) return;
        
        const el = textareaRef.current;
        el.focus();
        el.setSelectionRange(item.charIndex, item.charIndex + item.text.length);
        
        const lineHeight = 28; // Approx for font size
        const top = item.lineIndex * lineHeight;
        
        el.scrollTo({
            top: top - 100,
            behavior: 'smooth'
        });
        setActiveLine(item.lineIndex);
    };

    const handleCursorUpdate = () => {
        if (!textareaRef.current) return;
        const cursorPos = textareaRef.current.selectionStart;
        const content = textareaRef.current.value;
        const textBeforeCursor = content.substring(0, cursorPos);
        const lineCount = textBeforeCursor.split('\n').length - 1;
        setActiveLine(lineCount);
    };

    // Realistic Paper Texture CSS
    const paperStyle = {
        backgroundImage: `
            linear-gradient(90deg, transparent 95%, rgba(0,0,0,0.02) 95%),
            linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '20px 100%, 100% 28px',
        backgroundColor: '#e6e4dc' // Slight off-white paper color
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] relative overflow-hidden">
            {/* Toolbar */}
            <div className="flex-none h-10 px-4 border-b border-[#1a1a1a] bg-[#0a0a0a] flex justify-between items-center z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowOutline(!showOutline)}
                        className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-bold transition-colors ${showOutline ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <List size={14} />
                        OUTLINE
                    </button>
                    <div className="h-3 w-px bg-[#27272a]" />
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                         <Type size={12} />
                         <span>Courier Prime</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-600 font-mono">
                         Ln {activeLine + 1}, Ch {project.script.content.length}
                    </span>
                    <Button 
                        onClick={analyzeScript} 
                        disabled={isProcessing || !project.script.content.trim()}
                        className="h-7 text-[10px] uppercase font-bold bg-indigo-600 hover:bg-indigo-500 border-0 shadow-lg shadow-indigo-900/20 px-3 tracking-wider rounded-md"
                    >
                        {isProcessing ? <Loader2 size={12} className="animate-spin mr-2" /> : <Sparkles size={12} className="mr-2" />}
                        {isProcessing ? 'Analyzing...' : 'AI Breakdown'}
                    </Button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* Outline Sidebar */}
                <div 
                    className={`
                        flex-none border-r border-[#1a1a1a] bg-[#0a0a0a] flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                        ${showOutline ? 'w-60 opacity-100' : 'w-0 opacity-0 overflow-hidden'}
                    `}
                >
                    <div className="p-3 border-b border-[#1a1a1a] flex items-center justify-between">
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Scene List</span>
                         <span className="text-[9px] bg-[#1a1a1a] text-gray-400 px-1.5 rounded border border-[#27272a]">{outline.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
                        {outline.length === 0 ? (
                            <div className="text-center py-10 text-gray-700 text-xs flex flex-col items-center gap-2">
                                <FileText size={24} className="opacity-20" />
                                <p>No scenes detected.</p>
                                <p className="text-[10px] opacity-60">Start typing INT. or EXT.</p>
                            </div>
                        ) : (
                            outline.map((item, i) => {
                                const nextItemLine = outline[i+1]?.lineIndex ?? Infinity;
                                const isActive = activeLine >= item.lineIndex && activeLine < nextItemLine;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => scrollToScene(item)}
                                        className={`
                                            w-full text-left px-3 py-2.5 rounded-lg text-[10px] font-mono truncate transition-all flex items-center gap-2.5 group border border-transparent
                                            ${isActive 
                                                ? 'bg-[#1a1a1a] text-indigo-400 border-[#27272a] shadow-sm' 
                                                : 'text-gray-500 hover:bg-[#111] hover:text-gray-300'
                                            }
                                        `}
                                    >
                                        <span className={`text-[9px] font-bold min-w-[16px] text-center ${isActive ? 'text-indigo-500' : 'text-gray-700'}`}>{i+1}</span>
                                        <span className="truncate">{item.text.replace(/^(INT\.|EXT\.|I\/E\.)\s*/i, '').trim() || item.text}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Editor Surface - Cinematic Dark Mode or Paper Mode? Dark mode for studio feel. */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 flex justify-center bg-[#050505] custom-scrollbar scroll-smooth relative" onClick={() => textareaRef.current?.focus()}>
                    
                    <div className="w-full max-w-[850px] min-h-full bg-[#0a0a0a] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative border-x border-[#1a1a1a] flex flex-col">
                        
                        {/* Page Visuals */}
                        <div className="absolute left-0 top-0 bottom-0 w-[60px] border-r border-[#1a1a1a] pointer-events-none flex flex-col items-center py-8 gap-[28px] text-[10px] text-gray-800 font-mono select-none z-0">
                             {/* Line Numbers Simulation */}
                        </div>

                        <textarea 
                            ref={textareaRef}
                            className="
                                flex-1 w-full 
                                bg-transparent text-[#d4d4d4] 
                                pl-[80px] pr-[60px] py-[60px]
                                text-[16px] font-mono leading-[1.75] 
                                resize-none focus:outline-none 
                                selection:bg-indigo-900/50 selection:text-white
                                placeholder-gray-800
                                z-10
                            "
                            placeholder={`FADE IN:\n\nINT. CYBERPUNK LAB - NIGHT\n\nRain streaks down the neon-lit window. A figure shadows the doorway...`}
                            value={project.script.content}
                            onChange={(e) => updateScript(e.target.value)}
                            onKeyUp={handleCursorUpdate}
                            onClick={handleCursorUpdate}
                            spellCheck={false}
                            autoFocus
                        />
                    </div>
                </div>
                
                {/* Expand Toggle */}
                {!showOutline && (
                    <div className="absolute left-4 top-4 z-30">
                        <button 
                            onClick={() => setShowOutline(true)}
                            className="p-2 bg-[#1a1a1a]/90 backdrop-blur-md border border-[#333] rounded-lg text-gray-400 hover:text-white shadow-xl transition-all hover:scale-105"
                            title="Show Scene List"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
