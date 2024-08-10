import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { RoleType } from '../entities/enums/RoleType';

// AccessToken 검증 미들웨어
export const isLoggedin = (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.header('Authorization')?.replace('Bearer ', '');

    if (!accessToken) {
        return res.status(401).json({ message: 'AccessToken이 필요합니다.' });
    }

    try {
        const decodedToken = verifyAccessToken(accessToken);
        req.user = {
            userId: decodedToken.userId,
            role: decodedToken.role as RoleType,
        };

        next();
    } catch (error) {
        res.status(403).json({ message: '유효하지 않은 AccessToken입니다.' });
    }
};

// 역할 검증 미들웨어
export const checkRole = (...requiredRoles: RoleType[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        if (!requiredRoles.includes(user.role)) {
            return res.status(403).json({ message: '권한이 없습니다.' });
        }

        next();
    };
};
