# Testing Strategy

## Overview

Стратегия тестирования для обеспечения качества кода и предотвращения регрессий.

## Quick Reference

```bash
# Unit тесты
npm test

# E2E тесты
npm run test:e2e

# Coverage
npm run test:cov
```

## Типы тестов

### 1. Unit Tests

Тестирование отдельных компонентов изолированно.

**Где:** `*.spec.ts` файлы рядом с исходным кодом

**Пример:**

```typescript
// products.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const dto = { name: 'Test', price: 100 };
      const expected = { id: 1, ...dto, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(prisma.product, 'create').mockResolvedValue(expected);

      const result = await service.create(dto);
      expect(result).toEqual(expected);
      expect(prisma.product.create).toHaveBeenCalledWith({ data: dto });
    });
  });
});
```

### 2. Integration Tests

Тестирование взаимодействия компонентов.

**Пример:**

```typescript
describe('Products Integration', () => {
  it('should create and retrieve product', async () => {
    const dto = { name: 'Test', price: 100 };
    const created = await service.create(dto);
    const found = await service.findOne(created.id);
    expect(found).toEqual(created);
  });
});
```

### 3. E2E Tests

Тестирование полного flow через HTTP.

**Где:** `test/` папка

**Пример:**

```typescript
// test/products.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Products (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/products (POST)', () => {
    return request(app.getHttpServer())
      .post('/products')
      .send({ name: 'Test', price: 100 })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('Test');
      });
  });

  it('/products (GET)', () => {
    return request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
```

## Структура тестов

### Arrange-Act-Assert (AAA)

```typescript
it('should create a product', async () => {
  // Arrange - подготовка
  const dto = { name: 'Test', price: 100 };
  const expected = { id: 1, ...dto };

  // Act - действие
  const result = await service.create(dto);

  // Assert - проверка
  expect(result).toEqual(expected);
});
```

## Mocking

### Mock PrismaService

```typescript
const mockPrismaService = {
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// В тесте
jest.spyOn(mockPrismaService.product, 'create').mockResolvedValue(expected);
```

### Mock Dependencies

```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [
    ProductsService,
    {
      provide: PrismaService,
      useValue: mockPrismaService,
    },
  ],
}).compile();
```

## Test Coverage

### Цели

- Unit tests: 80%+
- Integration tests: 60%+
- E2E tests: критичные flows

### Проверка coverage

```bash
npm run test:cov
```

## Best Practices

### 1. Изолированные тесты

```typescript
// ✅ ХОРОШО - каждый тест независим
beforeEach(() => {
  jest.clearAllMocks();
});

// ❌ ПЛОХО - тесты зависят друг от друга
let sharedState;
```

### 2. Понятные имена

```typescript
// ✅ ХОРОШО
it('should throw NotFoundException when product does not exist', async () => {
  // ...
});

// ❌ ПЛОХО
it('test1', () => {
  // ...
});
```

### 3. Тестировать edge cases

```typescript
describe('findOne', () => {
  it('should return product when exists', async () => {
    // ...
  });

  it('should throw NotFoundException when not exists', async () => {
    // ...
  });

  it('should handle invalid id', async () => {
    // ...
  });
});
```

### 4. Не тестировать implementation details

```typescript
// ✅ ХОРОШО - тестировать поведение
it('should create product with correct data', async () => {
  const result = await service.create(dto);
  expect(result.name).toBe(dto.name);
});

// ❌ ПЛОХО - тестировать детали реализации
it('should call prisma.product.create once', () => {
  // ...
});
```

## Common Issues

### Ошибка: "Cannot find module"

**Причина:** Неправильные пути импорта

**Решение:**
```typescript
// Использовать относительные пути
import { ProductsService } from './products.service';
```

### Ошибка: "PrismaClient is not initialized"

**Причина:** Mock не настроен

**Решение:**
```typescript
const mockPrismaService = {
  product: {
    create: jest.fn().mockResolvedValue({}),
  },
};
```

## Related Docs

- [Bug Fixing](./bug-fixing.md)
- [Code Review](./code-review.md)

