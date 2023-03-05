import { NextFunction, Request, Response } from 'express';

export const catchAsync =
  async (fn: (req: Request, res: Response, next: NextFunction) => any) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
