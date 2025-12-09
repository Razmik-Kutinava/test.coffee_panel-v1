# 🚀 Настройка Backend на Render.com

## 📋 Проект уже создан: 
https://dashboard.render.com/web/srv-d4s3cjqli9vc73fuh2fg

---

## ⚙️ Шаг 1: Проверь настройки в Dashboard

### 1. Откройте Settings вашего сервиса:
https://dashboard.render.com/web/srv-d4s3cjqli9vc73fuh2fg/settings

### 2. Проверьте/измените настройки:

#### **Root Directory:**
```
backend
```

#### **Build Command:**
```
npm install && npx prisma generate && npm run build
```

#### **Start Command:**
```
npm run start:prod
```

#### **Environment:**
- Runtime: `Node`
- Region: `Frankfurt` (или ближайший)
- Instance Type: `Free`

---

## 🔑 Шаг 2: Добавь Environment Variables

### В разделе Environment → Add Environment Variable:

#### 1. DATABASE_URL
```
Key:   DATABASE_URL
Value: postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```
*(Скопируй из Supabase Project Settings → Database → Connection string → Transaction)*

#### 2. DIRECT_URL
```
Key:   DIRECT_URL
Value: postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```
*(Скопируй из Supabase → Session connection string)*

#### 3. NODE_ENV
```
Key:   NODE_ENV
Value: production
```

#### 4. PORT (опционально, Render устанавливает автоматически)
```
Key:   PORT
Value: 10000
```

#### 5. FRONTEND_URL (для CORS)
```
Key:   FRONTEND_URL
Value: https://test-coffee-panel-v1.vercel.app
```

---

## 🔄 Шаг 3: Manual Deploy

После добавления переменных:

1. Вернись на главную страницу сервиса
2. Нажми **"Manual Deploy"** → **"Deploy latest commit"**
3. Подожди 3-5 минут пока соберется

---

## 📊 Шаг 4: Проверь логи

### Во время сборки смотри Logs:

Должно быть:
```
==> Cloning from https://github.com/Razmik-Kutinava/test.coffee_panel-v1...
==> Running build command 'npm install && npx prisma generate && npm run build'...
    added 245 packages
    
    Prisma schema loaded from prisma/schema.prisma
    ✔ Generated Prisma Client
    
    > nest build
    Build completed
    
==> Running start command 'npm run start:prod'...
    🚀 Application is running on: http://0.0.0.0:10000
    
==> Your service is live 🎉
```

---

## 🐛 Возможные ошибки и решения:

### Ошибка: "Cannot find module '@prisma/client'"
**Решение:** Убедись что в Build Command есть `npx prisma generate`

### Ошибка: "Port 3001 already in use"
**Решение:** Render автоматически задает PORT. В `backend/src/main.ts` должно быть:
```typescript
const port = process.env.PORT ?? 3001;
```
(Уже есть в коде!)

### Ошибка: "PrismaClient could not connect to database"
**Решение:** Проверь DATABASE_URL - должен быть правильный пароль

### Ошибка: Build timeout
**Решение:** На бесплатном плане билд может занять до 15 минут

---

## ✅ После успешного деплоя:

### 1. Получи URL сервиса:
```
https://coffee-panel-backend.onrender.com
```
(или другой, который Render сгенерирует)

### 2. Проверь что API работает:
Открой в браузере:
```
https://coffee-panel-backend.onrender.com/
```

Должно вернуть:
```json
{"message": "Coffee Panel API v1.0"}
```

### 3. Обнови Vercel Environment Variables:

Зайди в Vercel → Settings → Environment Variables:
```
Key:   VITE_API_URL
Value: https://coffee-panel-backend.onrender.com
```

Сохрани и сделай Redeploy frontend.

---

## 🎯 Финальная проверка:

1. ✅ Backend на Render работает
2. ✅ API endpoints отвечают
3. ✅ WebSocket работает
4. ✅ Frontend на Vercel обновлен с VITE_API_URL
5. ✅ Данные загружаются в Admin Hub

---

## ⚠️ Важно про Free Plan:

- **Засыпает** после 15 минут неактивности
- **Просыпается** при первом запросе (~30 секунд)
- **750 часов/месяц** бесплатно

Для production рекомендую Paid Plan ($7/месяц) - не засыпает.

---

## 🔗 Полезные ссылки:

- Твой сервис: https://dashboard.render.com/web/srv-d4s3cjqli9vc73fuh2fg
- Render Docs: https://render.com/docs/deploy-nestjs
- Prisma на Render: https://render.com/docs/deploy-prisma

---

**После настройки напиши что показывает в логах - помогу разобраться!** 🚀

