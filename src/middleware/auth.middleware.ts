import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  role?: string;
  email?: string;
  exp?: number;
}

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
      this.logger.debug(`Token: ${token?.substring(0, 20)}...`);

      if (bearer !== 'Bearer' || !token) {
        this.logger.warn(
          `Invalid token format. Bearer: ${bearer}, Token exists: ${!!token}`,
        );
        throw new UnauthorizedException('Invalid token format');
      }

      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      this.logger.debug(`JWT Secret exists: ${!!jwtSecret}`);

      if (!jwtSecret) {
        this.logger.error(
          'JWT_SECRET is not configured in environment variables',
        );
        throw new InternalServerErrorException('JWT_SECRET is not configured');
      }

      try {
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

        if (!decoded.sub) {
          throw new UnauthorizedException(
            'Invalid token: missing required claims',
          );
        }

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
          throw new UnauthorizedException('Token has expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
          throw new UnauthorizedException('Invalid token');
        }
        throw error;
      }
    } catch (error) {
      this.logger.error('Middleware error:', error);
      if (
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
