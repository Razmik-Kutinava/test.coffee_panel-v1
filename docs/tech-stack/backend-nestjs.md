# Backend: NestJS

## Overview

NestJS - прогрессивный Node.js framework для построения эффективных и масштабируемых серверных приложений. Использует TypeScript и следует архитектурным паттернам Angular.

## Quick Reference

```bash
# Создать новый ресурс
npx @nestjs/cli g resource products

# Запуск в dev режиме
npm run start:dev

# Сборка
npm run build
```

## Архитектура

### Модульная структура

```
src/
├── app.module.ts          # Корневой модуль
├── prisma/
│   ├── prisma.module.ts   # Глобальный модуль Prisma
│   └── prisma.service.ts  # Сервис для работы с БД
└── [entity]/
    ├── [entity].module.ts
    ├── [entity].controller.ts
    ├── [entity].service.ts
    └── dto/
```

### Компоненты

#### 1. Module (Модуль)
Группирует связанные компоненты.

```typescript
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // Если нужно использовать в других модулях
})
export class ProductsModule {}
```

#### 2. Controller (Контроллер)
Обрабатывает HTTP запросы.

```typescript
import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
```

**Декораторы:**
- `@Controller('path')` - базовый путь
- `@Get()`, `@Post()`, `@Patch()`, `@Delete()` - HTTP методы
- `@Body()` - тело запроса
- `@Param('id')` - параметр из URL
- `@Query()` - query параметры

#### 3. Service (Сервис)
Содержит бизнес-логику.

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({ data: createProductDto });
  }

  async findAll() {
    return this.prisma.product.findMany();
  }

  async findOne(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }
}
```

**Важно:**
- ✅ Использовать `@Injectable()` декоратор
- ✅ Инжектировать `PrismaService` через конструктор
- ✅ Методы должны быть `async`

#### 4. DTO (Data Transfer Object)
Валидация данных.

```typescript
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  description?: string;
}
```

## Dependency Injection

NestJS использует DI для управления зависимостями.

```typescript
// ✅ ПРАВИЛЬНО - через конструктор
@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}
}

// ❌ НЕПРАВИЛЬНО - создание вручную
@Injectable()
export class ProductsService {
  private prisma = new PrismaService(); // НЕ ДЕЛАТЬ!
}
```

## Guards

Защита маршрутов.

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return request.user !== undefined;
  }
}

// Использование
@Controller('products')
@UseGuards(AuthGuard)
export class ProductsController {}
```

## Interceptors

Перехват запросов/ответов.

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({ success: true, data }))
    );
  }
}
```

## Pipes

Валидация и трансформация данных.

```typescript
import { ValidationPipe } from '@nestjs/common';

// В main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true, // Удаляет лишние поля
  forbidNonWhitelisted: true, // Выбрасывает ошибку при лишних полях
  transform: true, // Автоматическая трансформация типов
}));
```

## Examples

### Пример: Поиск с фильтрацией

```typescript
@Get()
async findAll(
  @Query('search') search?: string,
  @Query('minPrice') minPrice?: string,
) {
  const where: any = {};
  
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  
  if (minPrice) {
    where.price = { gte: +minPrice };
  }
  
  return this.prisma.product.findMany({ where });
}
```

### Пример: Пагинация

```typescript
@Get()
async findAll(
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '10',
) {
  const skip = (+page - 1) * +limit;
  
  return this.prisma.product.findMany({
    skip,
    take: +limit,
  });
}
```

## Common Issues

### Ошибка: "Nest can't resolve dependencies"

**Причина:** Модуль не импортирован или сервис не экспортирован

**Решение:**
```typescript
// В модуле
@Module({
  imports: [PrismaModule], // ← Добавить
  providers: [ProductsService],
})
```

### Ошибка: "Validation failed"

**Причина:** DTO не валидируется

**Решение:**
```typescript
// В main.ts
app.useGlobalPipes(new ValidationPipe());
```

## Related Docs

- [Database Prisma](./database-prisma.md)
- [Workflow: Add New Entity](../workflows/add-new-entity.md)
- [Backend Developer Guide](../team/backend-developer.md)

