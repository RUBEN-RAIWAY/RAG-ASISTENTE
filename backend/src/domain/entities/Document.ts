export interface DocumentChunk {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embedding?: number[];
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  pageNumber?: number;
  chunkIndex: number;
  totalChunks: number;
  uploadedAt: string;
  source: string;
}

export class Document {
  constructor(
    public readonly id: string,
    public readonly fileName: string,
    public readonly fileSize: number,
    public readonly content: string,
    public readonly chunks: DocumentChunk[],
    public readonly uploadedAt: Date
  ) {}

  static create(params: {
    fileName: string;
    fileSize: number;
    content: string;
    chunks: DocumentChunk[];
  }): Document {
    const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return new Document(
      id,
      params.fileName,
      params.fileSize,
      params.content,
      params.chunks,
      new Date()
    );
  }

  get chunkCount(): number {
    return this.chunks.length;
  }
}
