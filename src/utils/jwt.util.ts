import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../auth/jwt.interface';

const JWT_SECRET = process.env.JWT_SECRET || 'custom-secret-key';

export const generateToken = (
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};
