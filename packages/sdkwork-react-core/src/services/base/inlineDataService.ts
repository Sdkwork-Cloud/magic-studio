export interface InlineDataService {
    tryExtractInlineData(source: string): Promise<Uint8Array | undefined>;
    fetchText(url: string): Promise<string>;
}

class InlineDataServiceImpl implements InlineDataService {
    private decodeDataUri(source: string): Uint8Array | undefined {
        if (!source.startsWith('data:')) {
            return undefined;
        }

        const comma = source.indexOf(',');
        if (comma < 0) {
            return undefined;
        }

        try {
            const base64 = source.slice(comma + 1);
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i += 1) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        } catch (error) {
            console.warn('[inlineDataService] Failed to decode data URI', error);
            return undefined;
        }
    }

    async tryExtractInlineData(source: string): Promise<Uint8Array | undefined> {
        if (!source) {
            return undefined;
        }

        const decoded = this.decodeDataUri(source);
        if (decoded) {
            return decoded;
        }

        if (source.startsWith('blob:')) {
            const response = await fetch(source);
            return new Uint8Array(await response.arrayBuffer());
        }

        return undefined;
    }

    async fetchText(url: string): Promise<string> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch text content (${response.status})`);
        }
        return response.text();
    }
}

export const inlineDataService: InlineDataService = new InlineDataServiceImpl();
