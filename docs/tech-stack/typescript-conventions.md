# TypeScript Conventions

## Overview

Правила и соглашения по использованию TypeScript в проекте для обеспечения type-safety и читаемости кода.

## Quick Reference

```typescript
// ✅ ПРАВИЛЬНО
export class CreateProductDto {
  name: string;
  price: number;
}

// ❌ НЕПРАВИЛЬНО
export default class CreateProductDto {
  name: any;
  price: any;
}
```

## Правила типизации

### 1. Избегать `any`

```typescript
// ✅ ПРАВИЛЬНО
function processData(data: string): string {
  return data.toUpperCase();
}

// ❌ НЕПРАВИЛЬНО
function processData(data: any): any {
  return data.toUpperCase();
}
```

### 2. Использовать явные типы

```typescript
// ✅ ПРАВИЛЬНО
const userId: number = 1;
const userName: string = 'John';

// ❌ НЕПРАВИЛЬНО
const userId = 1; // TypeScript выведет тип, но лучше явно
const userName: any = 'John';
```

### 3. Использовать интерфейсы для объектов

```typescript
// ✅ ПРАВИЛЬНО
interface User {
  id: number;
  email: string;
  name?: string;
}

const user: User = {
  id: 1,
  email: 'user@example.com',
};

// ❌ НЕПРАВИЛЬНО
const user: any = {
  id: 1,
  email: 'user@example.com',
};
```

## Экспорты

### Named Exports (Рекомендуется)

```typescript
// ✅ ПРАВИЛЬНО
export class ProductService {}
export function calculatePrice() {}
export const API_URL = 'http://localhost:3001';

// Использование
import { ProductService, calculatePrice, API_URL } from './product';
```

### Default Exports (Избегать)

```typescript
// ❌ НЕПРАВИЛЬНО
export default class ProductService {}

// Использование
import ProductService from './product'; // Неясно что импортируется
```

## Типы из Prisma

### Использование автогенерированных типов

```typescript
// ✅ ПРАВИЛЬНО
import { User, Product } from '.prisma/client';

const user: User = {
  id: 1,
  email: 'user@example.com',
  name: 'John',
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Типы для операций

```typescript
import { Prisma } from '.prisma/client';

// Тип для создания
type CreateUserInput = Prisma.UserCreateInput;

// Тип для обновления
type UpdateUserInput = Prisma.UserUpdateInput;

// Тип для where
type UserWhereInput = Prisma.UserWhereInput;
```

## DTO типы

### Создание DTO

```typescript
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  description?: string;
}
```

### Обновление DTO

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

## Типы для функций

### Явные типы параметров и возврата

```typescript
// ✅ ПРАВИЛЬНО
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

// ❌ НЕПРАВИЛЬНО
function calculateTotal(price: any, quantity: any): any {
  return price * quantity;
}
```

### Async функции

```typescript
// ✅ ПРАВИЛЬНО
async function fetchUser(id: number): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');
  return user;
}

// ❌ НЕПРАВИЛЬНО
async function fetchUser(id: any): Promise<any> {
  return await prisma.user.findUnique({ where: { id } });
}
```

## Типы для Prisma Queries

### Типизация where

```typescript
import { Prisma } from '.prisma/client';

const where: Prisma.UserWhereInput = {
  email: { contains: '@gmail.com' },
  isActive: true,
};

const users = await prisma.user.findMany({ where });
```

### Типизация include

```typescript
import { Prisma } from '.prisma/client';

const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: true,
  },
});

// Тип результата
type UserWithPosts = Prisma.UserGetPayload<{
  include: { posts: true };
}>;
```

## Обработка ошибок

### Типизация ошибок

```typescript
// ✅ ПРАВИЛЬНО
try {
  await prisma.user.create({ data });
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
  throw error;
}

// ❌ НЕПРАВИЛЬНО
try {
  await prisma.user.create({ data });
} catch (error: any) {
  console.error(error.message); // Может быть undefined
}
```

## Type Guards

```typescript
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj
  );
}

const data: unknown = await fetchUser(1);
if (isUser(data)) {
  console.log(data.email); // TypeScript знает что это User
}
```

## Common Issues

### Ошибка: "Property does not exist on type"

**Причина:** Тип не содержит свойство

**Решение:**
```typescript
// Проверить тип
type UserKeys = keyof User;

// Использовать type assertion (осторожно!)
const user = data as User;
```

### Ошибка: "Type 'X' is not assignable to type 'Y'"

**Причина:** Несовместимые типы

**Решение:**
```typescript
// Использовать правильный тип
const user: User = { ... };

// Или преобразовать
const user = data as User;
```

## Related Docs

- [Backend NestJS](./backend-nestjs.md)
- [Database Prisma](./database-prisma.md)

