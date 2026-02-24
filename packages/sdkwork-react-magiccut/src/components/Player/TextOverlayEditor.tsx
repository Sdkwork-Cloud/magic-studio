import { CutClip } from '../../entities/magicCut.entity'
import React, { useEffect, useRef } from 'react';
import { usePlayerContext } from './UniversalPlayer';
import { textRenderer, TextStyle, DEFAULT_TEXT_STYLE } from '../../engine/text/TextRenderer';
import { useMagicCutStore } from '../../store/magicCutStore';

interface TextOverlayEditorProps {
    clip: CutClip;
    onChange: (text: string) => void;
    onBlur?: () => void;
}

export const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({ clip, onChange, onBlur }) => {
    const { projectToScreen, scale } = usePlayerContext();
    const { updateClipTransform, state } = useMagicCutStore();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const resource = state.resources[clip.resource.id];
    
    // Merge styles
    const clipStyle = clip.style || {};
    const baseMeta = (resource as any).metadata || {};
    
    const getStyle = (key: keyof TextStyle) => {
        return clipStyle[key] ?? baseMeta[key] ?? DEFAULT_TEXT_STYLE[key];
    };

    const tf = clip.transform || { x: 0, y: 0, width: 1920, height: 1080, rotation: 0, scale: 1, opacity: 1 };
    const screenPos = projectToScreen(tf.x, tf.y);
    const screenW = tf.width * (tf.scale || 1) * scale;
    const screenH = tf.height * (tf.scale || 1) * scale;
    
    const RENDER_SCALE = (tf.scale || 1) * scale;

    const fontSize = (getStyle('fontSize') as number) * RENDER_SCALE;
    const padding = (getStyle('backgroundPadding') as number) * RENDER_SCALE;
    const textAlign = getStyle('textAlign') as 'left'|'center'|'right';
    const lineHeight = getStyle('lineHeight') as number;
    
    const strokeWidth = (getStyle('strokeWidth') as number) * RENDER_SCALE;
    const strokeColor = getStyle('strokeColor') as string;
    
    // Simulate stroke using text-shadow for DOM preview
    const shadowColor = strokeWidth > 0 ? strokeColor : 'transparent';
    // Robust outline simulation
    const textShadow = strokeWidth > 0 
        ? `
            -${strokeWidth}px -${strokeWidth}px 0 ${shadowColor}, 
             ${strokeWidth}px -${strokeWidth}px 0 ${shadowColor}, 
            -${strokeWidth}px  ${strokeWidth}px 0 ${shadowColor}, 
             ${strokeWidth}px  ${strokeWidth}px 0 ${shadowColor}
          ` 
        : 'none';

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        onChange(newText);
        
        // Re-measure
        // Construct style object same as renderer
        const measureStyle: TextStyle = {
             fontFamily: getStyle('fontFamily'),
             fontSize: getStyle('fontSize'),
             fontWeight: getStyle('fontWeight'),
             lineHeight: getStyle('lineHeight'),
             backgroundPadding: getStyle('backgroundPadding'),
             strokeWidth: getStyle('strokeWidth'),
             shadowBlur: getStyle('shadowBlur'),
             shadowOffsetX: getStyle('shadowOffsetX'),
             shadowOffsetY: getStyle('shadowOffsetY'),
             // We only need layout metrics here
             color: '#fff',
             textAlign: textAlign,
             backgroundColor: getStyle('backgroundColor')
        };
        
        const { width: newWidth, height: newHeight } = textRenderer.measure(newText, measureStyle);
        
        if (newWidth !== tf.width || newHeight !== tf.height) {
            updateClipTransform(clip.id, { width: newWidth, height: newHeight }, true);
        }
    };

    return (
        <div
            className="absolute z-[60] pointer-events-auto"
            style={{
                left: screenPos.x,
                top: screenPos.y,
                width: screenW,
                height: screenH,
                transform: `rotate(${tf.rotation || 0}deg)`,
                transformOrigin: 'center center',
                display: 'flex',
                alignItems: 'center', 
                justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
            }}
            onMouseDown={e => e.stopPropagation()} 
        >
            {/* Background Layer Simulation */}
            {getStyle('backgroundColor') && getStyle('backgroundColor') !== 'transparent' && (
                <div 
                    className="absolute z-0 pointer-events-none"
                    style={{
                        backgroundColor: getStyle('backgroundColor'),
                        borderRadius: (getStyle('backgroundCornerRadius') as number) * RENDER_SCALE,
                        // Center the background box based on content size? 
                        // Actually, the textarea fills the clip dims, and clip dims INCLUDE padding.
                        // So background fills the container.
                        inset: 0
                    }}
                />
            )}
            
            <textarea
                ref={textareaRef}
                value={clip.content || 'Text'}
                onChange={handleChange}
                onKeyDown={(e) => e.stopPropagation()}
                onBlur={onBlur}
                className="relative z-10 w-full h-full bg-transparent outline-none resize-none overflow-hidden"
                style={{
                    color: getStyle('color'),
                    fontFamily: getStyle('fontFamily'),
                    fontSize: `${Math.max(1, fontSize)}px`,
                    fontWeight: getStyle('fontWeight'),
                    fontStyle: getStyle('fontStyle'),
                    textAlign: textAlign,
                    lineHeight: lineHeight,
                    padding: `${padding}px`,
                    // Shadow simulation for stroke
                    textShadow: textShadow,
                    boxSizing: 'border-box',
                    whiteSpace: 'pre-wrap'
                }}
                spellCheck={false}
            />
        </div>
    );
};
