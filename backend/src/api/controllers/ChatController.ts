import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AskQuestionUseCase } from '../../application/use-cases/AskQuestionUseCase';
import { successResponse } from '../../application/dto/ApiResponse';
import { AppError } from '../middleware/errorHandler';

const AskSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty').max(2000, 'Question too long'),
  topK: z.number().int().min(1).max(20).optional(),
});

export class ChatController {
  constructor(private readonly askQuestionUseCase: AskQuestionUseCase) {}

  ask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = AskSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, parsed.error.errors[0]?.message ?? 'Invalid request');
      }

      const result = await this.askQuestionUseCase.execute({
        question: parsed.data.question,
        topK: parsed.data.topK,
      });

      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  };
}
