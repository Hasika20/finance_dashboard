
import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface SuccessResponse {
  success: true;
  message: string;
  data?: any;
  pagination?: PaginationMeta;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: any;
}

export function sendSuccess(
  res: Response,
  data: any,
  message = 'Success',
  statusCode = 200,
  pagination?: PaginationMeta
): void {
  const response: SuccessResponse = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: any
): void {
  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
}
