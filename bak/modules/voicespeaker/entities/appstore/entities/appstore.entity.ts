
export interface AppStoreItem {
    id: string;
    name: string;
    description: string;
    author: string;
    downloads: string;
    isInstalled: boolean;
    category: string;
    version?: string;
    rating?: number;
    tags?: string[];
}
