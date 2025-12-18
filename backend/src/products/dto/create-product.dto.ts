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
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
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
  imageUrl?: string;

  @IsOptional()
  isFeatured?: boolean;

  @IsOptional()
  isNew?: boolean;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0, { message: 'Цена не может быть отрицательной' })
  price: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
