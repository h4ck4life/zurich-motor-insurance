import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './product/dto/product.dto';
import { NotFoundException } from '@nestjs/common';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProduct = {
    id: 1,
    productCode: '1000',
    location: 'West Malaysia',
    price: 300,
  };

  const mockProductService = {
    findProduct: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getProduct', () => {
    it('should return a product', async () => {
      jest.spyOn(service, 'findProduct').mockResolvedValue(mockProduct);

      const result = await controller.getProduct('1000', 'West Malaysia');

      expect(result).toBe(mockProduct);
      expect(service.findProduct).toHaveBeenCalledWith('1000', 'West Malaysia');
    });

    it('should handle product not found', async () => {
      jest
        .spyOn(service, 'findProduct')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.getProduct('nonexistent', 'nowhere'),
      ).rejects.toThrow(NotFoundException);

      expect(service.findProduct).toHaveBeenCalledWith(
        'nonexistent',
        'nowhere',
      );
    });

    it('should propagate service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'findProduct').mockRejectedValue(error);

      await expect(
        controller.getProduct('1000', 'West Malaysia'),
      ).rejects.toThrow(error);
    });
  });

  describe('createProduct', () => {
    const createProductDto: CreateProductDto = {
      productCode: '1000',
      location: 'West Malaysia',
      price: 300,
    };

    it('should create a product', async () => {
      jest.spyOn(service, 'createProduct').mockResolvedValue(mockProduct);

      const result = await controller.createProduct(createProductDto);

      expect(result).toBe(mockProduct);
      expect(service.createProduct).toHaveBeenCalledWith(createProductDto);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'createProduct').mockRejectedValue(error);

      await expect(controller.createProduct(createProductDto)).rejects.toThrow(
        error,
      );
    });
  });

  describe('updateProduct', () => {
    const updateProductDto: UpdateProductDto = {
      location: 'East Malaysia',
      price: 450,
    };

    it('should update a product', async () => {
      const updatedProduct = { ...mockProduct, ...updateProductDto };
      jest.spyOn(service, 'updateProduct').mockResolvedValue(updatedProduct);

      const result = await controller.updateProduct('1000', updateProductDto);

      expect(result).toBe(updatedProduct);
      expect(service.updateProduct).toHaveBeenCalledWith(
        '1000',
        updateProductDto,
      );
    });

    it('should handle product not found', async () => {
      jest
        .spyOn(service, 'updateProduct')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.updateProduct('nonexistent', updateProductDto),
      ).rejects.toThrow(NotFoundException);

      expect(service.updateProduct).toHaveBeenCalledWith(
        'nonexistent',
        updateProductDto,
      );
    });

    it('should propagate service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'updateProduct').mockRejectedValue(error);

      await expect(
        controller.updateProduct('1000', updateProductDto),
      ).rejects.toThrow(error);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      jest.spyOn(service, 'deleteProduct').mockResolvedValue(undefined);

      await controller.deleteProduct('1000');

      expect(service.deleteProduct).toHaveBeenCalledWith('1000');
    });

    it('should handle product not found', async () => {
      jest
        .spyOn(service, 'deleteProduct')
        .mockRejectedValue(new NotFoundException());

      await expect(controller.deleteProduct('nonexistent')).rejects.toThrow(
        NotFoundException,
      );

      expect(service.deleteProduct).toHaveBeenCalledWith('nonexistent');
    });

    it('should propagate service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'deleteProduct').mockRejectedValue(error);

      await expect(controller.deleteProduct('1000')).rejects.toThrow(error);
    });
  });

  // Optional: Test Guard behavior
  describe('guards', () => {
    it('should have AdminGuard on protected routes', () => {
      const createMetadata = Reflect.getMetadata(
        '__guards__',
        controller.createProduct,
      );
      const updateMetadata = Reflect.getMetadata(
        '__guards__',
        controller.updateProduct,
      );
      const deleteMetadata = Reflect.getMetadata(
        '__guards__',
        controller.deleteProduct,
      );
      const getMetadata = Reflect.getMetadata(
        '__guards__',
        controller.getProduct,
      );

      // Admin routes should have guard
      expect(createMetadata).toBeDefined();
      expect(updateMetadata).toBeDefined();
      expect(deleteMetadata).toBeDefined();

      // Public route should not have guard
      expect(getMetadata).toBeUndefined();
    });
  });
});
