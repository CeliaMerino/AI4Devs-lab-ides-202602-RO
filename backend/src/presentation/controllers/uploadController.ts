import path from 'path';
import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../domain/errors';

export function uploadResume(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.file) {
      next(new ValidationError('No file uploaded'));
      return;
    }
    const relativePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');
    res.status(200).json({
      filePath: relativePath,
      fileType: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
}
