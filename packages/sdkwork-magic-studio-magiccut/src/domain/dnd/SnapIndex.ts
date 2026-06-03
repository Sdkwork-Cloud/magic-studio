
/**
 * SnapIndex
 * A high-performance, read-optimized index for finding the nearest snap point.
 * Uses binary search on a sorted Float64Array for O(log N) queries.
 */
export class SnapIndex {
    private points: Float64Array;

    constructor(points: number[]) {
        // 1. Deduplicate
        const uniquePoints = new Set(points);
        
        // 2. Sort
        const sorted = Array.from(uniquePoints).sort((a, b) => a - b);
        
        // 3. Store as TypedArray for memory efficiency and speed
        this.points = new Float64Array(sorted);
    }

    /**
     * Finds the single closest point within the threshold.
     * @param value The time to snap
     * @param threshold The maximum distance allowed
     */
    getNearest(value: number, threshold: number): number | null {
        if (this.points.length === 0) return null;

        // Binary Search to find insertion index
        let low = 0;
        let high = this.points.length - 1;
        
        // Find approximate position
        while (low <= high) {
            const mid = (low + high) >>> 1;
            const midVal = this.points[mid];

            if (midVal < value) {
                low = mid + 1;
            } else if (midVal > value) {
                high = mid - 1;
            } else {
                return midVal; // Exact match
            }
        }
        
        // 'low' is the insertion point. Check neighbors (low and low-1)
        let bestPoint: number | null = null;
        let minDiff = Infinity;

        // Check neighbor at low
        if (low < this.points.length) {
            const diff = Math.abs(this.points[low] - value);
            if (diff < minDiff) {
                minDiff = diff;
                bestPoint = this.points[low];
            }
        }

        // Check neighbor at low - 1
        if (low > 0) {
            const diff = Math.abs(this.points[low - 1] - value);
            if (diff < minDiff) {
                minDiff = diff;
                bestPoint = this.points[low - 1];
            }
        }

        return minDiff <= threshold ? bestPoint : null;
    }
}

