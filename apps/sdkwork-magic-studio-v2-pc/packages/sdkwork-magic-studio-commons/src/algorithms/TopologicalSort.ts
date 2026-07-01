export class TopologicalSort<T> {
    private graph: Map<T, Set<T>> = new Map();
    private inDegree: Map<T, number> = new Map();

    addNode(node: T): void {
        if (!this.graph.has(node)) {
            this.graph.set(node, new Set());
            this.inDegree.set(node, 0);
        }
    }

    addEdge(from: T, to: T): void {
        this.addNode(from);
        this.addNode(to);

        const edges = this.graph.get(from)!;
        if (!edges.has(to)) {
            edges.add(to);
            this.inDegree.set(to, (this.inDegree.get(to) || 0) + 1);
        }
    }

    sort(): T[] {
        const result: T[] = [];
        const queue: T[] = [];
        const inDegreeCopy = new Map(this.inDegree);

        for (const [node, degree] of inDegreeCopy) {
            if (degree === 0) {
                queue.push(node);
            }
        }

        while (queue.length > 0) {
            const node = queue.shift()!;
            result.push(node);

            for (const neighbor of this.graph.get(node) || []) {
                const newDegree = (inDegreeCopy.get(neighbor) || 0) - 1;
                inDegreeCopy.set(neighbor, newDegree);
                if (newDegree === 0) {
                    queue.push(neighbor);
                }
            }
        }

        if (result.length !== this.graph.size) {
            throw new Error('Graph contains a cycle');
        }

        return result;
    }

    hasCycle(): boolean {
        try {
            this.sort();
            return false;
        } catch {
            return true;
        }
    }

    getDependencies(node: T): T[] {
        const deps: T[] = [];
        
        for (const [from, tos] of this.graph) {
            if (tos.has(node)) {
                deps.push(from);
            }
        }

        return deps;
    }

    getDependents(node: T): T[] {
        return [...(this.graph.get(node) || [])];
    }

    clear(): void {
        this.graph.clear();
        this.inDegree.clear();
    }
}
