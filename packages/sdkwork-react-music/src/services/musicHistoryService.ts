import { MusicTask } from '../entities';

// Mock history service for music tasks
export class MusicHistoryService {
    private storageKey = 'music_history';
    private tasks: MusicTask[] = [];

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
            console.warn('[MusicHistoryService] Failed to load from storage:', e);
            this.tasks = [];
        }
    }

    private saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
        } catch (e) {
            console.warn('[MusicHistoryService] Failed to save to storage:', e);
        }
    }

    async findAll(): Promise<MusicTask[]> {
        return [...this.tasks];
    }

    async findById(id: string): Promise<MusicTask | undefined> {
        return this.tasks.find(task => task.id === id);
    }

    async save(task: Partial<MusicTask> & { id: string }): Promise<void> {
        const existingIndex = this.tasks.findIndex(t => t.id === task.id);
        if (existingIndex >= 0) {
            // Update existing
            this.tasks[existingIndex] = { ...this.tasks[existingIndex], ...task } as MusicTask;
        } else {
            // Add new
            const newTask: MusicTask = {
                id: task.id,
                uuid: task.id,
                config: task.config!,
                status: task.status || 'pending',
                results: task.results,
                error: task.error,
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

export const musicHistoryService = new MusicHistoryService();
