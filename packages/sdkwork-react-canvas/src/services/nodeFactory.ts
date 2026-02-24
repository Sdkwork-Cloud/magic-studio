
;
import { CanvasElement, CanvasElementType, CanvasNodeData } from '../entities/canvas.entity';
import { generateUUID, MediaResourceType } from 'sdkwork-react-commons';
import { textRenderer, TextStyle } from 'sdkwork-react-magiccut';

// --- 1. The Strategy Interface (The Contract) ---
export interface INodeCreationStrategy {
    readonly type: CanvasElementType;
    
    /** Returns default width and height for this node type */
    getDimensions(content?: string): { width: number; height: number };
    
    /** Returns default style object */
    getStyle(): Record<string, any>;
    
    /** Returns default color */
    getColor(): string;
    
    /** Returns default resource object if any */
    createResource(id: string, content?: string): any;
    
    /** Returns specific data structure for this node type */
    getInitialData(): CanvasNodeData;
}

// --- 2. Concrete Strategies (The Implementation) ---

class ImageNodeStrategy implements INodeCreationStrategy {
    readonly type = 'image';
    getDimensions() { return { width: 512, height: 288 }; } // 16:9
    getStyle() { return {}; }
    getColor() { return '#18181b'; }
    createResource(id: string) {
        return {
            id: generateUUID(),
            uuid: generateUUID(),
            type: MediaResourceType.IMAGE,
            name: 'Image',
            url: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }
    getInitialData(): CanvasNodeData {
        return { aspectRatio: '16:9', status: 'idle' };
    }
}

class VideoNodeStrategy implements INodeCreationStrategy {
    readonly type = 'video';
    getDimensions() { return { width: 512, height: 288 }; } // 16:9
    getStyle() { return {}; }
    getColor() { return '#18181b'; }
    createResource(id: string) {
        return {
            id: generateUUID(),
            uuid: generateUUID(),
            type: MediaResourceType.VIDEO,
            name: 'Video',
            url: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }
    getInitialData(): CanvasNodeData {
        return { aspectRatio: '16:9', resolution: '1080p', duration: '5s', status: 'idle' };
    }
}

class TextNodeStrategy implements INodeCreationStrategy {
    readonly type = 'text';
    getDimensions(content: string = 'Double click to edit') { 
        // Auto-measure initial size
        const measure = textRenderer.measure(content, {
            fontFamily: 'Inter, sans-serif',
            fontSize: 60, // Default Font Size
            color: '#ffffff',
            fontWeight: 'bold'
        });
        return measure; 
    }
    getStyle() { return { fontSize: 60, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter, sans-serif' }; }
    getColor() { return 'transparent'; }
    createResource(id: string, content: string = 'Double click to edit') {
        return {
            id: generateUUID(),
            uuid: generateUUID(),
            type: MediaResourceType.TEXT,
            name: 'Text',
            metadata: { 
                text: content,
                fontSize: 60,
                fontFamily: 'Inter, sans-serif',
                color: '#ffffff',
                fontWeight: 'bold'
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }
    getInitialData(): CanvasNodeData { return {}; }
}

class StickyNoteStrategy implements INodeCreationStrategy {
    readonly type = 'note';
    getDimensions() { return { width: 240, height: 240 }; }
    getStyle() { return { color: '#000000', fontSize: '18px' }; }
    getColor() { return '#fef3c7'; } // Classic Post-it yellow
    createResource(id: string, content: string = 'New Idea') {
         return {
            id: generateUUID(),
            uuid: generateUUID(),
            type: MediaResourceType.TEXT,
            name: 'Note',
            metadata: { text: content, fontSize: 18, color: '#000000' },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }
    getInitialData(): CanvasNodeData { return {}; }
}

class ShapeStrategy implements INodeCreationStrategy {
    readonly type = 'shape';
    getDimensions() { return { width: 200, height: 200 }; }
    getStyle() { return { borderRadius: '16px', border: '2px solid #555' }; }
    getColor() { return '#18181b'; }
    createResource() { return undefined; }
    getInitialData(): CanvasNodeData { return {}; }
}

class GroupStrategy implements INodeCreationStrategy {
    readonly type = 'group';
    getDimensions() { return { width: 400, height: 300 }; }
    getStyle() { return { border: '1px dashed rgba(255,255,255,0.2)' }; }
    getColor() { return 'rgba(255,255,255,0.05)'; }
    createResource() { return undefined; }
    getInitialData(): CanvasNodeData { return { label: 'Group' }; }
}

class ConnectorStrategy implements INodeCreationStrategy {
    readonly type = 'connector';
    getDimensions() { return { width: 100, height: 1 }; }
    getStyle() { return {}; }
    getColor() { return '#666'; }
    createResource() { return undefined; }
    getInitialData(): CanvasNodeData { return {}; }
}

// --- 3. The Registry (The Manager) ---
class NodeStrategyRegistry {
    private strategies = new Map<CanvasElementType, INodeCreationStrategy>();

    constructor() {
        this.register(new ImageNodeStrategy());
        this.register(new VideoNodeStrategy());
        this.register(new TextNodeStrategy());
        this.register(new StickyNoteStrategy());
        this.register(new ShapeStrategy());
        this.register(new GroupStrategy());
        this.register(new ConnectorStrategy());
    }

    public register(strategy: INodeCreationStrategy) {
        this.strategies.set(strategy.type, strategy);
    }

    public get(type: CanvasElementType): INodeCreationStrategy {
        const strategy = this.strategies.get(type);
        if (!strategy) {
            console.warn(`No strategy found for node type: ${type}, falling back to Shape.`);
            return this.strategies.get('shape')!;
        }
        return strategy;
    }
}

const registry = new NodeStrategyRegistry();

// --- 4. The Factory (The Facade) ---

export interface CreateNodeOptions {
    type: CanvasElementType;
    x: number;
    y: number;
    
    // Optional overrides
    width?: number;
    height?: number;
    content?: string;
    data?: Partial<CanvasNodeData>;
    style?: Record<string, any>;
}

export class NodeFactory {
    private static nextZIndex = 0;

    static create(options: CreateNodeOptions): CanvasElement {
        const { type, x, y } = options;
        const strategy = registry.get(type);

        const id = generateUUID();
        const defaultStyle = strategy.getStyle();
        const defaultData = strategy.getInitialData();
        const defaultColor = strategy.getColor();
        
        // Initialize Resource first to get content-aware dimensions for Text
        let resource = strategy.createResource(id, options.content);
        
        // Migrate legacy content option if provided
        if (options.content) {
             if (type === 'image' || type === 'video') {
                if (!resource) resource = strategy.createResource(id); // Ensure resource exists
                resource.url = options.content;
            }
        }

        // Get default dims, potentially based on content
        const defaultDims = strategy.getDimensions(options.content);
        const width = options.width || defaultDims.width;
        const height = options.height || defaultDims.height;

        return {
            id,
            type,
            x,
            y,
            width,
            height,
            zIndex: NodeFactory.nextZIndex++,
            resource,
            color: defaultColor,
            style: { ...defaultStyle, ...options.style },
            data: { ...defaultData, ...options.data },   
            selected: true, 
            groupChildren: []    
        };
    }

    static registerCustomNode(strategy: INodeCreationStrategy) {
        registry.register(strategy);
    }
}
