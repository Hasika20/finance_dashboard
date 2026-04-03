
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('No authentication token provided. Please include a Bearer token in the Authorization header.');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw AppError.unauthorized('Malformed authorization header');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      throw AppError.unauthorized('User associated with this token no longer exists');
    }

    if (!user.isActive) {
      throw AppError.unauthorized('Your account has been deactivated. Contact an administrator.');
    }

    res.locals.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized('Invalid token. Please log in again.'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(AppError.unauthorized('Token has expired. Please log in again.'));
    } else {
      next(AppError.unauthorized('Authentication failed'));
    }
  }
}
