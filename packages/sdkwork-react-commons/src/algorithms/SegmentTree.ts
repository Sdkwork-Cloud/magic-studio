export class SegmentTree<T = number> {
    private tree: T[];
    private n: number;
    private merge: (a: T, b: T) => T;
    private defaultValue: T;

    constructor(
        data: T[],
        merge: (a: T, b: T) => T,
        defaultValue: T
    ) {
        this.n = data.length;
        this.merge = merge;
        this.defaultValue = defaultValue;
        this.tree = new Array(4 * this.n).fill(defaultValue);
        this.build(data, 1, 0, this.n - 1);
    }

    private build(data: T[], node: number, start: number, end: number): void {
        if (start === end) {
            this.tree[node] = data[start];
            return;
        }

        const mid = Math.floor((start + end) / 2);
        this.build(data, 2 * node, start, mid);
        this.build(data, 2 * node + 1, mid + 1, end);
        this.tree[node] = this.merge(this.tree[2 * node], this.tree[2 * node + 1]);
    }

    update(index: number, value: T): void {
        this.updateNode(1, 0, this.n - 1, index, value);
    }

    private updateNode(node: number, start: number, end: number, index: number, value: T): void {
        if (start === end) {
            this.tree[node] = value;
            return;
        }

        const mid = Math.floor((start + end) / 2);
        if (index <= mid) {
            this.updateNode(2 * node, start, mid, index, value);
        } else {
            this.updateNode(2 * node + 1, mid + 1, end, index, value);
        }
        this.tree[node] = this.merge(this.tree[2 * node], this.tree[2 * node + 1]);
    }

    query(left: number, right: number): T {
        return this.queryNode(1, 0, this.n - 1, left, right);
    }

    private queryNode(node: number, start: number, end: number, left: number, right: number): T {
        if (right < start || left > end) {
            return this.defaultValue;
        }

        if (left <= start && end <= right) {
            return this.tree[node];
        }

        const mid = Math.floor((start + end) / 2);
        const leftResult = this.queryNode(2 * node, start, mid, left, right);
        const rightResult = this.queryNode(2 * node + 1, mid + 1, end, left, right);
        return this.merge(leftResult, rightResult);
    }
}
