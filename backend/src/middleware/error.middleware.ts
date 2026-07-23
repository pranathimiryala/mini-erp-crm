import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      ApiResponse.error(err.message, err.statusCode)
    );
    return;
  }

  // MySQL duplicate entry error
  if ((err as any).code === 'ER_DUP_ENTRY') {
    res.status(409).json(
      ApiResponse.error('Duplicate entry. This record already exists.', 409)
    );
    return;
  }

  // MySQL foreign key constraint error
  if ((err as any).code === 'ER_NO_REFERENCED_ROW_2') {
    res.status(400).json(
      ApiResponse.error('Referenced record does not exist.', 400)
    );
    return;
  }

  // Default server error
  res.status(500).json(
    ApiResponse.error(
      process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
      500
    )
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(
    ApiResponse.error(`Route ${req.method} ${req.originalUrl} not found`, 404)
  );
};
