import { IsString, IsOptional, IsBoolean, IsNumber, MinLength } from 'class-validator';

export class CreateModifierOptionDto {
  @IsString()
  @MinLength(1)
  groupId: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

