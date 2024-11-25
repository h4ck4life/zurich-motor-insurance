import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './product/dto/product.dto';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('product')
@Controller('product')
@ApiBearerAuth()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get product price' })
  async getProduct(
    @Query('productCode') productCode: string,
    @Query('location') location: string,
  ) {
    return this.productService.findProduct(productCode, location);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create new product' })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productService.createProduct(createProductDto);
  }

  @Put()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update product' })
  async updateProduct(
    @Query('productCode') productCode: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.updateProduct(productCode, updateProductDto);
  }

  @Delete()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete product' })
  async deleteProduct(@Query('productCode') productCode: string) {
    return this.productService.deleteProduct(productCode);
  }
}
