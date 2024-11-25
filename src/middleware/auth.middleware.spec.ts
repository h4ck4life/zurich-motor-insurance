import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { AuthMiddleware } from './auth.middleware';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let configService: ConfigService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  const JWT_SECRET = 'test-secret';
  const validToken = jwt.sign(
    { sub: '123', role: 'admin', email: 'test@example.com' },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

  beforeEach(async () => {
    mockRequest = {
      path: '/test',
      method: 'GET',
      headers: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthMiddleware,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'JWT_SECRET') return JWT_SECRET;
              return null;
            }),
          },
        },
      ],
    }).compile();

    middleware = module.get<AuthMiddleware>(AuthMiddleware);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('JWT verification', () => {
    it('should throw InternalServerErrorException when JWT_SECRET is not configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      expect(() =>
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        ),
      ).toThrow(InternalServerErrorException);
      expect(() =>
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        ),
      ).toThrow('JWT_SECRET is not configured');
    });

    it('should successfully verify valid token and set user context', () => {
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest['user']).toBeDefined();
      expect(mockRequest['user']).toEqual({
        id: '123',
        role: 'admin',
        email: 'test@example.com',
      });
    });

    it('should allow token with minimal required properties (sub)', () => {
      const minimalToken = jwt.sign({ sub: '123' }, JWT_SECRET);
      mockRequest.headers = { authorization: `Bearer ${minimalToken}` };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest['user']).toEqual({
        id: '123',
        role: undefined,
        email: undefined,
      });
    });
  });
});
