# API Design

## Overview

Соглашения по проектированию REST API для обеспечения консистентности и удобства использования.

## Quick Reference

```typescript
// Стандартные endpoints
GET    /products          // Список
GET    /products/:id      // Один элемент
POST   /products          // Создание
PATCH  /products/:id      // Обновление
DELETE /products/:id     // Удаление
```

## RESTful Conventions

### HTTP Methods

- `GET` - получение данных
- `POST` - создание нового ресурса
- `PATCH` - частичное обновление
- `PUT` - полное обновление (не используется)
- `DELETE` - удаление

### URL Structure

```
/resource              # Коллекция
/resource/:id          # Конкретный ресурс
/resource/:id/sub      # Вложенный ресурс
```

### Примеры

```typescript
GET    /products              // Все продукты
GET    /products/1            // Продукт с id=1
POST   /products              // Создать продукт
PATCH  /products/1           // Обновить продукт
DELETE /products/1           // Удалить продукт
```

## Response Formats

### Успешный ответ

```typescript
// Один объект
{
  "id": 1,
  "name": "Product",
  "price": 99.99
}

// Массив объектов
[
  { "id": 1, "name": "Product 1" },
  { "id": 2, "name": "Product 2" }
]
```

### Ошибка

```typescript
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Стандартизированный формат (опционально)

```typescript
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Product"
  }
}
```

## Status Codes

### Успешные

- `200 OK` - успешный запрос
- `201 Created` - ресурс создан
- `204 No Content` - успешно, но нет контента

### Ошибки клиента

- `400 Bad Request` - неверный запрос
- `401 Unauthorized` - не авторизован
- `403 Forbidden` - нет доступа
- `404 Not Found` - ресурс не найден
- `422 Unprocessable Entity` - ошибка валидации

### Ошибки сервера

- `500 Internal Server Error` - внутренняя ошибка

## Валидация

### DTO с class-validator

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

### Ошибки валидации

```typescript
{
  "statusCode": 400,
  "message": [
    "name must be a string",
    "price must be a number"
  ],
  "error": "Bad Request"
}
```

## Пагинация

### Query Parameters

```
GET /products?page=1&limit=10
```

### Response

```typescript
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Реализация

```typescript
@Get()
async findAll(
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '10',
) {
  const skip = (+page - 1) * +limit;
  const [data, total] = await Promise.all([
    this.prisma.product.findMany({
      skip,
      take: +limit,
    }),
    this.prisma.product.count(),
  ]);
  
  return {
    data,
    meta: {
      page: +page,
      limit: +limit,
      total,
      totalPages: Math.ceil(total / +limit),
    },
  };
}
```

## Фильтрация

### Query Parameters

```
GET /products?search=laptop&minPrice=100&maxPrice=1000
```

### Реализация

```typescript
@Get()
async findAll(
  @Query('search') search?: string,
  @Query('minPrice') minPrice?: string,
  @Query('maxPrice') maxPrice?: string,
) {
  const where: any = {};
  
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = +minPrice;
    if (maxPrice) where.price.lte = +maxPrice;
  }
  
  return this.prisma.product.findMany({ where });
}
```

## Сортировка

### Query Parameters

```
GET /products?sortBy=price&sortOrder=desc
```

### Реализация

```typescript
@Get()
async findAll(
  @Query('sortBy') sortBy: string = 'createdAt',
  @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
) {
  return this.prisma.product.findMany({
    orderBy: { [sortBy]: sortOrder },
  });
}
```

## Вложенные ресурсы

### URL Structure

```
GET /users/1/posts          // Посты пользователя
GET /users/1/posts/5        // Конкретный пост
```

### Реализация

```typescript
@Get(':userId/posts')
async findUserPosts(@Param('userId') userId: string) {
  return this.prisma.post.findMany({
    where: { userId: +userId },
  });
}
```

## Versioning

### URL Versioning

```
/api/v1/products
/api/v2/products
```

### Header Versioning

```
Accept: application/vnd.api+json;version=1
```

## CORS

### Настройка в NestJS

```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

## Authentication

### JWT Token

```
Authorization: Bearer <token>
```

### Guard

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

## Rate Limiting

### Throttler

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})
```

## Related Docs

- [Backend NestJS](./backend-nestjs.md)
- [Authentication](./authentication.md)

