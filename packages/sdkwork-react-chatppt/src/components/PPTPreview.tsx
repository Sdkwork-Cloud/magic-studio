
import React from 'react';
import { useChatPPTStore } from '../store/chatPPTStore';
import { Plus, LayoutTemplate, Play, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export const PPTPreview: React.FC = () => {
    const { activePresentation, currentSlide, activeSlideIndex, selectSlide, addSlide, isGenerating } = useChatPPTStore();

    if (!activePresentation) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center text-gray-500 bg-[#09090b]">
                <LayoutTemplate size={48} className="opacity-20 mb-4" />
                <p>Select or create a presentation to start.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-[#1e1e1e]">
            {/* Toolbar */}
            <div className="h-12 border-b border-[#333] flex items-center justify-between px-4 bg-[#252526]">
                <div className="flex items-center gap-4">
                    <h2 className="font-bold text-gray-200 text-sm">{activePresentation.title}</h2>
                    <div className="h-4 w-[1px] bg-[#444]" />
                    <span className="text-xs text-gray-500">Slide {activeSlideIndex + 1} of {activePresentation.slides.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => addSlide()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition-colors"
                    >
                        <Plus size={14} /> Add Slide
                    </button>
                    <button className="p-2 hover:bg-[#333] rounded-md text-gray-400 hover:text-white">
                        <Play size={14} />
                    </button>
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Thumbnails Sidebar (Left of Preview) */}
                <div className="w-48 bg-[#18181b] border-r border-[#333] flex flex-col overflow-y-auto p-4 gap-4">
                    {activePresentation.slides.map((slide, idx) => (
                        <div 
                            key={slide.id}
                            onClick={() => selectSlide(idx)}
                            className={`
                                relative aspect-video bg-white rounded-md cursor-pointer border-2 transition-all group
                                ${idx === activeSlideIndex ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-gray-500'}
                            `}
                        >
                            <div className="absolute top-2 left-2 text-[8px] text-black font-bold truncate max-w-[80%]">{slide.title}</div>
                            <div className="absolute bottom-1 left-2 text-[8px] text-gray-400 font-mono">{idx + 1}</div>
                        </div>
                    ))}
                    <button 
                        onClick={() => addSlide()}
                        className="aspect-video border-2 border-dashed border-[#333] hover:border-[#555] rounded-md flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-[#111] flex items-center justify-center relative p-8">
                    {isGenerating && (
                        <div className="absolute top-4 right-4 z-50 bg-purple-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs shadow-lg animate-pulse">
                            <Loader2 size={12} className="animate-spin" /> Generating Slides...
                        </div>
                    )}

                    {currentSlide ? (
                        <div className="aspect-video w-full max-w-4xl bg-white text-black shadow-2xl relative p-8 flex flex-col">
                            {/* Primitive Renderer */}
                            {currentSlide.elements.map(el => (
                                <div 
                                    key={el.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${el.x}%`,
                                        top: `${el.y}%`,
                                        width: el.width ? `${el.width}%` : 'auto',
                                        height: el.height ? `${el.height}%` : 'auto',
                                        ...el.style
                                    }}
                                >
                                    {el.type === 'image' ? (
                                        <img src={el.content} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="whitespace-pre-wrap">{el.content}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500">Select a slide</div>
                    )}
                </div>

            </div>
        </div>
    );
};
