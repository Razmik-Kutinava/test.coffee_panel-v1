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
  UsePipes,
  UploadedFile,
  BadRequestException,
  Logger,
  Options,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { Request } from 'express';
import { ProductsService } from './products.service';
import { StorageService } from '../storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from '@prisma/client';

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly storageService: StorageService,
  ) {}

  // ⚠️ ВАЖНО: Маршрут upload-image должен быть ПЕРВЫМ перед всеми остальными
  // Это гарантирует, что запросы на /products/upload-image не попадут в динамический :id маршрут
  
  // Специальный endpoint для проверки конфигурации Supabase (только для отладки)
  @Get('storage-status')
  checkStorageStatus() {
    const hasSupabaseUrl = !!process.env.SUPABASE_URL;
    const hasSupabaseServiceKey = !!process.env.SUPABASE_SERVICE_KEY;
    const hasSupabaseServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnyKey = hasSupabaseServiceKey || hasSupabaseServiceRoleKey;
    const isConfigured = this.storageService.isConfigured();

    this.logger.log(`Storage Status Check: URL=${hasSupabaseUrl}, SERVICE_KEY=${hasSupabaseServiceKey}, SERVICE_ROLE_KEY=${hasSupabaseServiceRoleKey}, Configured=${isConfigured}`);

    return {
      configured: isConfigured,
      hasSupabaseUrl,
      hasSupabaseServiceKey,
      hasSupabaseServiceRoleKey,
      hasAnyKey,
      supabaseUrl: hasSupabaseUrl ? process.env.SUPABASE_URL : 'NOT SET',
      serviceKeyLength: process.env.SUPABASE_SERVICE_KEY?.length || 0,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      message: isConfigured
        ? 'Supabase Storage настроен корректно'
        : 'Supabase Storage НЕ настроен. Проверьте переменные окружения SUPABASE_URL и (SUPABASE_SERVICE_KEY или SUPABASE_SERVICE_ROLE_KEY)',
    };
  }

  @Options('upload-image')
  handleUploadImageOptions() {
    this.logger.log('OPTIONS /products/upload-image - Preflight запрос');
    return { status: 'ok' };
  }

  @Post('upload-image')
  @UsePipes(new ValidationPipe({ skipMissingProperties: true, whitelist: false, transform: false }))
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      preservePath: false,
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    this.logger.log(`📥 Incoming request: method=${req.method}, path=${req.path}, url=${req.url}`);
    this.logger.log(`POST /products/upload-image - Получен запрос на загрузку изображения`);

    if (!file) {
      this.logger.error('❌ Файл не был загружен. Проверьте, что поле формы называется "image"');
      throw new BadRequestException('Файл не был загружен. Убедитесь, что поле формы называется "image"');
    }

    this.logger.log(`File received: filename=${file.originalname}, size=${file.size} bytes, mimetype=${file.mimetype}, buffer=${file.buffer ? `present (${file.buffer.length} bytes)` : 'missing'}`);

    try {
      this.logger.log(`📤 Загрузка изображения в Supabase Storage: ${file.originalname}`);
      const imageUrl = await this.storageService.uploadImage(file);
      this.logger.log(`✅ Изображение успешно загружено: ${imageUrl}`);

      return {
        imageUrl,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error: any) {
      this.logger.error(`❌ Ошибка при загрузке изображения: ${error.message}`, error.stack);
      
      // Если ошибка уже BadRequestException, просто пробрасываем её
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Ошибка при загрузке изображения: ${error.message || 'Неизвестная ошибка'}`);
    }
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    this.logger.log(`POST /products - Создание товара: name=${dto.name}, imageUrl=${dto.imageUrl || '(null/undefined)'}, imageUrl type=${typeof dto.imageUrl}`);
    return this.productsService.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: ProductStatus, @Query('categoryId') categoryId?: string) {
    return this.productsService.findAll(status, categoryId);
  }

  // ⚠️ ВАЖНО: Специфичные маршруты должны быть ПЕРЕД динамическими (:id)
  @Get('categories')
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('stats')
  getStats() {
    return this.productsService.getStats();
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

  @Delete('force/by-name/:name')
  forceDeleteByName(@Param('name') name: string) {
    return this.productsService.forceDeleteByName(name);
  }

  // ⚠️ ВАЖНО: Динамические маршруты (:id) должны быть В САМОМ КОНЦЕ
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    // Защита от попадания upload-image в этот маршрут
    if (id === 'upload-image') {
      this.logger.warn(`⚠️ Запрос upload-image попал в GET(':id'). Метод: ${req.method}, URL: ${req.url}`);
      throw new BadRequestException('Используйте POST /products/upload-image для загрузки изображений');
    }
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    this.logger.log(`PATCH /products/${id} - Обновление товара: imageUrl=${dto.imageUrl !== undefined ? (dto.imageUrl || '(пустая строка)') : '(не передан)'}, imageUrl type=${typeof dto.imageUrl}`);
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
}
