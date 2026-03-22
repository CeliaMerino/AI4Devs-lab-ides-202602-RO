import type { Request, Response, NextFunction } from 'express';
import { createCandidateService } from '../../application/services/candidateService';

export async function createCandidate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await createCandidateService(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
