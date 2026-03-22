export class ValidationError extends Error {
  readonly statusCode = 400;

  constructor(
    message: string,
    readonly details?: string
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class DuplicateEmailError extends Error {
  readonly statusCode = 400;

  constructor(message = 'A candidate with this email already exists') {
    super(message);
    this.name = 'DuplicateEmailError';
    Object.setPrototypeOf(this, DuplicateEmailError.prototype);
  }
}
