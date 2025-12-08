# Backend Developer

## Роль

Разработка REST API, работа с базой данных через Prisma, реализация бизнес-логики.

## Ответственность

- Создание новых сущностей (Prisma → NestJS)
- Реализация CRUD операций
- Валидация данных (DTO)
- Работа с PrismaService
- Написание тестов

## Quick Reference

```bash
# Создать новую сущность
npx @nestjs/cli g resource products

# Генерация Prisma Client
npx prisma generate

# Применение изменений
npx prisma db push
```

## Workflow: Добавление новой сущности

### ШАГ 1: Prisma Schema

```prisma
// backend/prisma/schema.prisma
model Product {
  id        Int      @id @default(autoincrement())
  name      String
  price     Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### ШАГ 2: Генерация и Push

```bash
npx prisma generate
npx prisma db push
```

### ШАГ 3: NestJS модуль

```bash
npx @nestjs/cli g resource products
```

### ШАГ 4: Обновить Service

```typescript
// backend/src/products/products.service.ts
@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }
}
```

### ШАГ 5: Обновить DTO

```typescript
// backend/src/products/dto/create-product.dto.ts
export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;
}
```

## Чеклист перед коммитом

- [ ] Prisma schema обновлена
- [ ] `npx prisma generate` выполнен
- [ ] `npx prisma db push` выполнен
- [ ] NestJS модуль создан
- [ ] Service использует PrismaService
- [ ] DTO с валидацией (`class-validator`)
- [ ] Модуль добавлен в `app.module.ts`
- [ ] Типы без `any`
- [ ] Тесты написаны
- [ ] Код компилируется

## Стандартные паттерны

### Service Pattern

```typescript
@Injectable()
export class EntityService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDto) {
    return this.prisma.entity.create({ data: dto });
  }

  async findAll() {
    return this.prisma.entity.findMany();
  }

  async findOne(id: number) {
    const entity = await this.prisma.entity.findUnique({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: number, dto: UpdateDto) {
    return this.prisma.entity.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    return this.prisma.entity.delete({ where: { id } });
  }
}
```

### DTO Pattern

```typescript
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateEntityDto {
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

## Common Tasks

### Добавить поле в существующую модель

1. Обновить `schema.prisma`
2. Выполнить `npx prisma generate`
3. Выполнить `npx prisma db push`
4. Обновить DTO вручную

### Добавить связь между моделями

```prisma
model User {
  id    Int     @id @default(autoincrement())
  posts Post[]
}

model Post {
  id     Int   @id @default(autoincrement())
  userId Int
  user   User  @relation(fields: [userId], references: [id])
}
```

### Добавить фильтрацию

```typescript
@Get()
async findAll(@Query('search') search?: string) {
  const where: any = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  return this.prisma.product.findMany({ where });
}
```

## Что НЕ делать

- ❌ Использовать `any` тип
- ❌ Создавать `PrismaClient` напрямую
- ❌ Забывать валидацию в DTO
- ❌ Коммитить `.env` файл
- ❌ Использовать default exports
- ❌ Пропускать тесты

## Related Docs

- [Workflow: Add New Entity](../workflows/add-new-entity.md)
- [Backend NestJS](../tech-stack/backend-nestjs.md)
- [Database Prisma](../tech-stack/database-prisma.md)

