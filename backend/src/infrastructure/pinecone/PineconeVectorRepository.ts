import { Pinecone, RecordMetadata } from '@pinecone-database/pinecone';
import { DocumentChunk } from '../../domain/entities/Document';
import { IVectorRepository, VectorSearchResult } from '../../domain/repositories/IVectorRepository';
import { IEmbeddingService } from '../../domain/services/IEmbeddingService';

const NAMESPACE = 'documents';
const BATCH_SIZE = 100;

export class PineconeVectorRepository implements IVectorRepository {
  private readonly pinecone: Pinecone;
  private readonly indexName: string;
  private readonly host: string | undefined;

  constructor(
    apiKey: string,
    indexName: string,
    private readonly embeddingService: IEmbeddingService,
    host?: string
  ) {
    this.pinecone = new Pinecone({ apiKey });
    this.indexName = indexName;
    this.host = host;
  }

  private getIndex() {
    if (this.host) {
      return this.pinecone.index(this.indexName, this.host);
    }
    return this.pinecone.index(this.indexName);
  }

  async upsertChunks(chunks: DocumentChunk[]): Promise<void> {
    const index = this.getIndex();
    const ns = index.namespace(NAMESPACE);

    // Process in batches to avoid rate limits
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const vectors = batch.map((chunk) => ({
        id: chunk.id,
        values: chunk.embedding!,
        metadata: {
          content: chunk.content,
          fileName: chunk.metadata.fileName,
          fileSize: chunk.metadata.fileSize,
          chunkIndex: chunk.metadata.chunkIndex,
          totalChunks: chunk.metadata.totalChunks,
          uploadedAt: chunk.metadata.uploadedAt,
          source: chunk.metadata.source,
        } as RecordMetadata,
      }));

      await ns.upsert(vectors);
    }
  }

  async similaritySearch(query: string, topK: number = 5): Promise<VectorSearchResult[]> {
    const index = this.getIndex();
    const ns = index.namespace(NAMESPACE);

    // Embed the query
    const queryEmbedding = await this.embeddingService.embedText(query);

    const results = await ns.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    if (!results.matches) return [];

    return results.matches
      .filter((match) => match.metadata && match.score !== undefined)
      .map((match) => ({
        chunk: {
          id: match.id,
          content: match.metadata!.content as string,
          metadata: {
            fileName: match.metadata!.fileName as string,
            fileSize: match.metadata!.fileSize as number,
            chunkIndex: match.metadata!.chunkIndex as number,
            totalChunks: match.metadata!.totalChunks as number,
            uploadedAt: match.metadata!.uploadedAt as string,
            source: match.metadata!.source as string,
          },
        },
        score: match.score!,
      }));
  }

  async deleteByFileName(fileName: string): Promise<void> {
    const index = this.getIndex();
    const ns = index.namespace(NAMESPACE);

    // Query to find all vectors for this file
    const dummyEmbedding = new Array(this.embeddingService.getDimension()).fill(0);
    const results = await ns.query({
      vector: dummyEmbedding,
      topK: 10000,
      includeMetadata: true,
      filter: { fileName: { $eq: fileName } },
    });

    if (results.matches && results.matches.length > 0) {
      const ids = results.matches.map((m) => m.id);
      await ns.deleteMany(ids);
    }
  }

  async getIndexStats(): Promise<{ totalVectors: number; dimension: number }> {
    const index = this.getIndex();
    const stats = await index.describeIndexStats();
    return {
      totalVectors: stats.totalRecordCount ?? 0,
      dimension: stats.dimension ?? this.embeddingService.getDimension(),
    };
  }
}
