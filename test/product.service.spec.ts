/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from '../src/product/product.service';
import { Product } from '../src/product/product.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProductService', () => {
    let service: ProductService;
    let repository: Repository<Product>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductService,
                {
                    provide: getRepositoryToken(Product),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ProductService>(ProductService);
        repository = module.get<Repository<Product>>(getRepositoryToken(Product));
    });

    describe('findProduct', () => {
        it('should return a product when found', async () => {
            const mockProduct = { id: 1, productCode: '1000', location: 'West Malaysia', price: 300 };
            jest.spyOn(repository, 'findOne').mockResolvedValue(mockProduct);

            const result = await service.findProduct('1000', 'West Malaysia');
            expect(result).toEqual(mockProduct);
        });

        it('should throw NotFoundException when product not found', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(null);

            await expect(service.findProduct('1000', 'West Malaysia')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});