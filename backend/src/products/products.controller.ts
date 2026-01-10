import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { StorageService } from '../storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: ProductStatus, @Query('categoryId') categoryId?: string) {
    return this.productsService.findAll(status, categoryId);
  }

  @Get('categories')
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('stats')
  getStats() {
    return this.productsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.productsService.toggleStatus(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Delete('force/by-name/:name')
  forceDeleteByName(@Param('name') name: string) {
    return this.productsService.forceDeleteByName(name);
  }

  @Post('cleanup/orphaned')
  async cleanupOrphaned() {
    const latte = await this.productsService.forceDeleteByName('латте');
    const cappuccino = await this.productsService.forceDeleteByName('капучино');
    return {
      latte,
      cappuccino,
      message: 'Очистка завершена',
    };
  }

  @Post('sync-modifiers')
  async syncModifiers() {
    return this.productsService.syncAllModifiers();
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }

    const imageUrl = await this.storageService.uploadImage(file);

    return {
      imageUrl,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
