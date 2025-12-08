# Coffee Panel v1

Современная система управления для кофейного бизнеса с REST API backend и планируемым SolidJS frontend.

## 🚀 Технологический стек

### Backend
- **NestJS 10** - Прогрессивный Node.js framework
- **Prisma 5.22.0** - Type-safe ORM
- **Supabase PostgreSQL** - Managed база данных
- **TypeScript** - Строгая типизация

### Frontend (в разработке)
- **SolidJS** - Реактивный UI framework
- **TypeScript** - Строгая типизация
- **Vercel** - Deployment (планируется)

## 📁 Структура проекта

```
test.coffee_panel-v1/
├── backend/              # NestJS backend API
│   ├── prisma/          # Prisma schema и миграции
│   ├── src/             # Исходный код
│   └── package.json
├── frontend/            # SolidJS frontend (планируется)
├── docs/                # Полная AI-документация
│   ├── MASTER-PROMPT.md # ⭐ Главный файл для AI
│   ├── tech-stack/      # Документация технологий
│   ├── workflows/        # Процессы разработки
│   └── team/            # Роли команды
└── README.md
```

## 🛠️ Быстрый старт

### Требования

- Node.js x64 (важно для ARM64 Windows!)
- npm или yarn
- Supabase аккаунт

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/Razmik-Kutinava/test.coffee_panel-v1.git
cd test.coffee_panel-v1

# Установить зависимости backend
cd backend
npm install

# Настроить environment variables
cp .env.example .env
# Заполнить .env файл с данными из Supabase

# Генерация Prisma Client
npx prisma generate

# Применить схему к базе данных
npx prisma db push

# Запустить backend
npm run start:dev
```

Backend будет доступен на `http://localhost:3001`

## 📚 Документация

Полная документация находится в папке [`docs/`](./docs/).

### Для AI-ассистентов
Начните с [`docs/MASTER-PROMPT.md`](./docs/MASTER-PROMPT.md) - главный файл с контекстом проекта.

### Для разработчиков
- [`docs/workflows/add-new-entity.md`](./docs/workflows/add-new-entity.md) - Как добавить новую сущность
- [`docs/tech-stack/backend-nestjs.md`](./docs/tech-stack/backend-nestjs.md) - NestJS документация
- [`docs/tech-stack/database-prisma.md`](./docs/tech-stack/database-prisma.md) - Prisma документация

### Навигация
См. [`docs/README.md`](./docs/README.md) для полного списка документации.

## 🔧 Основные команды

### Backend

```bash
cd backend

# Разработка
npm run start:dev

# Сборка
npm run build

# Production
npm run start:prod

# Prisma
npx prisma generate    # Генерация Prisma Client
npx prisma db push     # Применить схему к БД
npx prisma studio      # GUI для просмотра данных

# Создать новый ресурс
npx @nestjs/cli g resource products
```

## 🗄️ База данных

Проект использует **Supabase PostgreSQL** с Prisma ORM.

### Схема базы данных

Схема определяется в `backend/prisma/schema.prisma`. После изменения схемы:

```bash
npx prisma generate
npx prisma db push
```

### Текущие модели

- `User` - Пользователи системы

## ⚠️ Важные моменты

### ARM64 Windows Compatibility

Проект разрабатывается на Windows ARM64 (Snapdragon 8). Для работы с Prisma 5.22.0 требуется:

1. **Node.js x64 версия** (не ARM64!)
2. Использовать скрипт установки: `backend/install-node-x64.ps1`
3. Или использовать Docker/WSL

Подробнее: [`docs/tech-stack/arm64-compatibility.md`](./docs/tech-stack/arm64-compatibility.md)

### Prisma Version

**Используется:** Prisma 5.22.0  
**НЕ использовать:** Prisma 7 (проблемы с ARM64 Windows)

## 🚫 Запрещенные практики

- ❌ Использование `any` типа
- ❌ Default exports
- ❌ Прямое создание `PrismaClient` (использовать `PrismaService`)
- ❌ Хардкод секретов в коде
- ❌ Коммит `.env` файла
- ❌ Использование Prisma 7

## 📝 Workflow: Добавление новой сущности

1. Добавить модель в `backend/prisma/schema.prisma`
2. Выполнить `npx prisma generate` и `npx prisma db push`
3. Создать NestJS модуль: `npx @nestjs/cli g resource name`
4. Обновить Service для работы с Prisma
5. Обновить DTO вручную с валидацией

Подробнее: [`docs/workflows/add-new-entity.md`](./docs/workflows/add-new-entity.md)

## 🧪 Тестирование

```bash
# Unit тесты
npm test

# E2E тесты
npm run test:e2e

# Coverage
npm run test:cov
```

## 🔐 Environment Variables

Создайте `.env` файл в `backend/`:

```env
# Supabase
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# NestJS
PORT=3001
NODE_ENV=development
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:3000"
```

Подробнее: [`docs/tech-stack/environment-setup.md`](./docs/tech-stack/environment-setup.md)

## 🤝 Вклад в проект

1. Fork репозитория
2. Создать feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Открыть Pull Request

## 📄 Лицензия

UNLICENSED

## 👥 Авторы

- **Razmik Kutinava** - [GitHub](https://github.com/Razmik-Kutinava)

## 🔗 Связанные ресурсы

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [SolidJS Documentation](https://www.solidjs.com/docs/latest)

---

**Версия:** 0.0.1  
**Статус:** В разработке

