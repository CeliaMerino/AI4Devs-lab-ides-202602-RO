import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { errorHandler } from '../errorHandler';
import { DuplicateEmailError, ValidationError } from '../../domain/errors';

function createMockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  const req = {} as Request;
  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should respond 400 for ValidationError', () => {
    const res = createMockRes();
    errorHandler(new ValidationError('Invalid input'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input' });
  });

  it('should respond 400 for DuplicateEmailError', () => {
    const res = createMockRes();
    errorHandler(new DuplicateEmailError(), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'A candidate with this email already exists',
    });
  });

  it('should respond 400 for Multer file size limit', () => {
    const res = createMockRes();
    const err = new multer.MulterError('LIMIT_FILE_SIZE', 'file');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'File size exceeds maximum allowed size of 10MB',
    });
  });

  it('should respond 500 for unknown errors', () => {
    const res = createMockRes();
    errorHandler(new Error('boom'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'An unexpected error occurred. Please try again later.',
    });
  });
});
