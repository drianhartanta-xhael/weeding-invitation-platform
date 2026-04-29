import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  if (err && typeof err === 'object' && 'status' in err && typeof (err as { status?: number }).status === 'number') {
    const status = (err as { status: number }).status;
    res.status(status).json({ message: (err as Error).message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation error',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ message: 'Invalid ID format' });
    return;
  }

  if ((err as any).code === 11000) {
    res.status(409).json({ message: 'Duplicate entry' });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
};
