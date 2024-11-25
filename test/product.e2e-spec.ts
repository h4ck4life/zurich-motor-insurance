// test/product.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppModule } from './../src/app.module';
import { Product } from './../src/product/product.entity';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let productRepository: Repository<Product>;
  let jwtSecret: string;
  let adminToken: string;
  let userToken: string;

  const testProduct = {
    productCode: '1000',
    location: 'West Malaysia',
    price: 300,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST'),
            port: configService.get('DB_PORT'),
            username: configService.get('DB_USERNAME'),
            password: configService.get('DB_PASSWORD'),
            database: 'MOTOR_INSURANCE_WEBSITE_TEST',
            entities: [Product],
            synchronize: true,
          }),
          inject: [ConfigService],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    productRepository = moduleFixture.get('ProductRepository');
    const configService = moduleFixture.get<ConfigService>(ConfigService);
    jwtSecret = configService.get<string>('JWT_SECRET');

    // Generate test tokens
    adminToken = jwt.sign(
      { sub: '123', role: 'admin', email: 'admin@example.com' },
      jwtSecret,
      { expiresIn: '1h' },
    );

    userToken = jwt.sign(
      { sub: '456', role: 'user', email: 'user@example.com' },
      jwtSecret,
      { expiresIn: '1h' },
    );

    await app.init();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await productRepository.clear();
  });

  describe('POST /product', () => {
    it('should create a product with admin token', () => {
      return request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testProduct)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject(testProduct);
          expect(res.body.id).toBeDefined();
        });
    });

    it('should fail to create product with user token', () => {
      return request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testProduct)
        .expect(403);
    });

    it('should fail without authorization token', () => {
      return request(app.getHttpServer())
        .post('/product')
        .send(testProduct)
        .expect(401);
    });

    it('should fail with invalid product data', () => {
      return request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productCode: '',
          location: '',
          price: 'invalid',
        })
        .expect(400);
    });
  });

  describe('GET /product', () => {
    beforeEach(async () => {
      // Create a test product
      await productRepository.save(testProduct);
    });

    it('should get product with user token', () => {
      return request(app.getHttpServer())
        .get('/product')
        .query({
          productCode: testProduct.productCode,
          location: testProduct.location,
        })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject(testProduct);
          expect(res.body.id).toBeDefined();
        });
    });

    it('should get product with admin token', () => {
      return request(app.getHttpServer())
        .get('/product')
        .query({
          productCode: testProduct.productCode,
          location: testProduct.location,
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should fail without authorization token', () => {
      return request(app.getHttpServer())
        .get('/product')
        .query({
          productCode: testProduct.productCode,
          location: testProduct.location,
        })
        .expect(401);
    });

    it('should fail with invalid query parameters', () => {
      return request(app.getHttpServer())
        .get('/product')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/product')
        .query({
          productCode: 'nonexistent',
          location: 'nowhere',
        })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('PUT /product', () => {
    beforeEach(async () => {
      await productRepository.save(testProduct);
    });

    const updateData = {
      location: 'East Malaysia',
      price: 450,
    };

    it('should update product with admin token', () => {
      return request(app.getHttpServer())
        .put('/product')
        .query({ productCode: testProduct.productCode })
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            ...testProduct,
            ...updateData,
          });
        });
    });

    it('should fail to update product with user token', () => {
      return request(app.getHttpServer())
        .put('/product')
        .query({ productCode: testProduct.productCode })
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should fail without authorization token', () => {
      return request(app.getHttpServer())
        .put('/product')
        .query({ productCode: testProduct.productCode })
        .send(updateData)
        .expect(401);
    });

    it('should fail with invalid update data', () => {
      return request(app.getHttpServer())
        .put('/product')
        .query({ productCode: testProduct.productCode })
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          location: '',
          price: 'invalid',
        })
        .expect(400);
    });
  });

  describe('DELETE /product', () => {
    beforeEach(async () => {
      await productRepository.save(testProduct);
    });

    it('should delete product with admin token', () => {
      return request(app.getHttpServer())
        .delete('/product')
        .query({ productCode: testProduct.productCode })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should fail to delete product with user token', () => {
      return request(app.getHttpServer())
        .delete('/product')
        .query({ productCode: testProduct.productCode })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should fail without authorization token', () => {
      return request(app.getHttpServer())
        .delete('/product')
        .query({ productCode: testProduct.productCode })
        .expect(401);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .delete('/product')
        .query({ productCode: 'nonexistent' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
