
import crypto from 'crypto';

export const sha256 = (value: Buffer | string) =>
  crypto.createHash('sha256').update(value).digest('hex');

export const randomToken = () => crypto.randomBytes(32).toString('hex');
