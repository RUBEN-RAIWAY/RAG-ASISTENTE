import { Document, DocumentChunk } from '../../domain/entities/Document';
import { IVectorRepository } from '../../domain/repositories/IVectorRepository';
import { IEmbeddingService } from '../../domain/services/IEmbeddingService';
import { UploadDocumentResponse } from '../dto/ApiResponse';
import { PDFProcessor } from '../../infrastructure/pdf/PDFProcessor';

export interface UploadDocumentInput {
  buffer: Buffer;
  fileName: string;
  fileSize: number;
}

export class UploadDocumentUseCase {
  constructor(
    private readonly vectorRepository: IVectorRepository,
    private readonly embeddingService: IEmbeddingService,
    private readonly pdfProcessor: PDFProcessor
  ) {}

  async execute(input: UploadDocumentInput): Promise<UploadDocumentResponse> {
    // 1. Extract text from PDF
    const rawText = await this.pdfProcessor.extractText(input.buffer);

    // 2. Split into chunks
    const textChunks = await this.pdfProcessor.splitIntoChunks(rawText);

    // 3. Create DocumentChunks with metadata
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const uploadedAt = new Date().toISOString();

    const documentChunks: DocumentChunk[] = textChunks.map((chunkContent, index) => ({
      id: `${documentId}_chunk_${index}`,
      content: chunkContent,
      metadata: {
        fileName: input.fileName,
        fileSize: input.fileSize,
        chunkIndex: index,
        totalChunks: textChunks.length,
        uploadedAt,
        source: input.fileName,
      },
    }));

    // 4. Generate embeddings in batches
    const contents = documentChunks.map((c) => c.content);
    const embeddings = await this.embeddingService.embedBatch(contents);

    documentChunks.forEach((chunk, i) => {
      chunk.embedding = embeddings[i];
    });

    // 5. Upsert into Pinecone
    await this.vectorRepository.upsertChunks(documentChunks);

    // 6. Create domain entity (for logging/audit purposes)
    const document = new Document(
      documentId,
      input.fileName,
      input.fileSize,
      rawText,
      documentChunks,
      new Date()
    );

    return {
      documentId: document.id,
      fileName: document.fileName,
      chunksCreated: document.chunkCount,
      message: `Document "${input.fileName}" processed successfully into ${document.chunkCount} chunks.`,
    };
  }
}
