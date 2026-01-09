# Решение проблемы Prisma на Windows ARM64

## Проблема

Prisma не работает на Windows ARM64 из-за несовместимости query engine:
```
Unable to require(`query_engine-windows.dll.node`).
The Prisma engines do not seem to be compatible with your system.
Details: query_engine-windows.dll.node is not a valid Win32 application.
```

## Решения (выберите одно)

### ✅ Решение 1: Установить Node.js x64 (РЕКОМЕНДУЕТСЯ)

1. Скачайте Node.js x64 версию с https://nodejs.org/
2. Установите её (можно параллельно с ARM64 версией)
3. Используйте x64 версию для проекта:
   ```powershell
   # Проверьте текущую версию
   node -p "process.arch"
   
   # Если показывает "arm64", переключитесь на x64 версию Node.js
   ```

### Решение 2: Использовать Docker

1. Установите Docker Desktop для Windows
2. Создайте `Dockerfile` в корне проекта:
   ```dockerfile
   FROM node:20-slim
   WORKDIR /app
   COPY backend/package*.json ./
   RUN npm install
   COPY backend/ .
   RUN npx prisma generate
   CMD ["npm", "run", "start:dev"]
   ```
3. Запустите:
   ```powershell
   docker build -t coffee-backend .
   docker run -p 3001:3001 coffee-backend
   ```

### Решение 3: Использовать WSL (Windows Subsystem for Linux)

1. Установите WSL2:
   ```powershell
   wsl --install
   ```
2. В WSL установите Node.js и запустите проект:
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   cd /mnt/c/Tools/workarea/test_feature/test.coffee_panel-v1/backend
   npm install
   npx prisma generate
   npm run start:dev
   ```

### Решение 4: Использовать Prisma Data Proxy (платный)

1. Зарегистрируйтесь на https://www.prisma.io/data-platform
2. Настройте Data Proxy
3. Обновите `DATABASE_URL` в `.env`

## Текущий статус

- ✅ Код удаления исправлен с транзакциями
- ✅ Обработка ошибок улучшена
- ⚠️ Prisma требует x64 Node.js или Docker/WSL для работы

## Проверка после исправления

После применения одного из решений:

1. Перегенерируйте Prisma клиент:
   ```powershell
   cd backend
   npx prisma generate
   ```

2. Перезапустите бэкенд:
   ```powershell
   npm run start:dev
   ```

3. Проверьте API:
   ```powershell
   curl http://localhost:3001/products
   ```

Должен вернуться JSON массив (даже если пустой), а не ошибка 500.

