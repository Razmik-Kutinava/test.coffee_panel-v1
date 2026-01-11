import { IsEnum, IsNumber, IsOptional, IsString, MinLength, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @MinLength(2, { message: 'Название должно быть минимум 2 символа' })
  @MaxLength(100, { message: 'Название не должно превышать 100 символов' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Описание не должно превышать 2000 символов' })
  description?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    // Преобразуем пустую строку в undefined для опционального поля
    if (value === '' || value === null) {
      return undefined;
    }
    // Проверяем, является ли значение UUID
    // Если это не UUID (например, название категории), возвращаем undefined
    // Фронтенд должен нормализовать это перед отправкой, но на всякий случай проверяем здесь
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (value && !uuidRegex.test(value)) {
      // Это не UUID, возможно название категории - возвращаем undefined
      return undefined;
    }
    return value;
  })
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    // Преобразуем пустую строку в null для опционального поля
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    // Проверяем, что это валидный URL (базовая проверка)
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return null;
  })
  imageUrl?: string | null;

  @IsOptional()
  isFeatured?: boolean;

  @IsOptional()
  isNew?: boolean;

  @Transform(({ value }) => {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return 0;
    }
    return num;
  })
  @IsNumber({}, { message: 'Цена должна быть числом' })
  @Min(0, { message: 'Цена не может быть отрицательной' })
  price: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
