export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function errorResponse(error: string): ApiResponse<never> {
  return { success: false, error };
}

export interface UploadDocumentResponse {
  documentId: string;
  fileName: string;
  chunksCreated: number;
  message: string;
}

export interface AskQuestionResponse {
  answer: string;
  sources: Array<{
    fileName: string;
    excerpt: string;
    relevanceScore: number;
  }>;
  messageId: string;
}
