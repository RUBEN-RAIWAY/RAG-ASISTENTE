export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed?: number;
}

export interface ILLMService {
  generateResponse(
    systemPrompt: string,
    userMessage: string,
    context?: string
  ): Promise<LLMResponse>;
}
