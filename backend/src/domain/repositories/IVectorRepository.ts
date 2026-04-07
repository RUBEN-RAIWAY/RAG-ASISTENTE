import { DocumentChunk } from '../entities/Document';

export interface VectorSearchResult {
  chunk: DocumentChunk;
  score: number;
}

export interface IVectorRepository {
  upsertChunks(chunks: DocumentChunk[]): Promise<void>;
  similaritySearch(query: string, topK?: number): Promise<VectorSearchResult[]>;
  deleteByFileName(fileName: string): Promise<void>;
  getIndexStats(): Promise<{ totalVectors: number; dimension: number }>;
}
