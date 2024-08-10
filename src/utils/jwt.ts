import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { RoleType } from '../entities/enums/RoleType';
config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

// AccessToken 발급
export const generateAccessToken = (userId: number, role: RoleType): string => {
    return jwt.sign({ userId, role }, JWT_ACCESS_SECRET, { expiresIn: '1h' });
};

// RefreshToken 발급
export const generateRefreshToken = (userId: number): string => {
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// AccessToken 검증
export const verifyAccessToken = (token: string): any => {
    return jwt.verify(token, JWT_ACCESS_SECRET);
};

// RefreshToken 검증
export const verifyRefreshToken = (token: string): any => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};
