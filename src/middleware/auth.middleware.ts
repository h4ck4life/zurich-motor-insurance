/* eslint-disable prettier/prettier */
import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const userRole = req.headers['user-role'];

        if (!userRole) {
            throw new UnauthorizedException('No role provided');
        }

        // Store role in request for later use
        req['userRole'] = userRole;
        next();
    }
}
