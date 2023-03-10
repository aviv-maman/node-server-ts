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

interface File {
  mimetype: string;
  size: number;
  filename: string;
  path: string;
  publicPath?: string;
}

declare namespace Express {
  interface Request {
    requestTime?: string;
    user?: any;
    file?: File;
  }
}
