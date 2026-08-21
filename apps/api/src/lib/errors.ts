export interface ErrorDetail {
  code: string;
  message: string;
  path: string;
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFoundError(code: string, message: string): AppError {
  return new AppError(404, code, message);
}

export function badRequestError(code: string, message: string): AppError {
  return new AppError(400, code, message);
}

export function serviceUnavailableError(
  code: string,
  message: string,
): AppError {
  return new AppError(503, code, message);
}
