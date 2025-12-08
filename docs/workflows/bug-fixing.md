# Workflow: Bug Fixing

## Overview

Структурированный подход к исправлению багов для обеспечения качества кода и предотвращения регрессий.

## Quick Reference

```bash
# 1. Воспроизвести баг
# 2. Написать failing test
# 3. Исправить код
# 4. Убедиться что тест проходит
# 5. Code review
```

## Detailed Guide

### ШАГ 1: Воспроизвести баг

#### Описать проблему

- Что происходит?
- Когда происходит?
- Что ожидается?
- Что происходит на самом деле?

#### Пример

```
Проблема: При создании продукта возвращается ошибка 500
Шаги:
1. POST /products
2. Body: { "name": "Test", "price": 100 }
3. Ожидается: 201 Created
4. Получается: 500 Internal Server Error
```

### ШАГ 2: Найти причину

#### Логи

```bash
# Проверить логи приложения
npm run start:dev

# Проверить логи Prisma
# Включить логирование в PrismaService
```

#### Отладка

```typescript
// Добавить console.log для отладки
console.log('Input:', createProductDto);
console.log('Before create');
const product = await this.prisma.product.create({ data: createProductDto });
console.log('After create:', product);
```

#### Проверка базы данных

```bash
# Открыть Prisma Studio
npx prisma studio

# Проверить данные
# Проверить схему
```

### ШАГ 3: Написать failing test

#### Unit Test

```typescript
// products.service.spec.ts
describe('ProductsService', () => {
  it('should create a product', async () => {
    const dto = { name: 'Test', price: 100 };
    const result = await service.create(dto);
    expect(result).toHaveProperty('id');
    expect(result.name).toBe('Test');
  });
});
```

#### E2E Test

```typescript
// products.e2e-spec.ts
describe('Products (e2e)', () => {
  it('/products (POST)', () => {
    return request(app.getHttpServer())
      .post('/products')
      .send({ name: 'Test', price: 100 })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
      });
  });
});
```

### ШАГ 4: Исправить код

#### Минимальные изменения

```typescript
// ✅ ПРАВИЛЬНО - минимальное исправление
async create(dto: CreateProductDto) {
  // Добавить валидацию
  if (!dto.name) {
    throw new BadRequestException('Name is required');
  }
  return this.prisma.product.create({ data: dto });
}

// ❌ НЕПРАВИЛЬНО - переписывать весь метод
async create(dto: CreateProductDto) {
  // Много лишнего кода
}
```

#### Проверка исправления

```bash
# Запустить тесты
npm test

# Запустить приложение
npm run start:dev

# Проверить вручную
curl -X POST http://localhost:3001/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":100}'
```

### ШАГ 5: Убедиться что тест проходит

```bash
# Запустить все тесты
npm test

# Запустить конкретный тест
npm test -- products.service.spec.ts
```

### ШАГ 6: Code Review

#### Чеклист

- [ ] Баг исправлен
- [ ] Тесты добавлены
- [ ] Тесты проходят
- [ ] Код соответствует стилю проекта
- [ ] Нет breaking changes
- [ ] Документация обновлена (если нужно)

## Примеры

### Пример 1: Ошибка валидации

**Проблема:**
```
POST /products
Body: { "name": "", "price": -10 }
Ожидается: 400 Bad Request
Получается: 201 Created
```

**Исправление:**

```typescript
// DTO
export class CreateProductDto {
  @IsString()
  @IsNotEmpty() // ← Добавить
  name: string;

  @IsNumber()
  @Min(0) // ← Добавить
  price: number;
}
```

### Пример 2: Ошибка базы данных

**Проблема:**
```
POST /products
Ошибка: "Unique constraint failed"
```

**Исправление:**

```typescript
// Service
async create(dto: CreateProductDto) {
  try {
    return await this.prisma.product.create({ data: dto });
  } catch (error) {
    if (error.code === 'P2002') {
      throw new ConflictException('Product already exists');
    }
    throw error;
  }
}
```

### Пример 3: Ошибка типов

**Проблема:**
```
TypeError: Cannot read property 'id' of undefined
```

**Исправление:**

```typescript
// Service
async findOne(id: number) {
  const product = await this.prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new NotFoundException(`Product with ID ${id} not found`);
  }
  return product;
}
```

## Common Issues

### Ошибка: "Table does not exist"

**Причина:** Схема не применена к БД

**Решение:**
```bash
npx prisma db push
```

### Ошибка: "Property does not exist"

**Причина:** Prisma Client не обновлен

**Решение:**
```bash
npx prisma generate
```

### Ошибка: "Validation failed"

**Причина:** DTO не валидируется

**Решение:**
```typescript
// В main.ts
app.useGlobalPipes(new ValidationPipe());
```

## Best Practices

### 1. Всегда писать тесты

```typescript
// ✅ ПРАВИЛЬНО
it('should handle error when product not found', async () => {
  await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
});
```

### 2. Минимальные изменения

```typescript
// ✅ ПРАВИЛЬНО - исправить только проблему
if (!product) throw new NotFoundException();

// ❌ НЕПРАВИЛЬНО - переписывать весь метод
```

### 3. Проверять edge cases

```typescript
// Проверить граничные случаи
- Пустые значения
- Отрицательные числа
- Очень большие числа
- Специальные символы
```

## Related Docs

- [Testing Strategy](./testing-strategy.md)
- [Code Review](./code-review.md)

