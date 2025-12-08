# ARM64 Compatibility

## Overview

Проект разрабатывается на Windows ARM64 (Snapdragon 8), что создает проблемы совместимости с Prisma 5.22.0. Этот документ описывает проблему и решения.

## Проблема

### Ошибка

```
PrismaClientInitializationError: Unable to require(...query_engine-windows.dll.node).
... is not a valid Win32 application.
```

### Причина

- Prisma 5.22.0 использует нативные бинарники (query engine)
- Бинарники скомпилированы для x64 архитектуры
- Windows ARM64 не может выполнить x64 бинарники напрямую
- Node.js ARM64 несовместим с Prisma 5.22.0

## Решения

### Решение 1: Node.js x64 (Рекомендуется)

Установить Node.js x64 версию для совместимости с Prisma.

#### Автоматическая установка

```bash
cd backend
.\install-node-x64.ps1
```

#### Ручная установка

1. Скачать Node.js x64 portable: https://nodejs.org/dist/v20.18.1/node-v20.18.1-win-x64.zip
2. Распаковать в `C:\Users\[USER]\nodejs-x64\`
3. Добавить в PATH:
   ```powershell
   $env:Path = "C:\Users\[USER]\nodejs-x64;" + $env:Path
   ```

#### Проверка

```bash
node -p "process.arch"
# Должно быть: x64
```

### Решение 2: Docker

Использовать Docker для изоляции x64 окружения.

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "run", "start:dev"]
```

### Решение 3: WSL

Использовать Windows Subsystem for Linux.

```bash
wsl --install
# Затем работать в WSL окружении
```

### Решение 4: Prisma 7+ (Не рекомендуется)

Prisma 7 поддерживает ARM64, но требует миграцию и может иметь breaking changes.

```bash
# ⚠️ НЕ РЕКОМЕНДУЕТСЯ
npm install prisma@latest @prisma/client@latest
```

## PrismaService: Lazy Initialization

Проект использует кастомный `PrismaService` с lazy initialization для graceful degradation.

### Как это работает

```typescript
export class PrismaService {
  private prisma: PrismaClient | null = null;
  private isInitialized = false;
  private initError: Error | null = null;

  // PrismaClient создается только при первом использовании
  private async initializePrisma() {
    if (this.isInitialized) return;
    
    try {
      this.prisma = new PrismaClient();
      await this.prisma.$connect();
    } catch (error) {
      this.initError = error;
      // Приложение продолжает работать
    }
  }
}
```

### Преимущества

- ✅ Приложение запускается даже при ошибке Prisma
- ✅ Понятные сообщения об ошибках
- ✅ Graceful degradation

### Использование

```typescript
// ✅ ПРАВИЛЬНО - async метод
async findAll() {
  await this.prisma.ensureInitialized();
  return this.prisma.product.findMany();
}

// ❌ НЕПРАВИЛЬНО - прямой доступ
findAll() {
  return this.prisma.product.findMany(); // Может упасть
}
```

## Проверка архитектуры

### Node.js

```bash
node -p "process.arch"
```

**Результаты:**
- `x64` - ✅ Работает с Prisma
- `arm64` - ❌ Не работает с Prisma 5

### Prisma

```bash
npx prisma generate
```

**Если ошибка:**
- Установить Node.js x64
- Или использовать Docker/WSL

## package.json Scripts

Проект использует `cross-env` для установки переменных окружения.

```json
{
  "scripts": {
    "start:dev": "cross-env PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 nest start --watch"
  }
}
```

**Переменная:** `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`
- Игнорирует ошибки checksum при несовместимости архитектур

## Common Issues

### Ошибка: "not a valid Win32 application"

**Причина:** Node.js ARM64

**Решение:**
```bash
# Установить Node.js x64
.\install-node-x64.ps1
```

### Ошибка: "PrismaClientInitializationError"

**Причина:** Prisma engine несовместим

**Решение:**
1. Установить Node.js x64
2. Выполнить `npx prisma generate`
3. Перезапустить приложение

### Ошибка: "Connection timeout"

**Причина:** Prisma не может подключиться

**Решение:**
- Проверить `.env` файл
- Проверить `DIRECT_URL` (порт 5432)
- Проверить интернет соединение

## Best Practices

### 1. Всегда использовать Node.js x64

```bash
# Проверить перед началом работы
node -p "process.arch"  # Должно быть: x64
```

### 2. Использовать PrismaService

```typescript
// ✅ ПРАВИЛЬНО
constructor(private prisma: PrismaService) {}

// ❌ НЕПРАВИЛЬНО
const prisma = new PrismaClient();
```

### 3. Обрабатывать ошибки

```typescript
try {
  await this.prisma.ensureInitialized();
  return this.prisma.product.findMany();
} catch (error) {
  // Обработка ошибки
}
```

## Related Docs

- [Database Prisma](./database-prisma.md)
- [Environment Setup](./environment-setup.md)
- [Backend NestJS](./backend-nestjs.md)

