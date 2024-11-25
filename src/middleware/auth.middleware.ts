import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.debug('=== Starting Auth Middleware ===');
    this.logger.debug(`Request Path: ${req.path}`);
    this.logger.debug(`Request Method: ${req.method}`);

    try {
      const authHeader = req.headers.authorization;
      this.logger.debug(`Auth Header: ${authHeader}`);

      if (!authHeader) {
        this.logger.warn('No authorization header found');
        throw new UnauthorizedException('No token provided');
      }

      const [bearer, token] = authHeader.split(' ');
      this.logger.debug(`Bearer: ${bearer}`);
      this.logger.debug(`Token: ${token?.substring(0, 20)}...`); // Only log part of the token for security

      if (bearer !== 'Bearer' || !token) {
        this.logger.warn(
          `Invalid token format. Bearer: ${bearer}, Token exists: ${!!token}`,
        );
        throw new UnauthorizedException('Invalid token format');
      }

      try {
        const jwtSecret = this.configService.get<string>('JWT_SECRET');
        this.logger.debug(`JWT Secret exists: ${!!jwtSecret}`);

        if (!jwtSecret) {
          this.logger.error(
            'JWT_SECRET is not configured in environment variables',
          );
          throw new Error('JWT_SECRET is not configured');
        }

        const decoded = jwt.verify(token, jwtSecret) as any;
        this.logger.debug('Token verified successfully');
        this.logger.debug(
          `Decoded token payload: ${JSON.stringify(
            {
              sub: decoded.sub,
              role: decoded.role,
              email: decoded.email,
              exp: decoded.exp,
            },
            null,
            2,
          )}`,
        );

        req['user'] = {
          id: decoded.sub,
          role: decoded.role,
          email: decoded.email,
        };
        this.logger.debug(`User context set: ${JSON.stringify(req['user'])}`);

        next();
      } catch (error) {
        this.logger.error('Token verification failed:', error);
        if (error instanceof jwt.TokenExpiredError) {
          this.logger.warn('Token has expired');
          throw new UnauthorizedException('Token has expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
          this.logger.warn(`Invalid token: ${error.message}`);
          throw new UnauthorizedException('Invalid token');
        }
        throw error;
      }
    } catch (error) {
      this.logger.error('Middleware error:', error);
      throw new UnauthorizedException(error.message);
    }
  }
}
