# Project Master AI Context

> **Главный файл для AI-ассистентов**  
> Этот документ содержит всю критическую информацию о проекте для эффективной работы AI.

---

## 🎯 ОБЯЗАТЕЛЬНЫЙ СТЕК

### Backend:
- ✅ **NestJS 10.x** (v11.0.1)
- ✅ **Prisma 5.22.0** (НЕ версия 7!)
- ✅ **Supabase PostgreSQL**
- ✅ **TypeScript** (strict mode)
- ✅ **class-validator** + **class-transformer**
- ✅ **Node.js x64** (критично для ARM64!)

### Frontend (в разработке):
- ✅ **SolidJS**
- ✅ **TypeScript**
- ✅ **Vercel** (планируется)

### Инструменты:
- ✅ **PowerShell** (Windows)
- ✅ **Supabase CLI**
- ✅ **cross-env** (для env переменных)

---

## ❌ СТРОГО ЗАПРЕЩЕНО

### Технологии:
- ❌ **React, Vue, Angular** вместо SolidJS
- ❌ **Express** вместо NestJS  
- ❌ **TypeORM, Sequelize** вместо Prisma
- ❌ **MongoDB** вместо PostgreSQL
- ❌ **Prisma 7** (проблемы с ARM64 Windows)
- ❌ **Node.js ARM64** (несовместим с Prisma 5.22.0)

### Практики:
- ❌ Использовать `any` тип
- ❌ Использовать default export
- ❌ Создавать модели в NestJS (только в Prisma!)
- ❌ Обновлять schema из NestJS кода
- ❌ Использовать `prisma migrate` (используем `db push`)
- ❌ Забывать валидацию в DTO

---

## 📁 СТРУКТУРА ПРОЕКТА

```
project-root/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # ⚠️ ИСТОЧНИК ИСТИНЫ
│   ├── src/
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts    # Lazy initialization
│   │   │   └── prisma.module.ts
│   │   ├── [entity]/
│   │   │   ├── dto/
│   │   │   │   ├── create-[entity].dto.ts
│   │   │   │   └── update-[entity].dto.ts
│   │   │   ├── [entity].controller.ts
│   │   │   ├── [entity].service.ts
│   │   │   └── [entity].module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env
│   └── package.json
├── frontend/                   # (планируется)
├── docs/                       # 📚 Документация
│   ├── tech-stack/
│   ├── team/
│   ├── workflows/
│   └── MASTER-PROMPT.md
└── README.md
```

---

## 🔄 ОСНОВНОЙ WORKFLOW: Создание новой сущности

### Принцип: **Prisma Schema → БД → NestJS**

### ШАГ 1: Prisma Schema

```bash
code backend/prisma/schema.prisma
```

Добавить модель:

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Float
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### ШАГ 2: Генерация и Push

```bash
cd backend
npx prisma generate
npx prisma db push
# Если зависает: supabase db push
```

### ШАГ 3: NestJS модуль

```bash
npx @nestjs/cli g resource products
# REST API
# Generate CRUD? Yes
```

### ШАГ 4: Связать с Prisma

`backend/src/products/products.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const user = await this.prisma.getUserModel();
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
      data: updateProductDto 
    });
  }

  async remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }
}
```

### ШАГ 5: DTO (вручную!)

`backend/src/products/dto/create-product.dto.ts`:

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

### ШАГ 6: Запуск

```bash
npm run start:dev
```

### ⚠️ ВАЖНО: 
- DTO **НЕ обновляются автоматически**!
- `npx prisma generate` обновляет только типы в `node_modules`
- DTO файлы обновлять **вручную**

---

## 🔧 ENVIRONMENT SETUP

### .env файл

```env
# Supabase
DATABASE_URL="postgresql://postgres.PROJECT:PASS@region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT:PASS@region.pooler.supabase.com:5432/postgres?sslmode=require"
SUPABASE_URL="https://PROJECT.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# NestJS
PORT=3001
NODE_ENV=development
JWT_SECRET="random-secret"
FRONTEND_URL="http://localhost:3000"
```

**Ключевые моменты:**
- `DATABASE_URL` (порт 6543) - pooler для queries
- `DIRECT_URL` (порт 5432) - прямое подключение для миграций
- `DIRECT_URL` должен содержать `?sslmode=require`

---

## 📝 КОМАНДЫ

### Prisma:
```bash
npx prisma generate          # После изменения schema
npx prisma db push           # Push в Supabase
npx prisma studio            # GUI для данных
```

### NestJS:
```bash
npm run start:dev            # Запуск с watch
npx @nestjs/cli g resource name  # Новый CRUD
```

### Supabase:
```bash
supabase db push             # Альтернатива prisma db push
```

---

## 💻 ПАТТЕРНЫ КОДА

### Service Pattern:

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
    return this.prisma.entity.findUnique({ where: { id } });
  }
  
  async update(id: number, dto: UpdateDto) {
    return this.prisma.entity.update({ 
      where: { id }, 
      data: dto 
    });
  }
  
  async remove(id: number) {
    return this.prisma.entity.delete({ where: { id } });
  }
}
```

### DTO Pattern:

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

### PrismaService Usage:

```typescript
// ✅ ПРАВИЛЬНО - через PrismaService
constructor(private prisma: PrismaService) {}

async findAll() {
  return this.prisma.product.findMany();
}

// ❌ НЕПРАВИЛЬНО - прямой импорт PrismaClient
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

---

## 🖥️ ARM64 COMPATIBILITY

### Проблема:
- Windows ARM64 (Snapdragon 8) несовместим с Prisma 5.22.0
- Ошибка: `not a valid Win32 application`

### Решение:
1. Установить **Node.js x64** версию
2. Использовать скрипт: `backend/install-node-x64.ps1`
3. Или использовать Docker/WSL

### PrismaService:
- Использует **lazy initialization**
- Приложение запускается даже при ошибке Prisma
- Методы `getUserModel()` обеспечивают async инициализацию

---

## 📚 СВЯЗАННАЯ ДОКУМЕНТАЦИЯ

- [Tech Stack Overview](./tech-stack/overview.md)
- [Backend NestJS](./tech-stack/backend-nestjs.md)
- [Database Prisma](./tech-stack/database-prisma.md)
- [Workflow: Add New Entity](./workflows/add-new-entity.md)
- [Backend Developer Guide](./team/backend-developer.md)

---

## 🚨 ЧАСТЫЕ ОШИБКИ

### 1. "Module '@prisma/client' has no exported member 'PrismaClient'"
**Решение:** Использовать `import { PrismaClient } from '.prisma/client';`

### 2. "P1000: Authentication failed"
**Решение:** Проверить `DIRECT_URL` в `.env` (должен быть порт 5432, не 6543)

### 3. "not a valid Win32 application"
**Решение:** Установить Node.js x64 версию

### 4. "Property 'entity' does not exist on type 'PrismaService'"
**Решение:** Выполнить `npx prisma generate` после изменения schema

---

## ✅ CODE REVIEW ЧЕКЛИСТ

- [ ] Prisma schema обновлён
- [ ] `npx prisma generate` выполнен
- [ ] `npx prisma db push` выполнен
- [ ] DTO с валидацией (`class-validator`)
- [ ] Service использует `PrismaService`
- [ ] Типы без `any`
- [ ] Нет default exports
- [ ] Модуль добавлен в `app.module.ts`

---

**Последнее обновление:** 2024  
**Версия проекта:** 0.0.1

