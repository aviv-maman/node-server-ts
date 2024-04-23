// declare module 'perfect-express-sanitizer' {
//   function prepareSanitize(
//     data: any,
//     options?: {
//       xss: boolean;
//       sql: boolean;
//       noSql: boolean;
//       sqlLevel: number;
//       noSqlLevel: number;
//       level: any;
//     }
//   ): any;
//   function clean(
//     options?: object,
//     whiteList?: any[],
//     only?: string[]
//   ): (req: any, res: any, next: any) => void;
// }

interface Files {
  imageCover?: Express.Multer.File[];
  images?: Express.Multer.File[];
}

declare namespace Express {
  namespace Multer {
    interface File {
      publicPath?: string;
    }
  }

  interface Request {
    requestTime?: string;
    user?: any;
    file?: Express.Multer.File;
    files?: Files;
    session: SessionExpress & Partial<SessionDataExpress> & CustomSessionFields;
  }

  interface CustomSessionFields {
    user?: string;
  }

  type RequestExpress = import('express-serve-static-core').Request;
  type SessionExpress = import('express-session').Session;
  type SessionDataExpress = import('express-session').SessionData;
}
