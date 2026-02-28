import { CharacterTask } from '../entities';

class CharacterHistoryService {
    private history: CharacterTask[] = [];

    async getHistory(): Promise<CharacterTask[]> {
        return this.history;
    }

    async addToHistory(task: CharacterTask): Promise<void> {
        this.history.unshift(task);
    }

    async deleteFromHistory(id: string): Promise<void> {
        this.history = this.history.filter(t => t.id !== id);
    }
}

export const characterHistoryService = new CharacterHistoryService();
