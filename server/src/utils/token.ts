
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (payload: Record<string, unknown>) =>
  jwt.sign(payload, env.JWT_SECRET as jwt.Secret, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

export const verifyToken = <T>(token: string) => jwt.verify(token, env.JWT_SECRET) as T;
