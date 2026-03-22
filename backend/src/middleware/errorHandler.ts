import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { DuplicateEmailError, ValidationError } from '../domain/errors';
import { Logger } from '../infrastructure/logger';

const logger = new Logger();

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({
      message: err.message,
      ...(err.details !== undefined ? { error: err.details } : {}),
    });
    return;
  }

  if (err instanceof DuplicateEmailError) {
    res.status(400).json({ message: err.message });
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'File size exceeds maximum allowed size of 10MB' });
      return;
    }
    res.status(400).json({ message: err.message });
    return;
  }

  logger.error('Unhandled error', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({
    message: 'An unexpected error occurred. Please try again later.',
  });
}
