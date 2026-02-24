
import { ChatSession, ChatMessage, ChatTranscript } from '../entities/chat.entity';
import { genAIService } from '../../notes/services/genAIService';
import { generateUUID } from '../../../utils';
import { LocalStorageService } from '../../../services/base/LocalStorageService';
import { ServiceResult, Result, Page, PageRequest } from '../../../types/core';
import { vfs } from '../../fs/vfs';
import { pathUtils } from '../../../utils/pathUtils';
import { platform } from '../../../platform';
import { TextSearchEngine } from '../../../utils/algorithms/TextSearchEngine';

const STORAGE_KEY = 'open_studio_chat_sessions_v2';
const CHATS_DIR = 'OpenStudio/Chats';

export interface IChatService extends LocalStorageService<ChatSession> {
    createSession(modelId?: string): Promise<ServiceResult<ChatSession>>;
    getTranscript(sessionId: string): Promise<ServiceResult<ChatTranscript>>;
    saveTranscript(sessionId: string, messages: ChatMessage[]): Promise<ServiceResult<void>>;
    streamResponse(
        prompt: string, 
        onChunk: (chunk: string) => void,
        context?: string,
        history?: ChatMessage[]
    ): Promise<void>;
}

/**
 * Chat Service (Optimized v2)
 * - Metadata in LocalStorage (Fast List)
 * - Transcripts in VFS (Scalable Content)
 * - Inverted Index for Search
 */
class ChatService extends LocalStorageService<ChatSession> implements IChatService {
    private _rootPath: string | null = null;
    private _searchEngine: TextSearchEngine<ChatSession>;
    private _initializedSearch = false;

    constructor() {
        super(STORAGE_KEY);
        this._searchEngine = new TextSearchEngine({
            fields: ['title', 'summary'],
            weights: { title: 10, summary: 5 }
        });
    }

    private async getChatsDir(): Promise<string> {
        if (this._rootPath) return this._rootPath;
        
        if (platform.getPlatform() === 'web') {
            this._rootPath = '/mock/chats';
        } else {
            const docs = await platform.getPath('documents');
            this._rootPath = pathUtils.join(docs, CHATS_DIR);
        }
        
        try { await vfs.createDir(this._rootPath); } catch {}
        return this._rootPath;
    }

    private getTranscriptPath(sessionId: string, root: string): string {
        return pathUtils.join(root, `${sessionId}.json`);
    }

    // --- Override Base Methods for Search Indexing ---

    protected async ensureInitialized(): Promise<void> {
        await super.ensureInitialized();
        if (!this._initializedSearch && this.cache) {
            this._searchEngine.clear();
            this.cache.forEach(session => this._searchEngine.add(session));
            this._initializedSearch = true;
        }
    }

    async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<ChatSession>>> {
        await this.ensureInitialized();
        let content: ChatSession[];

        if (pageRequest?.keyword && pageRequest.keyword.trim()) {
            content = this._searchEngine.search(pageRequest.keyword);
        } else {
            content = [...(this.cache || [])];
            // Sort: Pinned first, then UpdatedAt Desc
            content.sort((a, b) => {
                if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                return b.updatedAt - a.updatedAt;
            });
        }

        // Pagination (Standard)
        const totalElements = content.length;
        const size = pageRequest?.size || 20;
        const page = pageRequest?.page || 0;
        const start = page * size;
        const pagedContent = content.slice(start, start + size);

        return Result.success({
            content: pagedContent,
            pageable: { pageNumber: page, pageSize: size, offset: start, paged: true, unpaged: false, sort: { sorted: true, unsorted: false, empty: false } },
            last: start + size >= totalElements,
            totalPages: Math.ceil(totalElements / size),
            totalElements,
            size,
            number: page,
            sort: { sorted: true, unsorted: false, empty: false },
            first: page === 0,
            numberOfElements: pagedContent.length,
            empty: pagedContent.length === 0
        });
    }

    async save(entity: Partial<ChatSession>): Promise<ServiceResult<ChatSession>> {
        const result = await super.save(entity);
        if (result.success && result.data) {
            this._searchEngine.add(result.data); // Update index
        }
        return result;
    }

    async deleteById(id: string): Promise<ServiceResult<void>> {
        // 1. Delete Metadata
        await super.deleteById(id);
        this._searchEngine.remove(id);

        // 2. Delete Transcript File
        try {
            const root = await this.getChatsDir();
            const path = this.getTranscriptPath(id, root);
            await vfs.delete(path);
        } catch (e) {
            console.warn(`[ChatService] Failed to delete transcript for ${id}`, e);
        }
        
        return Result.success(undefined);
    }

    // --- Specific Business Logic ---

    async createSession(modelId: string = 'gpt-4o'): Promise<ServiceResult<ChatSession>> {
        const id = generateUUID();
        const now = Date.now();
        const session: ChatSession = {
            id,
            uuid: id,
            title: 'New Chat',
            createdAt: now,
            updatedAt: now,
            modelId,
            isArchived: false,
            pinned: false,
            messageCount: 0
        };

        // Initialize empty transcript file
        await this.saveTranscript(id, []);
        
        return await this.save(session);
    }

    async getTranscript(sessionId: string): Promise<ServiceResult<ChatTranscript>> {
        try {
            const root = await this.getChatsDir();
            const path = this.getTranscriptPath(sessionId, root);
            
            const exists = await vfs.stat(path).catch(() => null);
            if (!exists) {
                // If meta exists but file missing, return empty
                return Result.success({ sessionId, messages: [] });
            }

            const content = await vfs.readFile(path);
            const transcript = JSON.parse(content) as ChatTranscript;
            return Result.success(transcript);
        } catch (e: any) {
            return Result.error(`Failed to load transcript: ${e.message}`);
        }
    }

    async saveTranscript(sessionId: string, messages: ChatMessage[]): Promise<ServiceResult<void>> {
        try {
            const root = await this.getChatsDir();
            const path = this.getTranscriptPath(sessionId, root);
            
            const transcript: ChatTranscript = { sessionId, messages };
            await vfs.writeFile(path, JSON.stringify(transcript, null, 2));
            
            // Update metadata count
            await this.save({ id: sessionId, messageCount: messages.length });
            
            return Result.success(undefined);
        } catch (e: any) {
            return Result.error(`Failed to save transcript: ${e.message}`);
        }
    }

    createMessage(role: 'user' | 'ai', content: string, model?: string): ChatMessage {
        return {
            id: generateUUID(),
            role,
            content,
            timestamp: Date.now(),
            model,
            status: role === 'user' ? 'completed' : 'streaming'
        };
    }

    async streamResponse(
        prompt: string, 
        onChunk: (chunk: string) => void,
        context?: string,
        history?: ChatMessage[]
    ): Promise<void> {
        const historyFormat = (history || []).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.content
        })) as { role: 'user' | 'model', text: string }[];

        if (genAIService.isConfigured()) {
            try {
                await genAIService.streamChat(historyFormat, context || '', onChunk);
            } catch (e) {
                console.error("AI Service Error:", e);
                throw e;
            }
        } else {
            // Fallback Mock
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockResponse = `[Mock AI] I received: "${prompt}".\n\nConfigure API Key in settings for real responses.`;
            const chunks = mockResponse.split('');
            for (const char of chunks) {
                await new Promise(r => setTimeout(r, 10)); 
                onChunk(char);
            }
        }
    }
}

export const chatService = new ChatService();
