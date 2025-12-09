# 🎨 Настройка Frontend на Render.com

## 📋 Создание нового сервиса для Frontend

### Шаг 1: Создай новый Web Service

1. Открой: https://dashboard.render.com/new/web-service
2. Подключи GitHub репозиторий: `Razmik-Kutinava/test.coffee_panel-v1`
3. Нажми **"Connect"**

---

### Шаг 2: Настройки сервиса

#### **Basic Settings:**
```
Name:              coffee-panel-frontend
Region:            Frankfurt (или ближайший)
Branch:            main
Root Directory:    frontend
Runtime:           Node
Instance Type:     Free
```

#### **Build & Deploy:**
```
Build Command:     npm install && npm run build
Start Command:    npm run serve
```

**⚠️ ВАЖНО:** 
- Root Directory = `frontend`
- Start Command = `npm run serve` (это `vite preview`)

---

### Шаг 3: Environment Variables

Добавь переменную:

```
Key:   VITE_API_URL
Value: https://test-coffee-panel-v1.onrender.com
```

*(Это URL твоего backend сервиса на Render)*

---

### Шаг 4: Deploy

1. Нажми **"Create Web Service"**
2. Подожди 2-3 минуты пока соберется

---

## ✅ После деплоя:

### Frontend будет доступен по адресу:
```
https://coffee-panel-frontend-xxxx.onrender.com
```

### Проверка:
1. Открой URL в браузере
2. Должен загрузиться Admin Hub
3. API запросы должны идти на backend URL

---

## 🔄 Альтернатива: Static Site (рекомендуется)

Если хочешь использовать **Static Site** вместо Web Service (быстрее и проще):

1. **New → Static Site**
2. Подключи GitHub
3. Настройки:
   ```
   Name:              coffee-panel-frontend
   Branch:            main
   Root Directory:    frontend
   Build Command:     npm install && npm run build
   Publish Directory: dist
   ```
4. Environment Variable:
   ```
   VITE_API_URL=https://test-coffee-panel-v1.onrender.com
   ```

**Static Site** лучше для frontend - быстрее и бесплатно без ограничений!

---

## 🎯 Итоговая архитектура:

```
Frontend (Render Static Site):
https://coffee-panel-frontend.onrender.com
  ↓ API запросы
Backend (Render Web Service):
https://test-coffee-panel-v1.onrender.com
  ↓ Database
Supabase PostgreSQL
```

---

**Создай новый сервис для frontend и всё заработает!** 🚀

