
import { EditorSession, generateUUID } from 'sdkwork-react-commons';
import { LocalStorageService } from 'sdkwork-react-core';

const SESSION_KEY = 'open_studio_editor_session_v1';
const DEFAULT_SESSION_ID = 'current_workspace';

class EditorSessionService extends LocalStorageService<EditorSession> {
    constructor() {
        super(SESSION_KEY);
    }

    async saveSession(
        rootPath: string | null, 
        openFiles: any[], 
        activeFilePath: string | null, 
        expandedPaths: string[]
    ): Promise<void> {
        const session: EditorSession = {
            id: DEFAULT_SESSION_ID,
            uuid: DEFAULT_SESSION_ID, // Static ID for singleton session
            rootPath,
            openFiles,
            activeFilePath,
            expandedPaths,
            createdAt: Date.now(), // These update on save
            updatedAt: Date.now()
        };
        await this.save(session);
    }

    async loadSession(): Promise<EditorSession | null> {
        const res = await this.findById(DEFAULT_SESSION_ID);
        return res.data || null;
    }
}

export const editorSessionService = new EditorSessionService();
