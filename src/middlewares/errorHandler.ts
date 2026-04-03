
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (env.NODE_ENV === 'development') {
    console.error('🔥 Error:', err.message);
    if (!(err instanceof AppError)) {
      console.error(err.stack);
    }
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError || (err as any).name === 'ZodError') {
    const zodErr = err as any;
    const formattedErrors = (zodErr.errors || zodErr.issues || []).map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        res.status(409).json({
          success: false,
          message: `A record with this ${target} already exists`,
        });
        return;
      }
      case 'P2025': {
        res.status(404).json({
          success: false,
          message: 'The requested record was not found',
        });
        return;
      }
      case 'P2003': {
        res.status(400).json({
          success: false,
          message: 'Referenced record does not exist',
        });
        return;
      }
      default: {
        res.status(400).json({
          success: false,
          message: `Database error: ${err.message}`,
        });
        return;
      }
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Invalid data format provided',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message || 'Internal Server Error',
  });
}
