# Workflow: Code Review

## Overview

Чеклист для проведения code review, обеспечивающий качество кода и соответствие стандартам проекта.

## Quick Reference

```bash
# Перед review проверить:
# 1. Код компилируется
# 2. Тесты проходят
# 3. Линтер не выдает ошибок
# 4. Соответствует стилю проекта
```

## Code Review Checklist

### Общие требования

- [ ] Код компилируется без ошибок
- [ ] Тесты написаны и проходят
- [ ] Линтер не выдает ошибок
- [ ] Код соответствует стилю проекта
- [ ] Нет закомментированного кода
- [ ] Нет console.log в production коде

### Prisma

- [ ] Schema обновлена корректно
- [ ] Выполнен `npx prisma generate`
- [ ] Выполнен `npx prisma db push` (если нужно)
- [ ] Используется `PrismaService` (не прямой `PrismaClient`)
- [ ] Типы из Prisma используются правильно

### NestJS

- [ ] Модуль правильно структурирован
- [ ] Service использует `@Injectable()`
- [ ] Controller использует правильные декораторы
- [ ] DTO с валидацией (`class-validator`)
- [ ] Модуль добавлен в `app.module.ts`

### TypeScript

- [ ] Нет использования `any`
- [ ] Используются named exports (не default)
- [ ] Типы явно указаны где нужно
- [ ] Интерфейсы используются для объектов

### Безопасность

- [ ] Секреты не хардкодятся
- [ ] Валидация входных данных
- [ ] Обработка ошибок
- [ ] Нет SQL injection (используется Prisma)

### Производительность

- [ ] Нет N+1 queries
- [ ] Используется пагинация для больших списков
- [ ] Индексы в БД (если нужно)

## Детальные проверки

### 1. Prisma Schema

```prisma
// ✅ ПРАВИЛЬНО
model Product {
  id        Int      @id @default(autoincrement())
  name      String
  price     Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ❌ НЕПРАВИЛЬНО
model Product {
  id Int  // Нет @id
  name String?  // Должно быть обязательным?
}
```

**Проверить:**
- Все поля имеют правильные типы
- Используются правильные декораторы
- Связи определены корректно

### 2. Service

```typescript
// ✅ ПРАВИЛЬНО
@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }
}

// ❌ НЕПРАВИЛЬНО
export class ProductsService {
  private prisma = new PrismaClient(); // Не использовать!
  
  create(dto: any) { // Нет типов!
    return this.prisma.product.create({ data: dto });
  }
}
```

**Проверить:**
- Используется `PrismaService`
- Методы `async`
- Типы указаны
- Обработка ошибок

### 3. DTO

```typescript
// ✅ ПРАВИЛЬНО
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;
}

// ❌ НЕПРАВИЛЬНО
export default class CreateProductDto {
  name: any;  // Нет типов и валидации
  price: any;
}
```

**Проверить:**
- Валидация всех полей
- Правильные типы
- Named exports

### 4. Controller

```typescript
// ✅ ПРАВИЛЬНО
@Controller('products')
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }
}

// ❌ НЕПРАВИЛЬНО
@Controller('products')
export class ProductsController {
  @Post()
  create(@Body() body: any) { // Нет типов
    return this.service.create(body);
  }
}
```

**Проверить:**
- Правильные HTTP методы
- Правильные декораторы
- Типы параметров

## Типичные проблемы

### 1. Использование `any`

```typescript
// ❌ ПЛОХО
function process(data: any): any {
  return data;
}

// ✅ ХОРОШО
function process<T>(data: T): T {
  return data;
}
```

### 2. Прямое создание PrismaClient

```typescript
// ❌ ПЛОХО
const prisma = new PrismaClient();

// ✅ ХОРОШО
constructor(private prisma: PrismaService) {}
```

### 3. Отсутствие валидации

```typescript
// ❌ ПЛОХО
export class CreateProductDto {
  name: string;
}

// ✅ ХОРОШО
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### 4. Отсутствие обработки ошибок

```typescript
// ❌ ПЛОХО
async findOne(id: number) {
  return this.prisma.product.findUnique({ where: { id } });
}

// ✅ ХОРОШО
async findOne(id: number) {
  const product = await this.prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new NotFoundException(`Product with ID ${id} not found`);
  }
  return product;
}
```

## Комментарии в Review

### Формат

```
✅ Хорошо: [что хорошо]
⚠️ Вопрос: [вопрос]
❌ Проблема: [проблема] → [решение]
```

### Примеры

```
✅ Хорошо: Использование PrismaService вместо прямого PrismaClient

⚠️ Вопрос: Нужна ли здесь пагинация для больших списков?

❌ Проблема: Использование `any` типа → Использовать конкретный тип
```

## Best Practices

### 1. Конструктивная критика

```
// ✅ ХОРОШО
"Можно улучшить обработку ошибок здесь. Предлагаю добавить try-catch."

// ❌ ПЛОХО
"Это плохо. Переделай."
```

### 2. Предлагать решения

```
// ✅ ХОРОШО
"Вместо `any` можно использовать `User` тип из Prisma."

// ❌ ПЛОХО
"Не используй `any`."
```

### 3. Быть конкретным

```
// ✅ ХОРОШО
"В строке 15 используется `any`. Заменить на `CreateProductDto`."

// ❌ ПЛОХО
"Есть проблемы с типами."
```

## Related Docs

- [Bug Fixing](./bug-fixing.md)
- [Testing Strategy](./testing-strategy.md)
- [Backend Developer Guide](../team/backend-developer.md)

