import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, MinLength, MaxLength, Min } from 'class-validator';
import { PromocodeScope, PromocodeType } from '@prisma/client';

export class CreatePromocodeDto {
  @IsString()
  @MinLength(3, { message: 'Код промокода должен быть минимум 3 символа' })
  @MaxLength(50, { message: 'Код промокода не должен превышать 50 символов' })
  code: string;

  @IsEnum(PromocodeType)
  type: PromocodeType;

  @IsNumber()
  @Min(0, { message: 'Значение не может быть отрицательным' })
  value: number;

  @IsEnum(PromocodeScope)
  scope: PromocodeScope;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
