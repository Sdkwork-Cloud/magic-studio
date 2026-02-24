export interface Interval {
    start: number;
    end: number;
    id?: string;
    data?: any;
}

export class TrackIntervalIndex {
    private intervals: Map<string, Interval> = new Map();
    private sortedByStart: Interval[] = [];

    insert(interval: Interval): void {
        const id = interval.id || this.generateId();
        interval.id = id;
        this.intervals.set(id, interval);
        this.rebuildIndex();
    }

    remove(id: string): boolean {
        const removed = this.intervals.delete(id);
        if (removed) {
            this.rebuildIndex();
        }
        return removed;
    }

    get(id: string): Interval | undefined {
        return this.intervals.get(id);
    }

    queryOverlapping(start: number, end: number): Interval[] {
        const results: Interval[] = [];
        
        for (const interval of this.sortedByStart) {
            if (interval.start > end) break;
            if (interval.end >= start) {
                results.push(interval);
            }
        }
        
        return results;
    }

    queryAtPoint(point: number): Interval[] {
        return this.queryOverlapping(point, point);
    }

    queryInRange(start: number, end: number): Interval[] {
        return this.queryOverlapping(start, end);
    }

    checkCollision(start: number, end: number, excludeIds?: Set<string>): Interval | null {
        for (const interval of this.sortedByStart) {
            if (interval.start > end) break;
            if (excludeIds && interval.id && excludeIds.has(interval.id)) continue;
            if (interval.end > start && interval.start < end) {
                return interval;
            }
        }
        return null;
    }

    findNearest(point: number): { before: Interval | null; after: Interval | null } {
        let before: Interval | null = null;
        let after: Interval | null = null;

        for (const interval of this.sortedByStart) {
            if (interval.end < point) {
                before = interval;
            } else if (interval.start > point && !after) {
                after = interval;
                break;
            }
        }

        return { before, after };
    }

    getAll(): Interval[] {
        return [...this.sortedByStart];
    }

    clear(): void {
        this.intervals.clear();
        this.sortedByStart = [];
    }

    get size(): number {
        return this.intervals.size;
    }

    private rebuildIndex(): void {
        this.sortedByStart = [...this.intervals.values()].sort((a, b) => a.start - b.start);
    }

    private generateId(): string {
        return `interval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
