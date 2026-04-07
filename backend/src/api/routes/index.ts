import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { ChatController } from '../controllers/ChatController';
import {
  uploadDocumentUseCase,
  askQuestionUseCase,
} from '../../infrastructure/config/container';
import { upload } from '../middleware/upload';

const router = Router();

const documentController = new DocumentController(uploadDocumentUseCase);
const chatController = new ChatController(askQuestionUseCase);

// Document routes
router.post('/documents/upload', upload.single('file'), documentController.upload);
router.get('/documents/stats', documentController.getStats);

// Chat routes
router.post('/chat/ask', chatController.ask);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
