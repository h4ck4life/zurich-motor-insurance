import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from './product/dto/product.dto';

describe('ProductService', () => {
  let service: ProductService;
  let repository: Repository<Product>;

  const mockProduct = {
    id: 1,
    productCode: '1000',
    location: 'West Malaysia',
    price: 300,
  };

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
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProduct);

      const result = await service.findProduct('1000', 'West Malaysia');

      expect(result).toEqual(mockProduct);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { productCode: '1000', location: 'West Malaysia' },
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.findProduct('1000', 'West Malaysia'),
      ).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { productCode: '1000', location: 'West Malaysia' },
      });
    });
  });

  describe('createProduct', () => {
    it('should successfully create a product', async () => {
      const createProductDto: CreateProductDto = {
        productCode: '1000',
        location: 'West Malaysia',
        price: 300,
      };

      jest.spyOn(repository, 'create').mockReturnValue(mockProduct);
      jest.spyOn(repository, 'save').mockResolvedValue(mockProduct);

      const result = await service.createProduct(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(repository.create).toHaveBeenCalledWith(createProductDto);
      expect(repository.save).toHaveBeenCalledWith(mockProduct);
    });

    it('should handle create product failure', async () => {
      const createProductDto: CreateProductDto = {
        productCode: '1000',
        location: 'West Malaysia',
        price: 300,
      };

      jest
        .spyOn(repository, 'save')
        .mockRejectedValue(new Error('Save failed'));

      await expect(service.createProduct(createProductDto)).rejects.toThrow(
        'Save failed',
      );
    });
  });

  describe('updateProduct', () => {
    const updateProductDto: UpdateProductDto = {
      location: 'East Malaysia',
      price: 450,
    };

    it('should successfully update a product', async () => {
      const updatedProduct = { ...mockProduct, ...updateProductDto };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedProduct);

      const result = await service.updateProduct('1000', updateProductDto);

      expect(result).toEqual(updatedProduct);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { productCode: '1000' },
      });
      expect(repository.save).toHaveBeenCalledWith(updatedProduct);
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateProduct('1000', updateProductDto),
      ).rejects.toThrow(NotFoundException);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { productCode: '1000' },
      });
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should handle update failure', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProduct);
      jest
        .spyOn(repository, 'save')
        .mockRejectedValue(new Error('Update failed'));

      await expect(
        service.updateProduct('1000', updateProductDto),
      ).rejects.toThrow('Update failed');

      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('should successfully delete a product', async () => {
      const deleteResult: DeleteResult = {
        raw: [],
        affected: 1,
      };
      jest.spyOn(repository, 'delete').mockResolvedValue(deleteResult);

      await service.deleteProduct('1000');

      expect(repository.delete).toHaveBeenCalledWith({ productCode: '1000' });
    });

    it('should throw NotFoundException when deleting non-existent product', async () => {
      const deleteResult: DeleteResult = {
        raw: [],
        affected: 0,
      };
      jest.spyOn(repository, 'delete').mockResolvedValue(deleteResult);

      await expect(service.deleteProduct('1000')).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.delete).toHaveBeenCalledWith({ productCode: '1000' });
    });

    it('should handle delete failure', async () => {
      jest
        .spyOn(repository, 'delete')
        .mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteProduct('1000')).rejects.toThrow(
        'Delete failed',
      );

      expect(repository.delete).toHaveBeenCalledWith({ productCode: '1000' });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
