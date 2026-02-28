import { VideoTask } from '../entities';
import { generateUUID } from '@sdkwork/react-commons';

// Mock history service for video tasks
export class VideoHistoryService {
    private storageKey = 'video_history';
    private tasks: VideoTask[] = [];

    constructor() {
        // Load from localStorage on init
        this.loadFromStorage();
    }

    private loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.tasks = JSON.parse(stored);
            }
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
                status: task.status || 'pending',
                results: task.results,
                error: task.error,
                progress: task.progress,
                isFavorite: task.isFavorite || false,
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
    }
}

export const videoHistoryService = new VideoHistoryService();
