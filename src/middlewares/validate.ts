
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Creates a validation middleware for the specified request part.
 *
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (body, query, params)
 *
 * @example
 * router.post('/records', validate(createRecordSchema, 'body'), createRecord);
 * router.get('/records', validate(filterSchema, 'query'), getRecords);
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req[target]);

      if (req[target] && typeof req[target] === 'object') {
        Object.keys(req[target]).forEach((key) => delete (req as any)[target][key]);
        Object.assign(req[target], result);
      } else {
        (req as any)[target] = result;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError || (error as any).name === 'ZodError') {
        const zodErr = error as any;
        const formattedErrors = (zodErr.errors || zodErr.issues || []).map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors,
        });
        return;
      }

      next(error);
    }
  };
}
