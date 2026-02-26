
;
import { vfs } from '@sdkwork/react-fs';
import { Note, NoteSummary, NoteFolder, pathUtils } from '@sdkwork/react-commons';
import { platform } from '@sdkwork/react-core';
import { IBaseService, ServiceResult, Result, Page, PageRequest } from '@sdkwork/react-commons';
import { TextSearchEngine } from '@sdkwork/react-commons';
import { logger } from '@sdkwork/react-commons';

const NOTES_ROOT_DIR = 'OpenStudio/Notes';

/**
 * Note Service (Optimized v2)
 * - Uses Inverted Index for O(1) search
 * - Separates Metadata (Summary) from Content for O(1) list rendering
 * - Lazy loads content
 */
class NoteService implements IBaseService<NoteSummary> {
  private _rootPath: string | null = null;
  
  // In-memory cache
  private _summaryCache: NoteSummary[] = [];
  private _foldersCache: NoteFolder[] = [];
  
  // Search Engine Instance
  private _searchEngine: TextSearchEngine<NoteSummary>;
  
  private _initialized = false;

  constructor() {
      // Initialize Search Engine with weighted fields
      this._searchEngine = new TextSearchEngine({
          fields: ['title', 'tags', 'snippet'],
          weights: {
              title: 10,  // Title matches are most important
              tags: 5,    // Tags are secondary
              snippet: 1  // Content matches are base level
          }
      });
  }

  private async ensureInitialized() {
      if (this._initialized) return;
      await this.refreshIndex();
      this._initialized = true;
  }

  async getRootPath(): Promise<string> {
      if (this._rootPath) return this._rootPath;
      
      if (platform.getPlatform() === 'web') {
          this._rootPath = '/mock/notes';
      } else {
          const docsDir = await platform.getPath('documents');
          this._rootPath = pathUtils.join(docsDir, NOTES_ROOT_DIR);
      }

      try { await vfs.createDir(this._rootPath); } catch (e) {
          logger.warn('[NoteService] Failed to create notes directory', this._rootPath, e);
      }
      return this._rootPath;
  }

  private getFilename(id: string): string {
      return `${id}.osnote`;
  }

  /**
   * Re-scan filesystem and rebuild memory index.
   */
  public async refreshIndex(): Promise<void> {
      const root = await this.getRootPath();
      
      // Clear caches
      this._summaryCache = [];
      this._foldersCache = [];
      this._searchEngine.clear();

      await this.scanDir(root);
  }

  private async scanDir(dirPath: string): Promise<void> {
      const entries = await vfs.readDir(dirPath);
      const root = await this.getRootPath();

      for (const entry of entries) {
          if (entry.name.startsWith('.')) continue; 

          if (entry.isDirectory) {
              const folder: NoteFolder = {
                  id: entry.path,
                  name: entry.name,
                  parentId: dirPath === root ? null : dirPath,
                  createdAt: Date.now() 
              };
              this._foldersCache.push(folder);
              await this.scanDir(entry.path);
          } else if (entry.name.endsWith('.osnote')) {
              try {
                  // We must read the file to get metadata for the index
                  // Optimization: In a real DB we wouldn't do this. 
                  // Here, we do it once on startup.
                  const raw = await vfs.readFile(entry.path);
                  const fullNote: Note = JSON.parse(raw);
                  
                  // Create Summary (Strip HTML Content)
                  // Simple regex to strip tags for snippet
                  const plainText = fullNote.content.replace(/<[^>]+>/g, ' ').slice(0, 300);
                  
                  const summary: NoteSummary = {
                      id: fullNote.id,
                      uuid: fullNote.uuid,
                      createdAt: fullNote.createdAt,
                      updatedAt: fullNote.updatedAt,
                      title: fullNote.title,
                      type: fullNote.type,
                      parentId: dirPath === root ? null : dirPath,
                      tags: fullNote.tags || [],
                      isFavorite: fullNote.isFavorite || false,
                      snippet: plainText,
                      metadata: fullNote.metadata,
                      publishStatus: fullNote.publishStatus
                  };

                  this._summaryCache.push(summary);
                  this._searchEngine.add(summary);
              } catch (e) {
                  console.warn(`Failed to parse note: ${entry.path}`, e);
              }
          }
      }
  }

  // --- IBaseService Implementation ---

  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>> {
      await this.ensureInitialized();
      
      let content: NoteSummary[];

      // 1. Search Logic
      if (pageRequest?.keyword && pageRequest.keyword.trim()) {
          const searchResults = this._searchEngine.search(pageRequest.keyword);
          content = searchResults.map(r => this._searchEngine.getDocument(r.id)).filter((n): n is NoteSummary => n !== undefined);
      } else {
          // Default: All items
          content = [...this._summaryCache];
          // Default Sort: UpdatedAt Desc
          content.sort((a, b) => b.updatedAt - a.updatedAt);
      }

      // 2. Pagination
      const size = pageRequest?.size || 1000;
      const page = pageRequest?.page || 0;
      const totalElements = content.length;
      const totalPages = Math.ceil(totalElements / size);
      const start = page * size;
      const pagedContent = content.slice(start, start + size);

      return Result.success({
          content: pagedContent,
          pageable: { pageNumber: page, pageSize: size, offset: start, paged: true, unpaged: false, sort: { sorted: true, unsorted: false, empty: false } },
          last: page >= totalPages - 1,
          totalPages,
          totalElements,
          size,
          number: page,
          sort: { sorted: true, unsorted: false, empty: false },
          first: page === 0,
          numberOfElements: pagedContent.length,
          empty: pagedContent.length === 0
      });
  }

  /**
   * Load FULL content for a specific note.
   */
  async findById(id: string): Promise<ServiceResult<Note | null>> {
      await this.ensureInitialized();
      
      const summary = this._summaryCache.find(n => n.id === id);
      if (!summary) return Result.success(null);

      // Construct path from summary info
      const root = await this.getRootPath();
      const parentPath = summary.parentId || root;
      const filePath = pathUtils.join(parentPath, this.getFilename(id));

      try {
          const raw = await vfs.readFile(filePath);
          const note: Note = JSON.parse(raw);
          return Result.success(note);
      } catch (e: any) {
          return Result.error("Failed to read note file");
      }
  }

  async existsById(id: string): Promise<boolean> {
      await this.ensureInitialized();
      return this._summaryCache.some(n => n.id === id);
  }

  async save(entity: Partial<Note>): Promise<ServiceResult<NoteSummary>> {
      await this.ensureInitialized();
      
      if (!entity.id) return Result.error("ID required for save");

      // 1. Get Existing or Create New Full Note
      let fullNote: Note;
      
      const existingSummary = this._summaryCache.find(n => n.id === entity.id);
      
      if (existingSummary) {
          // If update doesn't include content, we must load it first to avoid overwriting with empty
          if (entity.content === undefined) {
              const loaded = await this.findById(entity.id);
              if (loaded.data) {
                  fullNote = { ...loaded.data, ...entity, updatedAt: Date.now() };
              } else {
                  return Result.error("Original file missing");
              }
          } else {
              // We have new content, merge with summary metadata
              fullNote = { 
                  ...existingSummary, 
                  content: entity.content, // Placeholder, ts will complain if we don't cast or merge properly
                  ...entity, 
                  updatedAt: Date.now() 
              } as Note;
          }
      } else {
          // New Note
          fullNote = {
              id: entity.id,
              uuid: entity.uuid || entity.id,
              title: entity.title || 'Untitled',
              content: entity.content || '',
              type: entity.type || 'doc',
              parentId: entity.parentId || null,
              tags: entity.tags || [],
              isFavorite: entity.isFavorite || false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              ...entity
          } as Note;
      }

      // 2. Persist to Disk
      const root = await this.getRootPath();
      const parentPath = fullNote.parentId || root;
      const filePath = pathUtils.join(parentPath, this.getFilename(fullNote.id));
      
      try {
          await vfs.writeFile(filePath, JSON.stringify(fullNote, null, 2));
          
          // 3. Update Memory Index (Summary)
          const plainText = fullNote.content.replace(/<[^>]+>/g, ' ').slice(0, 300);
          const newSummary: NoteSummary = {
              ...fullNote,
              snippet: plainText
          };
          // Ensure content is stripped from summary to save memory
          delete (newSummary as any).content;

          if (existingSummary) {
              const idx = this._summaryCache.indexOf(existingSummary);
              this._summaryCache[idx] = newSummary;
          } else {
              this._summaryCache.unshift(newSummary);
          }
          
          // Update Search Engine
          this._searchEngine.update(newSummary);

          return Result.success(newSummary);
      } catch (e: any) {
          return Result.error(e.message);
      }
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
      await this.ensureInitialized();
      const summary = this._summaryCache.find(n => n.id === id);
      if (!summary) return Result.error("Note not found");

      const root = await this.getRootPath();
      const parentPath = summary.parentId || root;
      const filePath = pathUtils.join(parentPath, this.getFilename(id));

      try {
          await vfs.delete(filePath);
          
          // Update Cache & Index
          this._summaryCache = this._summaryCache.filter(n => n.id !== id);
          this._searchEngine.remove(id);
          
          return Result.success(undefined);
      } catch (e: any) {
          return Result.error(e.message);
      }
  }

  // Stubs
  async delete(entity: NoteSummary): Promise<ServiceResult<void>> { return this.deleteById(entity.id); }
  async deleteAll(ids: string[]): Promise<ServiceResult<void>> { for(const id of ids) await this.deleteById(id); return Result.success(undefined); }
  async findAllById(ids: string[]): Promise<ServiceResult<NoteSummary[]>> { return Result.success([]); }
  async saveAll(entities: Partial<NoteSummary>[]): Promise<ServiceResult<NoteSummary[]>> { throw new Error("Method not implemented."); }
  
  async count(): Promise<number> {
      await this.ensureInitialized();
      return this._summaryCache.length;
  }
  
  // --- Folder Management ---
  async getFolders(): Promise<ServiceResult<NoteFolder[]>> {
      await this.ensureInitialized();
      return Result.success(this._foldersCache);
  }

  async createFolder(name: string, parentId: string | null): Promise<ServiceResult<NoteFolder>> {
      await this.ensureInitialized();
      const root = await this.getRootPath();
      const parentPath = parentId || root;
      const newPath = pathUtils.join(parentPath, name);
      
      try {
          await vfs.createDir(newPath);
          const newFolder: NoteFolder = {
              id: newPath,
              name,
              parentId,
              createdAt: Date.now()
          };
          this._foldersCache.push(newFolder);
          return Result.success(newFolder);
      } catch (e: any) {
          return Result.error(e.message);
      }
  }

  async deleteFolder(id: string): Promise<ServiceResult<void>> {
      try {
          await vfs.delete(id);
          this._foldersCache = this._foldersCache.filter(f => f.id !== id);
          
          // Also remove contained notes from cache
          const toRemove = this._summaryCache.filter(n => n.parentId?.startsWith(id));
          toRemove.forEach(n => this._searchEngine.remove(n.id));
          this._summaryCache = this._summaryCache.filter(n => !n.parentId?.startsWith(id));
          
          return Result.success(undefined);
      } catch (e: any) {
          return Result.error(e.message);
      }
  }

  async renameFolder(id: string, newName: string): Promise<ServiceResult<string>> {
      try {
          const parent = pathUtils.dirname(id);
          const newPath = pathUtils.join(parent, newName);
          await vfs.rename(id, newPath);
          await this.refreshIndex(); 
          return Result.success(newPath);
      } catch (e: any) {
          return Result.error(e.message);
      }
  }
  
  async moveNote(note: NoteSummary, newParentId: string | null): Promise<ServiceResult<void>> {
      const root = await this.getRootPath();
      const oldParent = note.parentId || root;
      const newParent = newParentId || root;

      const oldPath = pathUtils.join(oldParent, this.getFilename(note.id));
      const newPath = pathUtils.join(newParent, this.getFilename(note.id));

      if (oldPath !== newPath) {
          try {
              // 1. Load full content to move
              const fullRes = await this.findById(note.id);
              if (!fullRes.data) return Result.error("Source file missing");
              
              // 2. FS Move
              await vfs.rename(oldPath, newPath);
              
              // 3. Update parentId in file content
              const updatedNote = { ...fullRes.data, parentId: newParentId };
              await vfs.writeFile(newPath, JSON.stringify(updatedNote, null, 2));
              
              // 4. Update Cache
              const idx = this._summaryCache.findIndex(n => n.id === note.id);
              if (idx >= 0) {
                  this._summaryCache[idx] = { ...this._summaryCache[idx], parentId: newParentId };
              }
              
              return Result.success(undefined);
          } catch (e: any) {
              return Result.error(e.message);
          }
      }
      return Result.success(undefined);
  }
}

export const noteService = new NoteService();
