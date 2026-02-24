export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

interface QuadNode {
    bounds: Rect;
    items: { bounds: Rect; data: any }[];
    children: QuadNode[] | null;
    depth: number;
}

const MAX_ITEMS = 4;
const MAX_DEPTH = 8;

export class QuadTree {
    private root: QuadNode;

    constructor(bounds: Rect) {
        this.root = this.createNode(bounds, 0);
    }

    private createNode(bounds: Rect, depth: number): QuadNode {
        return {
            bounds,
            items: [],
            children: null,
            depth
        };
    }

    private subdivide(node: QuadNode): void {
        if (node.children || node.depth >= MAX_DEPTH) return;

        const { x, y, width, height } = node.bounds;
        const halfW = width / 2;
        const halfH = height / 2;

        node.children = [
            this.createNode({ x, y, width: halfW, height: halfH }, node.depth + 1),
            this.createNode({ x: x + halfW, y, width: halfW, height: halfH }, node.depth + 1),
            this.createNode({ x, y: y + halfH, width: halfW, height: halfH }, node.depth + 1),
            this.createNode({ x: x + halfW, y: y + halfH, width: halfW, height: halfH }, node.depth + 1)
        ];

        for (const item of node.items) {
            for (const child of node.children!) {
                if (this.intersects(item.bounds, child.bounds)) {
                    child.items.push(item);
                }
            }
        }
        node.items = [];
    }

    insert(bounds: Rect, data: any): void {
        this.insertNode(this.root, bounds, data);
    }

    private insertNode(node: QuadNode, bounds: Rect, data: any): void {
        if (!this.intersects(bounds, node.bounds)) return;

        if (node.children) {
            for (const child of node.children) {
                this.insertNode(child, bounds, data);
            }
            return;
        }

        node.items.push({ bounds, data });

        if (node.items.length > MAX_ITEMS && node.depth < MAX_DEPTH) {
            this.subdivide(node);
        }
    }

    query(bounds: Rect): any[] {
        const results: any[] = [];
        this.queryNode(this.root, bounds, results);
        return results;
    }

    private queryNode(node: QuadNode, bounds: Rect, results: any[]): void {
        if (!this.intersects(bounds, node.bounds)) return;

        if (node.children) {
            for (const child of node.children) {
                this.queryNode(child, bounds, results);
            }
        } else {
            for (const item of node.items) {
                if (this.intersects(bounds, item.bounds)) {
                    results.push(item.data);
                }
            }
        }
    }

    private intersects(a: Rect, b: Rect): boolean {
        return !(
            a.x + a.width < b.x ||
            b.x + b.width < a.x ||
            a.y + a.height < b.y ||
            b.y + b.height < a.y
        );
    }

    clear(): void {
        this.root.items = [];
        this.root.children = null;
    }
}
