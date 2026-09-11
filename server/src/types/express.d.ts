
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: Partial<IUser> & { _id: string };
    }
  }
}

export {};
