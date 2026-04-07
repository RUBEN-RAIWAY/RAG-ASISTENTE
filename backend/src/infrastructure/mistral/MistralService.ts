import { MistralAIEmbeddings } from '@langchain/mistralai';
import { ChatMistralAI } from '@langchain/mistralai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { IEmbeddingService } from '../../domain/services/IEmbeddingService';
import { ILLMService, LLMResponse } from '../../domain/services/ILLMService';

export class MistralEmbeddingService implements IEmbeddingService {
  private readonly embeddings: MistralAIEmbeddings;
  private readonly dimension = 1024;

  constructor(apiKey: string) {
    this.embeddings = new MistralAIEmbeddings({
      apiKey,
      model: 'mistral-embed',
    });
  }

  async embedText(text: string): Promise<number[]> {
    const result = await this.embeddings.embedQuery(text);
    return result;
  }

  //async embedBatch(texts: string[]): Promise<number[][]> {
  //  const results = await this.embeddings.embedDocuments(texts);
  //  return results;
  //}

  async embedBatch(texts: string[]): Promise<number[][]> {
    const MISTRAL_BATCH_SIZE = 16;
    const results: number[][] = [];
  
    for (let i = 0; i < texts.length; i += MISTRAL_BATCH_SIZE) {
      const batch = texts.slice(i, i + MISTRAL_BATCH_SIZE);
      const batchResults = await this.embeddings.embedDocuments(batch);
      results.push(...batchResults);
    }
  
    return results;
  }


  getDimension(): number {
    return this.dimension;
  }
}

export class MistralLLMService implements ILLMService {
  private readonly llm: ChatMistralAI;

  constructor(apiKey: string) {
    this.llm = new ChatMistralAI({
      apiKey,
      model: 'mistral-medium-latest',
      temperature: 0.3,
      maxTokens: 2048,
    });
  }

  async generateResponse(
    systemPrompt: string,
    userMessage: string,
    context?: string
  ): Promise<LLMResponse> {
    const userContent = context
      ? `Context from documents:\n\n${context}\n\n---\n\nQuestion: ${userMessage}`
      : userMessage;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userContent),
    ];

    const response = await this.llm.invoke(messages);
    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    return {
      content,
      tokensUsed: response.usage_metadata?.total_tokens,
    };
  }
}
