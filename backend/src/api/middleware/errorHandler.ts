import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../../application/dto/ApiResponse';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err.message, err.stack);

  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  if (err.message === 'Only PDF files are allowed') {
    res.status(400).json(errorResponse(err.message));
    return;
  }

  if (err.message.includes('File too large')) {
    res.status(400).json(errorResponse('File exceeds the 20 MB limit'));
    return;
  }

  res.status(500).json(errorResponse('Internal server error'));
}
