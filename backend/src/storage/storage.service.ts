import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient;
  private readonly bucketName = 'product-images';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      this.logger.warn(
        '⚠️ SUPABASE_URL или SUPABASE_SERVICE_KEY не настроены. Загрузка изображений будет недоступна.',
      );
      this.logger.warn('💡 Добавьте переменные в .env файл:');
      this.logger.warn('   SUPABASE_URL=https://your-project.supabase.co');
      this.logger.warn('   SUPABASE_SERVICE_KEY=your-service-role-key');
    } else {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  /**
   * Загружает изображение в Supabase Storage
   * @param file - Файл изображения
   * @returns Публичный URL загруженного изображения
   */
  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!this.supabase) {
      throw new BadRequestException(
        'Supabase Storage не настроен. Проверьте переменные окружения SUPABASE_URL и SUPABASE_SERVICE_KEY.',
      );
    }

    // Валидация типа файла
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Неподдерживаемый тип файла: ${file.mimetype}. Разрешены: jpeg, jpg, png, webp, gif`,
      );
    }

    // Валидация размера (макс 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        `Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(2)}MB. Максимальный размер: 5MB`,
      );
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const extension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `product-${timestamp}-${random}.${extension}`;
    const filePath = `${fileName}`;

    try {
      // Получаем buffer из файла
      // В NestJS с FileInterceptor по умолчанию используется memory storage
      // file.buffer доступен напрямую
      if (!file.buffer) {
        throw new BadRequestException('Файл не содержит данных (buffer отсутствует)');
      }

      // Загружаем файл в Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false, // Не перезаписывать существующие файлы
        });

      if (error) {
        this.logger.error(`Ошибка загрузки в Supabase Storage: ${error.message}`, error);
        throw new BadRequestException(`Ошибка загрузки изображения: ${error.message}`);
      }

      // Получаем публичный URL
      const {
        data: { publicUrl },
      } = this.supabase.storage.from(this.bucketName).getPublicUrl(filePath);

      this.logger.log(`✅ Изображение загружено: ${publicUrl}`);
      return publicUrl;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Неожиданная ошибка при загрузке изображения: ${error.message}`, error);
      throw new BadRequestException(`Ошибка загрузки изображения: ${error.message}`);
    }
  }

  /**
   * Удаляет изображение из Supabase Storage
   * @param imageUrl - Публичный URL изображения
   */
  async deleteImage(imageUrl: string): Promise<void> {
    if (!this.supabase || !imageUrl) {
      return;
    }

    try {
      // Извлекаем путь к файлу из URL
      // URL формат: https://project.supabase.co/storage/v1/object/public/product-images/filename.jpg
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      if (!fileName || !fileName.startsWith('product-')) {
        this.logger.warn(`Некорректный формат URL изображения: ${imageUrl}`);
        return;
      }

      const { error } = await this.supabase.storage.from(this.bucketName).remove([fileName]);

      if (error) {
        this.logger.error(`Ошибка удаления изображения: ${error.message}`, error);
        // Не выбрасываем ошибку, так как файл может уже быть удален
      } else {
        this.logger.log(`✅ Изображение удалено: ${fileName}`);
      }
    } catch (error: any) {
      this.logger.error(`Ошибка при удалении изображения: ${error.message}`, error);
      // Не выбрасываем ошибку, чтобы не блокировать удаление товара
    }
  }

  /**
   * Проверяет, настроен ли Supabase Storage
   */
  isConfigured(): boolean {
    return !!this.supabase;
  }
}

