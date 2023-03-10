export class AppError extends Error {
  statusCode?: string | number;
  status: string;
  isOperational: boolean;
  code?: number;

  path?: string;
  value?: any;
  constructor(message: string, statusCode?: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
