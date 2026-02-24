
export interface TextStyle {
    fontFamily: string;
    fontSize: number;
    color: string;
    fontWeight?: string | number;
    fontStyle?: 'normal' | 'italic';
    textAlign?: 'left' | 'center' | 'right';
    
    // Stroke / Outline
    strokeColor?: string;
    strokeWidth?: number;
    
    // Shadow
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    
    // Layout
    lineHeight?: number;
    letterSpacing?: number;
    
    // Background Plate
    backgroundColor?: string;
    backgroundPadding?: number;
    backgroundCornerRadius?: number;
    
    // Advanced
    gradient?: string[]; 
    animationProgress?: number;
    highlightColor?: string;
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 80, 
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 1.2,
    letterSpacing: 0,
    strokeColor: '#000000',
    strokeWidth: 0,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    backgroundPadding: 20,
    backgroundCornerRadius: 10
};

export class TextRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor() {
        this.canvas = document.createElement('canvas');
        const ctx = this.canvas.getContext('2d', { alpha: true });
        if (!ctx) throw new Error("Failed to create 2D context for text rendering");
        this.ctx = ctx;
    }

    private setupContext(style: TextStyle) {
        const fontSize = style.fontSize || DEFAULT_TEXT_STYLE.fontSize;
        const fontFamily = style.fontFamily || DEFAULT_TEXT_STYLE.fontFamily;
        const fontWeight = style.fontWeight || DEFAULT_TEXT_STYLE.fontWeight;
        const fontStyle = style.fontStyle || 'normal';
        this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        
        // Apply letter spacing if supported (Modern Browsers)
        const spacing = style.letterSpacing !== undefined ? style.letterSpacing : (DEFAULT_TEXT_STYLE.letterSpacing || 0);
        if ('letterSpacing' in this.ctx) {
            (this.ctx as any).letterSpacing = `${spacing}em`;
        }
    }

    /**
     * Measures the precise dimensions needed to render the text without clipping.
     * Takes into account strokes, shadows, and padding.
     */
    public measure(text: string, style: TextStyle = DEFAULT_TEXT_STYLE): { width: number, height: number } {
        this.setupContext(style);
        
        const lines = text.split('\n');
        let maxTextWidth = 0;
        
        lines.forEach(line => {
            const metrics = this.ctx.measureText(line);
            // More robust width measurement
            const w = Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight);
            const finalW = Math.max(w, metrics.width);
            if (finalW > maxTextWidth) maxTextWidth = finalW;
        });

        const fontSize = style.fontSize || 80;
        const lineHeight = (style.lineHeight || 1.2) * fontSize;
        const totalTextHeight = lines.length * lineHeight;
        
        // Metrics Logic:
        // Canvas size must accommodate:
        // 1. Text Size
        // 2. Stroke Width (half extends outside)
        // 3. Shadow Offset & Blur
        // 4. Background Padding
        
        const stroke = (style.strokeWidth || 0);
        const shadowX = Math.abs(style.shadowOffsetX || 0);
        const shadowY = Math.abs(style.shadowOffsetY || 0);
        const shadowBlur = (style.shadowBlur || 0);
        const shadowBuffer = Math.max(shadowX + shadowBlur, shadowY + shadowBlur);
        
        const bgPadding = (style.backgroundColor && style.backgroundColor !== 'transparent') 
            ? (style.backgroundPadding || 0) * 2 
            : 0;

        // Visual buffer to prevent anti-aliasing clipping
        const safeBuffer = 8;

        const totalWidth = Math.ceil(maxTextWidth + stroke + (shadowBuffer * 2) + bgPadding + safeBuffer);
        const totalHeight = Math.ceil(totalTextHeight + stroke + (shadowBuffer * 2) + bgPadding + safeBuffer);

        return {
            width: Math.max(1, totalWidth),
            height: Math.max(1, totalHeight)
        };
    }

    public render(text: string, style: TextStyle = DEFAULT_TEXT_STYLE): HTMLCanvasElement {
        const { width, height } = this.measure(text, style);

        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        } else {
            this.ctx.clearRect(0, 0, width, height);
        }

        const { ctx } = this;
        this.setupContext(style);

        const lines = text.split('\n');
        const fontSize = style.fontSize || 80;
        const lineHeight = (style.lineHeight || 1.2) * fontSize;
        const totalTextHeight = lines.length * lineHeight;
        
        // Calculate text block alignment center for Background
        const centerX = width / 2;
        const centerY = height / 2;
        
        const startY = centerY - (totalTextHeight / 2) + (lineHeight / 2); // Baseline approx

        // 1. Draw Background Plate (Always Centered in Canvas)
        if (style.backgroundColor && style.backgroundColor !== 'transparent') {
            const bgPadding = style.backgroundPadding || 0;
            
            // Re-measure pure text width for tight background fit
            let maxLineW = 0;
            lines.forEach(l => {
                const metrics = ctx.measureText(l);
                const w = Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight);
                maxLineW = Math.max(maxLineW, Math.max(w, metrics.width));
            });
            
            const bgW = maxLineW + (bgPadding * 2);
            const bgH = totalTextHeight + (bgPadding * 2);
            const bgX = centerX - (bgW / 2);
            const bgY = centerY - (bgH / 2); // True center
            
            ctx.fillStyle = style.backgroundColor;
            
            if (style.backgroundCornerRadius) {
                ctx.beginPath();
                ctx.roundRect(bgX, bgY, bgW, bgH, style.backgroundCornerRadius);
                ctx.fill();
            } else {
                ctx.fillRect(bgX, bgY, bgW, bgH);
            }
        }

        // Setup Text Alignment
        const align = style.textAlign || 'center';
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        
        // Calculate X position based on alignment relative to the Canvas bounds
        // We incorporate padding and stroke width to ensure text doesn't touch edges
        const strokeBuffer = (style.strokeWidth || 0) / 2;
        const shadowBuffer = (style.shadowBlur || 0) + Math.max(Math.abs(style.shadowOffsetX || 0), Math.abs(style.shadowOffsetY || 0));
        const bgPad = (style.backgroundPadding || 0);
        const safeMargin = 4 + strokeBuffer + shadowBuffer;
        
        // If background is present, we align relative to the background box which is centered.
        // If no background, we align relative to canvas edges (which fits text tightly anyway).
        // Actually, since canvas width is calculated to fit everything, we can use center/edges of canvas logic.
        
        let textX = centerX;

        if (align === 'left') {
            // Start from left edge + safety
            // If background exists, text should align to background's internal padding? 
            // Usually text alignment is relative to the text *block* itself.
            // Since our canvas == text block (mostly), we align based on the measuring box.
            
            // Re-calculate the content width to find the left start point relative to center
            // This ensures "left" align looks correct inside the box.
            let maxLineW = 0;
            lines.forEach(l => maxLineW = Math.max(maxLineW, ctx.measureText(l).width));
            
            // Left edge of the text block
            const blockLeft = centerX - (maxLineW / 2);
            textX = blockLeft;
            
            // Override: If strict alignment to container desired
            // But here canvas scales with text. So 'left' just means multiline text aligns to its own left edge.
            // 'Center' means lines center. 'Right' means lines align right.
            // Since we draw at `textX`, and we want lines to share a left anchor:
            // We set textX to the left-most point of the block.
            
        } else if (align === 'right') {
            let maxLineW = 0;
            lines.forEach(l => maxLineW = Math.max(maxLineW, ctx.measureText(l).width));
            const blockRight = centerX + (maxLineW / 2);
            textX = blockRight;
        } else {
            textX = centerX;
        }
        
        // 2. Draw Text (Shadow -> Stroke -> Fill)
        const drawLines = (mode: 'shadow' | 'stroke' | 'fill') => {
            lines.forEach((line, index) => {
                const y = startY + (index * lineHeight);
                
                if (mode === 'shadow' && style.shadowColor && style.shadowBlur !== undefined) {
                    ctx.shadowColor = style.shadowColor;
                    ctx.shadowBlur = style.shadowBlur;
                    ctx.shadowOffsetX = style.shadowOffsetX || 0;
                    ctx.shadowOffsetY = style.shadowOffsetY || 0;
                    ctx.fillStyle = style.color; 
                    ctx.fillText(line, textX, y);
                    // Reset shadow for next passes
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                }
                
                if (mode === 'stroke' && style.strokeWidth && style.strokeWidth > 0) {
                    ctx.lineWidth = style.strokeWidth;
                    ctx.strokeStyle = style.strokeColor || '#000';
                    ctx.lineJoin = 'round';
                    ctx.miterLimit = 2;
                    ctx.strokeText(line, textX, y);
                }
                
                if (mode === 'fill') {
                    if (style.gradient && style.gradient.length > 1) {
                        const grad = ctx.createLinearGradient(0, startY - lineHeight, 0, startY + totalTextHeight);
                        style.gradient.forEach((c, i) => grad.addColorStop(i / (style.gradient!.length - 1), c));
                        ctx.fillStyle = grad;
                    } else {
                        ctx.fillStyle = style.color;
                    }
                    ctx.fillText(line, textX, y);
                }
            });
        };

        // Order matters: Shadow -> Stroke -> Fill
        if (style.shadowColor && style.shadowBlur && style.shadowBlur > 0) drawLines('shadow');
        if (style.strokeWidth && style.strokeWidth > 0) drawLines('stroke');
        drawLines('fill');

        return this.canvas;
    }
}

export const textRenderer = new TextRenderer();
