import type { RequestUser } from './request';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    user?: RequestUser;
  }
}
