import { randomBytes } from 'crypto';
export const generateId = () => randomBytes(16).toString('hex');