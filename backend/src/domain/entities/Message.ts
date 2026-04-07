export type MessageRole = 'user' | 'assistant' | 'system';

export interface SourceReference {
  fileName: string;
  chunkIndex: number;
  relevanceScore: number;
  excerpt: string;
}

export class Message {
  constructor(
    public readonly id: string,
    public readonly role: MessageRole,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly sources?: SourceReference[]
  ) {}

  static createUserMessage(content: string): Message {
    return new Message(
      `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      'user',
      content,
      new Date()
    );
  }

  static createAssistantMessage(content: string, sources?: SourceReference[]): Message {
    return new Message(
      `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      'assistant',
      content,
      new Date(),
      sources
    );
  }
}
