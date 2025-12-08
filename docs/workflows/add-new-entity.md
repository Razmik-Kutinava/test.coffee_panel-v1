# Workflow: Добавление новой сущности

## Overview

Пошаговая инструкция по добавлению новой сущности в проект. Принцип: **Prisma Schema → БД → NestJS**.

## Quick Reference

```bash
# 1. Добавить модель в schema.prisma
# 2. Генерация и push
npx prisma generate
npx prisma db push

# 3. Создать NestJS модуль
npx @nestjs/cli g resource products

# 4. Обновить Service для работы с Prisma
# 5. Обновить DTO вручную
# 6. Запустить
npm run start:dev
```

## Detailed Guide

### ШАГ 1: Добавить модель в Prisma Schema

**Файл:** `backend/prisma/schema.prisma`

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Float
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Правила:**
- ✅ Используйте `@id @default(autoincrement())` для первичного ключа
- ✅ Используйте `@default(now())` для `createdAt`
- ✅ Используйте `@updatedAt` для `updatedAt`
- ✅ Используйте `String?` для опциональных полей
- ✅ Используйте `@unique` для уникальных полей

**Примеры типов:**
- `String` - текст
- `Int` - целое число
- `Float` - число с плавающей точкой
- `Boolean` - true/false
- `DateTime` - дата и время
- `String?` - опциональное поле

### ШАГ 2: Генерация Prisma Client и Push в БД

```bash
cd backend

# Генерация типов TypeScript
npx prisma generate

# Применение изменений к базе данных
npx prisma db push
```

**Что происходит:**
- `prisma generate` - создает типы в `node_modules/.prisma/client`
- `prisma db push` - создает/обновляет таблицы в Supabase

**Если `db push` зависает:**
```bash
# Альтернатива через Supabase CLI
supabase db push
```

**Проверка:**
```bash
# Открыть Prisma Studio для просмотра данных
npx prisma studio
```

### ШАГ 3: Создать NestJS модуль

```bash
cd backend
npx @nestjs/cli g resource products
```

**Вопросы CLI:**
- `What transport layer do you use?` → **REST API**
- `Would you like to generate CRUD entry points?` → **Yes**

**Что создается:**
```
src/products/
├── dto/
│   ├── create-product.dto.ts
│   └── update-product.dto.ts
├── products.controller.ts
├── products.service.ts
└── products.module.ts
```

### ШАГ 4: Обновить Service для работы с Prisma

**Файл:** `backend/src/products/products.service.ts`

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
- ✅ Использовать `PrismaService` (не создавать `PrismaClient` напрямую)
- ✅ Методы должны быть `async`
- ✅ Использовать типы из DTO

### ШАГ 5: Обновить DTO вручную

**⚠️ ВАЖНО:** DTO **НЕ обновляются автоматически** после изменения Prisma schema!

**Файл:** `backend/src/products/dto/create-product.dto.ts`

```typescript
import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

**Файл:** `backend/src/products/dto/update-product.dto.ts`

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

**Валидаторы:**
- `@IsString()` - строка
- `@IsNumber()` - число
- `@IsBoolean()` - boolean
- `@IsOptional()` - опциональное поле
- `@Min(0)` - минимальное значение
- `@IsEmail()` - email
- `@IsUrl()` - URL

### ШАГ 6: Добавить модуль в AppModule

**Файл:** `backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module'; // ← Добавить

@Module({
  imports: [
    PrismaModule,
    ProductsModule, // ← Добавить
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**Важно:**
- ✅ `PrismaModule` должен быть первым (глобальный модуль)
- ✅ Новый модуль добавляется в `imports`

### ШАГ 7: Запустить приложение

```bash
npm run start:dev
```

**Проверка:**
- Открыть `http://localhost:3001/products` (GET)
- Создать продукт через POST запрос

## Примеры

### Пример 1: Простая сущность (Category)

**Schema:**
```prisma
model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Service:**
```typescript
async findAll() {
  return this.prisma.category.findMany({
    orderBy: { name: 'asc' }
  });
}
```

### Пример 2: Сущность со связями

**Schema:**
```prisma
model Order {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  items     OrderItem[]
  createdAt DateTime @default(now())
}

model OrderItem {
  id        Int     @id @default(autoincrement())
  orderId   Int
  order     Order   @relation(fields: [orderId], references: [id])
  productId Int
  quantity  Int
}
```

**Service:**
```typescript
async findOne(id: number) {
  return this.prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });
}
```

## Common Issues

### Ошибка: "Property 'product' does not exist on type 'PrismaService'"

**Причина:** Не выполнен `npx prisma generate`

**Решение:**
```bash
npx prisma generate
```

### Ошибка: "Table does not exist"

**Причина:** Не выполнен `npx prisma db push`

**Решение:**
```bash
npx prisma db push
```

### Ошибка: "Validation failed"

**Причина:** DTO не обновлен после изменения schema

**Решение:** Обновить DTO вручную (ШАГ 5)

### Ошибка: "Module not found"

**Причина:** Модуль не добавлен в `app.module.ts`

**Решение:** Добавить модуль в `imports` (ШАГ 6)

## Checklist

- [ ] Модель добавлена в `schema.prisma`
- [ ] Выполнен `npx prisma generate`
- [ ] Выполнен `npx prisma db push`
- [ ] Создан NestJS модуль через CLI
- [ ] Service обновлен для работы с Prisma
- [ ] DTO обновлены вручную с валидацией
- [ ] Модуль добавлен в `app.module.ts`
- [ ] Приложение запускается без ошибок
- [ ] API endpoints работают

## Related Docs

- [Database Prisma](../tech-stack/database-prisma.md)
- [Backend NestJS](../tech-stack/backend-nestjs.md)
- [Backend Developer Guide](../team/backend-developer.md)

