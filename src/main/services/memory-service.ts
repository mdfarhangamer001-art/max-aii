import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

interface MemoryEntry {
  id: string;
  content: string;
  embedding: number[];
  timestamp: number;
  type: 'note' | 'context' | 'command';
}

class MemoryService {
  private memories: Map<string, MemoryEntry> = new Map();
  private dbPath = path.join(process.env.APPDATA || '~/.max-aii', 'memory.json');

  async initialize(): Promise<void> {
    // Load persisted memories
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(data);
        this.memories = new Map(parsed);
        console.log('[MEMORY] Loaded', this.memories.size, 'memories');
      }
    } catch (error) {
      console.error('[MEMORY] Load error:', error);
    }
  }

  async save(id: string, content: string, type: MemoryEntry['type']): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id,
      content,
      embedding: this.mockEmbedding(content), // Replace with real embedding
      timestamp: Date.now(),
      type,
    };
    this.memories.set(id, entry);
    await this.persist();
    return entry;
  }

  async retrieve(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    const queryEmbedding = this.mockEmbedding(query);
    const scored = Array.from(this.memories.values())
      .map((m) => ({
        ...m,
        score: this.cosineSimilarity(queryEmbedding, m.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return scored as MemoryEntry[];
  }

  async delete(id: string): Promise<boolean> {
    const result = this.memories.delete(id);
    if (result) await this.persist();
    return result;
  }

  private async persist(): Promise<void> {
    const data = Array.from(this.memories.entries());
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
  }

  private mockEmbedding(text: string): number[] {
    // Replace with real embedding model (e.g., all-MiniLM-L6-v2)
    return Array(384)
      .fill(0)
      .map(() => Math.random());
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

const memoryService = new MemoryService();

// ==================== IPC HANDLERS ====================
export function registerMemoryHandlers() {
  ipcMain.handle('memory:init', async () => {
    await memoryService.initialize();
    return { success: true, message: 'MEMORY SYSTEM ONLINE' };
  });

  ipcMain.handle('memory:save', async (event, id: string, content: string, type: string) => {
    const entry = await memoryService.save(id, content, type as any);
    return entry;
  });

  ipcMain.handle('memory:retrieve', async (event, query: string, limit?: number) => {
    const results = await memoryService.retrieve(query, limit);
    return results;
  });

  ipcMain.handle('memory:delete', async (event, id: string) => {
    const success = await memoryService.delete(id);
    return { success };
  });
}

export { MemoryService, memoryService };