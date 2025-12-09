# 🚀 Deployment Guide

Это руководство по деплою **Coffee Panel v1.0** на продакшен.

## 📋 Архитектура деплоя

```
┌─────────────────┐         ┌──────────────────┐
│  Frontend       │────────▶│  Backend         │
│  (Vercel)       │  HTTP   │  (Railway)       │
│  Solid.js       │◀────────│  NestJS + WS     │
└─────────────────┘         └──────────────────┘
                                    │
                                    ▼
                            ┌──────────────────┐
                            │  Database        │
                            │  (Supabase)      │
                            └──────────────────┘
```

### Почему такая архитектура?

- **Frontend на Vercel** ✅ - статический билд Solid.js, CDN, быстрый деплой
- **Backend НЕ на Vercel** ❌ - Vercel не поддерживает долгоживущие WebSocket соединения
- **Backend на Railway/Render** ✅ - полноценный Node.js runtime с WebSocket

---

## 🎯 Шаг 1: Деплой Backend (Railway)

### 1.1. Создание проекта на Railway

1. Перейдите на [railway.app](https://railway.app)
2. Войдите через GitHub
3. Нажмите **"New Project"** → **"Deploy from GitHub repo"**
4. Выберите репозиторий `test.coffee_panel-v1`
5. Railway автоматически определит NestJS проект

### 1.2. Настройка переменных окружения

В Railway Dashboard → **Variables** добавьте:

```env
# Prisma
DATABASE_URL=postgresql://user:password@host:5432/dbname
DIRECT_URL=postgresql://user:password@host:5432/dbname

# Supabase (optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Node.js
NODE_ENV=production
PORT=3001
```

### 1.3. Настройка билда

В Railway → **Settings** → **Build**:

```json
{
  "buildCommand": "cd backend && npm install && npx prisma generate && npm run build",
  "startCommand": "cd backend && npm run start:prod",
  "watchPaths": ["backend/**"]
}
```

### 1.4. Применение миграций Prisma

После первого деплоя выполните в Railway Console:

```bash
cd backend && npx prisma migrate deploy
```

### 1.5. Получение URL

После деплоя Railway выдаст URL вида:
```
https://test-coffee-panel-v1-production.up.railway.app
```

**Сохраните этот URL** - он понадобится для frontend!

---

## 🎨 Шаг 2: Деплой Frontend (Vercel)

### 2.1. Подключение проекта к Vercel

Ваш проект уже подключен к Vercel! Теперь настроим переменные окружения.

### 2.2. Настройка переменных окружения

В Vercel Dashboard → **Settings** → **Environment Variables** добавьте:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_URL` | `https://your-backend.railway.app` | Production |
| `VITE_API_URL` | `http://localhost:3001` | Development |

**⚠️ ВАЖНО:** Замените `https://your-backend.railway.app` на реальный URL из Railway!

### 2.3. Проверка конфигурации

Убедитесь что в корне проекта есть файлы:
- ✅ `vercel.json` - конфигурация Vercel
- ✅ `package.json` - команды сборки
- ✅ `.vercelignore` - исключение backend из билда

### 2.4. Триггер нового деплоя

После добавления переменных окружения:

```bash
git commit --allow-empty -m "chore: trigger redeploy with env vars"
git push origin main
```

Vercel автоматически задеплоит новую версию.

---

## 🔧 Шаг 3: Проверка работоспособности

### 3.1. Проверка Backend (Railway)

Откройте в браузере:
```
https://your-backend.railway.app/
```

Должно вернуться:
```json
{"message": "Coffee Panel API v1.0"}
```

Проверьте WebSocket:
```
https://your-backend.railway.app/socket.io/
```

### 3.2. Проверка Frontend (Vercel)

Откройте в браузере:
```
https://test-coffee-panel-v1.vercel.app
```

Должны загрузиться:
- ✅ Dashboard с данными
- ✅ Каталог, точки, заказы
- ✅ Barista Dashboard
- ✅ TV-Board

### 3.3. Проверка WebSocket соединений

1. Откройте **Barista Dashboard**
2. Откройте DevTools → **Network** → **WS**
3. Должно быть активное WebSocket соединение к Railway backend

---

## 🐛 Troubleshooting

### Проблема: Frontend не подключается к Backend

**Причина:** Неправильная переменная `VITE_API_URL`

**Решение:**
1. Проверьте Vercel Dashboard → Environment Variables
2. Убедитесь что `VITE_API_URL` указывает на Railway URL
3. Сделайте новый деплой: `git commit --allow-empty -m "fix: env vars" && git push`

### Проблема: WebSocket не работает

**Причина:** CORS или неправильный протокол

**Решение:**
1. Проверьте `backend/src/main.ts` - должен быть `app.enableCors()`
2. Убедитесь что Railway поддерживает WebSocket (по умолчанию да)
3. Проверьте `frontend/src/pages/Barista.tsx` - URL должен быть без `/socket.io`

### Проблема: База данных не подключается

**Причина:** Неправильный `DATABASE_URL`

**Решение:**
1. Проверьте Railway → Variables → `DATABASE_URL`
2. Убедитесь что Supabase Database разрешает подключения (pooling enabled)
3. Примените миграции: `npx prisma migrate deploy`

### Проблема: Backend падает на старте

**Причина:** Не сгенерирован Prisma Client

**Решение:**
1. Railway → Settings → Build Command должен содержать `npx prisma generate`
2. Или выполните вручную в Railway Console:
```bash
cd backend && npx prisma generate && npm run build && npm run start:prod
```

---

## 📊 Мониторинг

### Railway Logs

```bash
# В Railway Dashboard → Deployments → View Logs
# Смотрите на ошибки startup
```

### Vercel Logs

```bash
# В Vercel Dashboard → Deployment → Runtime Logs
# Проверяйте сетевые ошибки к Backend API
```

---

## 🎉 Готово!

Если всё настроено правильно:

✅ Frontend доступен на: `https://test-coffee-panel-v1.vercel.app`  
✅ Backend доступен на: `https://your-backend.railway.app`  
✅ WebSocket работает  
✅ База данных подключена (Supabase)  

---

## 📝 Следующие шаги

1. Настройте кастомный домен в Vercel (опционально)
2. Настройте мониторинг (Railway Metrics, Sentry)
3. Настройте SSL сертификаты (автоматически в Railway/Vercel)
4. Добавьте CI/CD pipelines (GitHub Actions)

---

## 🔗 Полезные ссылки

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

