import { NextFunction } from 'express';

module.exports = (fn) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res, next).catch(next);
};
