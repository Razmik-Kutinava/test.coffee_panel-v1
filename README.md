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

## 🚀 Быстрый старт

⚠️ **Для Windows ARM64 пользователей:** Обязательно прочитайте [docs/QUICKSTART.md](./docs/QUICKSTART.md)

### Простой запуск (рекомендуется)

```powershell
# 1. Установите зависимости
cd backend
npm install
.\install-node-x64.ps1  # Важно для ARM64!

cd ../frontend
npm install

# 2. Настройте backend/.env (см. ниже)

# 3. Запустите всё одной командой
cd ..
.\start-all.ps1
```

**Готово!** Откройте http://localhost:3000

### Ручная установка

См. подробную инструкцию в [docs/QUICKSTART.md](./docs/QUICKSTART.md)

## 📚 Документация

### 🎯 Начните здесь
- 🚀 **[QUICKSTART.md](./docs/QUICKSTART.md)** - Быстрый старт проекта
- 🐛 **[BUGS_HISTORY.md](./docs/BUGS_HISTORY.md)** - История всех багов и решений

### Для AI-ассистентов
- [`docs/MASTER-PROMPT.md`](./docs/MASTER-PROMPT.md) - Главный файл с контекстом проекта

### Для разработчиков
- [`docs/workflows/add-new-entity.md`](./docs/workflows/add-new-entity.md) - Как добавить новую сущность
- [`docs/tech-stack/backend-nestjs.md`](./docs/tech-stack/backend-nestjs.md) - NestJS документация
- [`docs/tech-stack/database-prisma.md`](./docs/tech-stack/database-prisma.md) - Prisma документация
- [`docs/tech-stack/arm64-compatibility.md`](./docs/tech-stack/arm64-compatibility.md) - ARM64 совместимость

### Навигация
См. [`docs/README.md`](./docs/README.md) для полного списка документации.

## 🔧 Основные команды

### Запуск проекта

```powershell
# ✅ Рекомендуемый способ (все в одном)
.\start-all.ps1

# Или раздельно:

# Backend (с x64 Node.js)
cd backend
.\start-x64.ps1

# Frontend
cd frontend
npm run dev
```

### Backend разработка

```bash
cd backend

# ⚠️ На ARM64 Windows НЕ ИСПОЛЬЗУЙТЕ npm run start:dev напрямую!
# Вместо этого:
.\start-x64.ps1

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

### ⚠️ ARM64 Windows Compatibility

Проект разрабатывается на **Windows ARM64** (Snapdragon 8). 

**КРИТИЧЕСКИ ВАЖНО:**
1. ✅ Установите x64 Node.js: `cd backend; .\install-node-x64.ps1`
2. ✅ Всегда запускайте через `.\start-all.ps1`
3. ❌ НЕ запускайте backend через `npm run start:dev` напрямую

**Почему:** Prisma требует x64 нативные библиотеки, ARM64 Node.js их не поддерживает.

Подробнее: 
- [`docs/QUICKSTART.md`](./docs/QUICKSTART.md)
- [`docs/BUGS_HISTORY.md`](./docs/BUGS_HISTORY.md) (см. БАГ #1)
- [`docs/tech-stack/arm64-compatibility.md`](./docs/tech-stack/arm64-compatibility.md)

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

