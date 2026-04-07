import { Request, Response, NextFunction } from 'express';
import { UploadDocumentUseCase } from '../../application/use-cases/UploadDocumentUseCase';
import { successResponse, errorResponse } from '../../application/dto/ApiResponse';
import { AppError } from '../middleware/errorHandler';
import { vectorRepository } from '../../infrastructure/config/container';

export class DocumentController {
  constructor(private readonly uploadDocumentUseCase: UploadDocumentUseCase) {}

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError(400, 'No PDF file provided');
      }

      const result = await this.uploadDocumentUseCase.execute({
        buffer: req.file.buffer,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });

      res.status(201).json(successResponse(result, result.message));
    } catch (err) {
      next(err);
    }
  };

  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await vectorRepository.getIndexStats();
      res.json(successResponse(stats));
    } catch (err) {
      next(err);
    }
  };
}
