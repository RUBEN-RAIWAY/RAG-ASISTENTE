import dotenv from 'dotenv';
import { PDFProcessor } from '../pdf/PDFProcessor';
import { MistralEmbeddingService, MistralLLMService } from '../mistral/MistralService';
import { PineconeVectorRepository } from '../pinecone/PineconeVectorRepository';
import { UploadDocumentUseCase } from '../../application/use-cases/UploadDocumentUseCase';
import { AskQuestionUseCase } from '../../application/use-cases/AskQuestionUseCase';

dotenv.config();

// Debug: mostrar variables disponibles
console.log('ENV VARS:', {
  MISTRAL_API_KEY: process.env['MISTRAL_API_KEY'] ? 'SET' : 'NOT SET',
  PINECONE_API_KEY: process.env['PINECONE_API_KEY'] ? 'SET' : 'NOT SET',
  PINECONE_INDEX_NAME: process.env['PINECONE_INDEX_NAME'] ? 'SET' : 'NOT SET',
  PINECONE_HOST: process.env['PINECONE_HOST'] ? 'SET' : 'NOT SET',
  PORT: process.env['PORT'] ? 'SET' : 'NOT SET',
});

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

// Infrastructure services
const mistralApiKey = requireEnv('MISTRAL_API_KEY');
const pineconeApiKey = requireEnv('PINECONE_API_KEY');
const pineconeIndexName = requireEnv('PINECONE_INDEX_NAME');
const pineconeHost = process.env['PINECONE_HOST'];

export const pdfProcessor = new PDFProcessor(1000, 200);
export const embeddingService = new MistralEmbeddingService(mistralApiKey);
export const llmService = new MistralLLMService(mistralApiKey);
export const vectorRepository = new PineconeVectorRepository(
  pineconeApiKey,
  pineconeIndexName,
  embeddingService,
  pineconeHost
);

// Use cases
export const uploadDocumentUseCase = new UploadDocumentUseCase(
  vectorRepository,
  embeddingService,
  pdfProcessor
);

export const askQuestionUseCase = new AskQuestionUseCase(
  vectorRepository,
  llmService
);
