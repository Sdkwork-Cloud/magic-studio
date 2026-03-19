import { VideoTask } from '../entities';
import { generateUUID } from '@sdkwork/react-commons';
import { STORAGE_KEY_VIDEO_HISTORY } from '../constants';

const LEGACY_STORAGE_KEYS_VIDEO_HISTORY = [
    'video_history',
    'open_studio_video_history_v1'
] as const;

// Mock history service for video tasks
export class VideoHistoryService {
    private storageKey = STORAGE_KEY_VIDEO_HISTORY;
    private tasks: VideoTask[] = [];

    constructor() {
        // Load from localStorage on init
        this.loadFromStorage();
    }

    private loadFromStorage() {
        try {
            const storageKeys = [this.storageKey, ...LEGACY_STORAGE_KEYS_VIDEO_HISTORY];
            for (const key of storageKeys) {
                const stored = localStorage.getItem(key);
                if (!stored) {
                    continue;
                }

                const parsed = JSON.parse(stored);
                if (!Array.isArray(parsed)) {
                    continue;
                }

                this.tasks = parsed;
                if (key !== this.storageKey) {
                    try {
                        localStorage.setItem(this.storageKey, stored);
                        localStorage.removeItem(key);
                    } catch {
                        // Keep using the recovered snapshot even if migration cannot persist yet.
                    }
                }
                return;
            }
            this.tasks = [];
        } catch (e) {
            console.warn('[VideoHistoryService] Failed to load from storage:', e);
            this.tasks = [];
        }
    }

    private saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
        } catch (e) {
            console.warn('[VideoHistoryService] Failed to save to storage:', e);
        }
    }

    async findAll(): Promise<VideoTask[]> {
        return [...this.tasks];
    }

    async findById(id: string): Promise<VideoTask | undefined> {
        return this.tasks.find(task => task.id === id);
    }

    async save(task: Partial<VideoTask> & { id: string }): Promise<void> {
        const existingIndex = this.tasks.findIndex(t => t.id === task.id);
        if (existingIndex >= 0) {
            // Update existing
            this.tasks[existingIndex] = { ...this.tasks[existingIndex], ...task } as VideoTask;
        } else {
            // Add new
            const newTask: VideoTask = {
                id: task.id,
                uuid: task.uuid || generateUUID(),
                config: task.config!,
                generationRequest: task.generationRequest,
                status: task.status || 'pending',
                results: task.results,
                error: task.error,
                progress: task.progress,
                isFavorite: task.isFavorite || false,
                stage: task.stage,
                taskType: task.taskType,
                provider: task.provider,
                remoteTaskId: task.remoteTaskId,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            this.tasks.push(newTask);
        }
        this.saveToStorage();
    }

    async delete(id: string): Promise<void> {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveToStorage();
    }

    /**
     * Domain specific method: Toggle Favorite
     */
    async toggleFavorite(id: string): Promise<void> {
        const task = await this.findById(id);
        if (task) {
            await this.save({ 
                id, 
                isFavorite: !task.isFavorite 
            });
        }
    }

    async clear(): Promise<void> {
        this.tasks = [];
        localStorage.removeItem(this.storageKey);
        LEGACY_STORAGE_KEYS_VIDEO_HISTORY.forEach((key) => localStorage.removeItem(key));
    }
}

export const videoHistoryService = new VideoHistoryService();
