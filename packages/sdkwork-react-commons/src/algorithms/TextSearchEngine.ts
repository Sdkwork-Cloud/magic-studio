export interface TextSearchResult {
    id: string;
    text: string;
    score: number;
    highlights: { start: number; end: number }[];
}

export interface TextSearchOptions {
    fields?: string[];
    weights?: Record<string, number>;
}

export class TextSearchEngine<T extends { id: string }> {
    private documents: Map<string, T> = new Map();
    private invertedIndex: Map<string, Set<string>> = new Map();
    private options: TextSearchOptions;

    constructor(options?: TextSearchOptions) {
        this.options = options || {};
    }

    add(doc: T): void {
        this.documents.set(doc.id, doc);
        this.indexDocument(doc);
    }

    remove(id: string): void {
        const doc = this.documents.get(id);
        if (doc) {
            this.documents.delete(id);
            this.deindexDocument(doc);
        }
    }

    update(doc: T): void {
        this.remove(doc.id);
        this.add(doc);
    }

    search(query: string, options?: { fuzzy?: boolean; maxResults?: number }): TextSearchResult[] {
        const terms = this.tokenize(query);
        const results: Map<string, { doc: T; score: number; matches: Set<string> }> = new Map();

        for (const term of terms) {
            const matchingDocs = this.findMatchingDocs(term, options?.fuzzy);
            
            for (const docId of matchingDocs) {
                const doc = this.documents.get(docId);
                if (!doc) continue;

                if (!results.has(docId)) {
                    results.set(docId, { doc, score: 0, matches: new Set() });
                }

                const result = results.get(docId)!;
                result.score += this.calculateScore(term, doc, options?.fuzzy);
                result.matches.add(term);
            }
        }

        const sortedResults = [...results.values()]
            .sort((a, b) => b.score - a.score)
            .slice(0, options?.maxResults || 50);

        return sortedResults.map(r => ({
            id: r.doc.id,
            text: this.getSearchableText(r.doc),
            score: r.score,
            highlights: this.findHighlights(this.getSearchableText(r.doc), [...r.matches])
        }));
    }

    getDocument(id: string): T | undefined {
        return this.documents.get(id);
    }

    getAllDocuments(): T[] {
        return [...this.documents.values()];
    }

    clear(): void {
        this.documents.clear();
        this.invertedIndex.clear();
    }

    private getSearchableText(doc: T): string {
        const fields = this.options.fields || ['content'];
        const texts: string[] = [];
        
        for (const field of fields) {
            const value = (doc as any)[field];
            if (typeof value === 'string') {
                texts.push(value);
            }
        }
        
        return texts.join(' ');
    }

    private indexDocument(doc: T): void {
        const text = this.getSearchableText(doc);
        const terms = this.tokenize(text);
        
        for (const term of terms) {
            if (!this.invertedIndex.has(term)) {
                this.invertedIndex.set(term, new Set());
            }
            this.invertedIndex.get(term)!.add(doc.id);
        }
    }

    private deindexDocument(doc: T): void {
        const text = this.getSearchableText(doc);
        const terms = this.tokenize(text);
        
        for (const term of terms) {
            const docs = this.invertedIndex.get(term);
            if (docs) {
                docs.delete(doc.id);
                if (docs.size === 0) {
                    this.invertedIndex.delete(term);
                }
            }
        }
    }

    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 0);
    }

    private findMatchingDocs(term: string, fuzzy?: boolean): Set<string> {
        const exact = this.invertedIndex.get(term);
        if (exact) return exact;

        if (fuzzy) {
            const results = new Set<string>();
            for (const [key, docs] of this.invertedIndex) {
                if (this.fuzzyMatch(term, key)) {
                    docs.forEach(d => results.add(d));
                }
            }
            return results;
        }

        return new Set();
    }

    private fuzzyMatch(a: string, b: string): boolean {
        if (Math.abs(a.length - b.length) > 2) return false;
        return a.includes(b) || b.includes(a) || this.levenshteinDistance(a, b) <= 2;
    }

    private levenshteinDistance(a: string, b: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    private calculateScore(term: string, doc: T, _fuzzy?: boolean): number {
        const text = this.getSearchableText(doc);
        const lowerContent = text.toLowerCase();
        const termLower = term.toLowerCase();
        
        let score = 1;
        
        const exactMatch = lowerContent.includes(termLower);
        if (exactMatch) {
            score += 2;
            const regex = new RegExp(termLower, 'gi');
            const matches = text.match(regex);
            if (matches) {
                score += matches.length;
            }
        }

        const wordBoundary = new RegExp(`\\b${termLower}\\b`, 'i').test(text);
        if (wordBoundary) {
            score += 1;
        }

        if (this.options.weights) {
            const fields = this.options.fields || [];
            for (const field of fields) {
                const value = (doc as any)[field];
                if (typeof value === 'string' && value.toLowerCase().includes(termLower)) {
                    score += this.options.weights[field] || 1;
                }
            }
        }

        return score;
    }

    private findHighlights(content: string, terms: string[]): { start: number; end: number }[] {
        const highlights: { start: number; end: number }[] = [];
        const lowerContent = content.toLowerCase();

        for (const term of terms) {
            let pos = 0;
            const termLower = term.toLowerCase();
            
            while ((pos = lowerContent.indexOf(termLower, pos)) !== -1) {
                highlights.push({ start: pos, end: pos + term.length });
                pos += term.length;
            }
        }

        return this.mergeHighlights(highlights);
    }

    private mergeHighlights(highlights: { start: number; end: number }[]): { start: number; end: number }[] {
        if (highlights.length === 0) return [];
        
        highlights.sort((a, b) => a.start - b.start);
        const merged: { start: number; end: number }[] = [highlights[0]];

        for (let i = 1; i < highlights.length; i++) {
            const current = highlights[i];
            const last = merged[merged.length - 1];

            if (current.start <= last.end) {
                last.end = Math.max(last.end, current.end);
            } else {
                merged.push(current);
            }
        }

        return merged;
    }
}
