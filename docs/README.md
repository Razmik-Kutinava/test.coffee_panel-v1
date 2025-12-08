# Документация проекта

Полная AI-документация для проекта Coffee Panel.

## 📚 Структура

```
docs/
├── MASTER-PROMPT.md          # ⭐ ГЛАВНЫЙ ФАЙЛ для AI
├── tech-stack/               # Технологический стек
├── workflows/                # Процессы и workflows
└── team/                     # Роли и ответственность
```

## 🚀 Быстрый старт

### Для AI-ассистентов

**Начните с:** [`MASTER-PROMPT.md`](./MASTER-PROMPT.md)

Этот файл содержит всю критическую информацию о проекте:
- Обязательный стек технологий
- Запрещенные практики
- Основные workflows
- Паттерны кода
- Частые ошибки

### Для разработчиков

**Backend разработчик:**
1. [`team/backend-developer.md`](./team/backend-developer.md) - Роль и ответственность
2. [`workflows/add-new-entity.md`](./workflows/add-new-entity.md) - Как добавить сущность
3. [`tech-stack/backend-nestjs.md`](./tech-stack/backend-nestjs.md) - NestJS документация
4. [`tech-stack/database-prisma.md`](./tech-stack/database-prisma.md) - Prisma документация

**Frontend разработчик:**
1. [`team/frontend-developer.md`](./team/frontend-developer.md) - Роль и ответственность
2. [`tech-stack/frontend-solidjs.md`](./tech-stack/frontend-solidjs.md) - SolidJS документация

**Tech Lead:**
1. [`team/tech-lead.md`](./team/tech-lead.md) - Роль и ответственность
2. [`workflows/code-review.md`](./workflows/code-review.md) - Code review процесс

## 📖 Разделы

### Tech Stack

- [`overview.md`](./tech-stack/overview.md) - Обзор стека
- [`backend-nestjs.md`](./tech-stack/backend-nestjs.md) - NestJS
- [`database-prisma.md`](./tech-stack/database-prisma.md) - Prisma ORM
- [`database-supabase.md`](./tech-stack/database-supabase.md) - Supabase
- [`frontend-solidjs.md`](./tech-stack/frontend-solidjs.md) - SolidJS
- [`typescript-conventions.md`](./tech-stack/typescript-conventions.md) - TypeScript правила
- [`api-design.md`](./tech-stack/api-design.md) - API дизайн
- [`authentication.md`](./tech-stack/authentication.md) - Аутентификация
- [`environment-setup.md`](./tech-stack/environment-setup.md) - Настройка окружения
- [`arm64-compatibility.md`](./tech-stack/arm64-compatibility.md) - ARM64 совместимость

### Workflows

- [`add-new-entity.md`](./workflows/add-new-entity.md) - Добавление новой сущности
- [`bug-fixing.md`](./workflows/bug-fixing.md) - Исправление багов
- [`code-review.md`](./workflows/code-review.md) - Code review
- [`testing-strategy.md`](./workflows/testing-strategy.md) - Стратегия тестирования
- [`deployment.md`](./workflows/deployment.md) - Деплой

### Team

- [`backend-developer.md`](./team/backend-developer.md) - Backend разработчик
- [`frontend-developer.md`](./team/frontend-developer.md) - Frontend разработчик
- [`tech-lead.md`](./team/tech-lead.md) - Tech Lead
- [`product-manager.md`](./team/product-manager.md) - Product Manager
- [`devops-engineer.md`](./team/devops-engineer.md) - DevOps инженер
- [`qa-engineer.md`](./team/qa-engineer.md) - QA инженер
- [`security-specialist.md`](./team/security-specialist.md) - Security специалист

## 🎯 Основные workflows

### Добавление новой сущности

1. Добавить модель в `prisma/schema.prisma`
2. Выполнить `npx prisma generate` и `npx prisma db push`
3. Создать NestJS модуль: `npx @nestjs/cli g resource name`
4. Обновить Service для работы с Prisma
5. Обновить DTO вручную с валидацией

**Подробнее:** [`workflows/add-new-entity.md`](./workflows/add-new-entity.md)

### Исправление багов

1. Воспроизвести баг
2. Написать failing test
3. Исправить код
4. Убедиться что тест проходит
5. Code review

**Подробнее:** [`workflows/bug-fixing.md`](./workflows/bug-fixing.md)

## 🔧 Технологии

### Backend
- **NestJS 10** - REST API framework
- **Prisma 5.22.0** - Type-safe ORM
- **Supabase** - PostgreSQL hosting
- **TypeScript** - Язык программирования

### Frontend (планируется)
- **SolidJS** - Reactive UI framework
- **TypeScript** - Язык программирования

## ⚠️ Важные моменты

### ARM64 Compatibility

Проект разрабатывается на Windows ARM64, что требует:
- **Node.js x64** версию (не ARM64!)
- Использование `PrismaService` с lazy initialization
- Специальные настройки для Prisma

**Подробнее:** [`tech-stack/arm64-compatibility.md`](./tech-stack/arm64-compatibility.md)

### Prisma Version

**Используется:** Prisma 5.22.0  
**НЕ использовать:** Prisma 7 (проблемы с ARM64)

### Запрещенные практики

- ❌ Использование `any` типа
- ❌ Default exports
- ❌ Прямое создание `PrismaClient`
- ❌ Хардкод секретов в коде
- ❌ Коммит `.env` файла

## 📝 Обновление документации

При изменении проекта обновляйте соответствующую документацию:

- Изменение стека → `tech-stack/`
- Новый workflow → `workflows/`
- Изменение ролей → `team/`
- Критические изменения → `MASTER-PROMPT.md`

## 🔗 Связанные ресурсы

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [SolidJS Documentation](https://www.solidjs.com/docs/latest)

---

**Последнее обновление:** 2024  
**Версия проекта:** 0.0.1

