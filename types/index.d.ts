declare module 'perfect-express-sanitizer' {
  function prepareSanitize(
    data: any,
    options?: {
      xss: boolean;
      sql: boolean;
      noSql: boolean;
      sqlLevel: number;
      noSqlLevel: number;
      level: any;
    }
  ): any;
  function clean(
    options?: {},
    whiteList?: any[],
    only?: string[]
  ): (req: any, res: any, next: any) => void;
}

declare module 'xss-clean' {
  function xss(): void;
}

// interface File {
//   publicPath?: string;
// }

declare namespace Express {
  declare namespace Multer {
    interface File {
      publicPath?: string;
    }
  }
  interface Request {
    requestTime?: string;
    user?: any;
    file?: Express.Multer.File;
  }
}
