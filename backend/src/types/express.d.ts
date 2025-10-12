import { User } from '../generated/client';
import 'multer';

declare global {
  namespace Express {
    interface Request {
      user: User;
      file?: Express.Multer.File;
      }
  }
}