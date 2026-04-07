import { Message } from '../../domain/entities/Message';
import { IVectorRepository } from '../../domain/repositories/IVectorRepository';
import { ILLMService } from '../../domain/services/ILLMService';
import { AskQuestionResponse } from '../dto/ApiResponse';

export interface AskQuestionInput {
  question: string;
  topK?: number;
}

const SYSTEM_PROMPT = `You are a helpful and knowledgeable virtual assistant.
You answer questions based exclusively on the provided context from the uploaded documents.
If the context does not contain enough information to answer the question, say so clearly.
Always be precise, helpful, and cite which document the information comes from.
Answer in the same language as the question.`;

export class AskQuestionUseCase {
  constructor(
    private readonly vectorRepository: IVectorRepository,
    private readonly llmService: ILLMService
  ) {}

  async execute(input: AskQuestionInput): Promise<AskQuestionResponse> {
    const topK = input.topK ?? 5;

    // 1. Retrieve relevant chunks from Pinecone
    const searchResults = await this.vectorRepository.similaritySearch(input.question, topK);

    if (searchResults.length === 0) {
      const noContextResponse = await this.llmService.generateResponse(
        SYSTEM_PROMPT,
        input.question,
        'No relevant documents found in the knowledge base.'
      );

      const message = Message.createAssistantMessage(noContextResponse.content);
      return {
        answer: noContextResponse.content,
        sources: [],
        messageId: message.id,
      };
    }

    // 2. Build context string from retrieved chunks
    const context = searchResults
      .map((result, index) => {
        const { chunk, score } = result;
        return `[Source ${index + 1} - ${chunk.metadata.fileName} (relevance: ${(score * 100).toFixed(1)}%)]\n${chunk.content}`;
      })
      .join('\n\n---\n\n');

    // 3. Generate answer using Mistral with context
    const llmResponse = await this.llmService.generateResponse(
      SYSTEM_PROMPT,
      input.question,
      context
    );

    // 4. Build source references
    const sources = searchResults.map((result) => ({
      fileName: result.chunk.metadata.fileName,
      excerpt: result.chunk.content.slice(0, 200) + (result.chunk.content.length > 200 ? '...' : ''),
      relevanceScore: result.score,
    }));

    const message = Message.createAssistantMessage(llmResponse.content,
      searchResults.map((r) => ({
        fileName: r.chunk.metadata.fileName,
        chunkIndex: r.chunk.metadata.chunkIndex,
        relevanceScore: r.score,
        excerpt: r.chunk.content.slice(0, 200),
      }))
    );

    return {
      answer: llmResponse.content,
      sources,
      messageId: message.id,
    };
  }
}
