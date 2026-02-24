
import { AppStoreItem } from '../entities/appstore.entity';
import { ServiceResult, Result } from '../../../../../types/core';

const MOCK_APPS: AppStoreItem[] = [
    { 
        id: 'zen-writer', 
        name: 'Zen Writer', 
        description: 'A distraction-free writing environment with ambient sounds and minimalist UI.', 
        author: 'MindfulApps', 
        downloads: '250k', 
        isInstalled: true, 
        category: 'Productivity',
        version: '2.4.0',
        rating: 4.8
    },
    { 
        id: 'kanban-board', 
        name: 'Kanban Board', 
        description: 'Visualize your work, limit work-in-progress, and maximize efficiency.', 
        author: 'AgileTools', 
        downloads: '180k', 
        isInstalled: false, 
        category: 'Productivity',
        version: '1.2.5',
        rating: 4.6
    },
    { 
        id: 'json-viewer', 
        name: 'JSON Viewer Pro', 
        description: 'Visualize, format, and edit JSON data with ease.', 
        author: 'DevUtils', 
        downloads: '500k', 
        isInstalled: true, 
        category: 'Development',
        version: '3.0.1',
        rating: 4.9
    },
    { 
        id: 'pomodoro', 
        name: 'Focus Timer', 
        description: 'Boost your productivity with the Pomodoro Technique.', 
        author: 'TimeMaster', 
        downloads: '320k', 
        isInstalled: false, 
        category: 'Utilities',
        version: '1.0.0',
        rating: 4.7
    },
    { 
        id: 'pixel-art', 
        name: 'Pixel Art Studio', 
        description: 'Create beautiful pixel art sprites and animations.', 
        author: 'RetroCreatives', 
        downloads: '120k', 
        isInstalled: false, 
        category: 'Creative',
        version: '2.1.0',
        rating: 4.5
    },
    { 
        id: 'meeting-notes', 
        name: 'Meeting Notes', 
        description: 'Templates and tools for capturing effective meeting minutes.', 
        author: 'BizTools', 
        downloads: '95k', 
        isInstalled: false, 
        category: 'Business',
        version: '1.5.0',
        rating: 4.3
    },
    { 
        id: 'regex-tester', 
        name: 'Regex Tester', 
        description: 'Test and debug regular expressions in real-time.', 
        author: 'DevUtils', 
        downloads: '150k', 
        isInstalled: false, 
        category: 'Development',
        version: '1.1.2',
        rating: 4.8
    },
    { 
        id: 'finance-tracker', 
        name: 'Finance Tracker', 
        description: 'Personal finance management made simple.', 
        author: 'MoneyWise', 
        downloads: '200k', 
        isInstalled: false, 
        category: 'Business',
        version: '2.0.0',
        rating: 4.6
    }
];

export interface IAppStoreService {
    getApps(): Promise<ServiceResult<AppStoreItem[]>>;
    getAppById(id: string): Promise<ServiceResult<AppStoreItem | null>>;
    installApp(id: string): Promise<ServiceResult<void>>;
}

class AppStoreService implements IAppStoreService {
    async getApps(): Promise<ServiceResult<AppStoreItem[]>> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return Result.success([...MOCK_APPS]);
    }

    async getAppById(id: string): Promise<ServiceResult<AppStoreItem | null>> {
        await new Promise(resolve => setTimeout(resolve, 200));
        const app = MOCK_APPS.find(a => a.id === id) || null;
        return Result.success(app);
    }

    async installApp(id: string): Promise<ServiceResult<void>> {
        try {
            console.log(`[AppStore] Requesting install for ${id}`);
            // In a real app, this would trigger the download service
            await new Promise(resolve => setTimeout(resolve, 2000));
            return Result.success(undefined);
        } catch (e: any) {
            return Result.error(e.message);
        }
    }
}

export const appStoreService = new AppStoreService();
