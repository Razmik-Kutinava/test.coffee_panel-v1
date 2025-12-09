# ✅ Финальная настройка Vercel для работы с Render Backend

## 🎯 Текущая ситуация:

- ✅ **Frontend:** Задеплоен на Vercel
- ✅ **Backend:** Работает на Render: `https://test-coffee-panel-v1.onrender.com`

---

## 🔧 Шаг 1: Добавь Environment Variable в Vercel

### Открой Vercel Dashboard:
https://vercel.com/razmik-giurdzhians-projects/test-coffee-panel-v1/settings/environment-variables

### Добавь переменную:

```
Key:   VITE_API_URL
Value: https://test-coffee-panel-v1.onrender.com
```

**Environments:** 
- ✅ Production
- ✅ Preview  
- ✅ Development

**Нажми "Save"**

---

## 🔄 Шаг 2: Redeploy Frontend

После добавления переменной:

1. Вернись на главную: https://vercel.com/razmik-giurdzhians-projects/test-coffee-panel-v1
2. Нажми **"Redeploy"** → **"Redeploy without cache"**
3. Подожди 30-60 секунд

---

## ✅ Шаг 3: Проверка

### Открой сайт:
https://test-coffee-panel-v1.vercel.app

### Должно работать:
- ✅ Dashboard загружается
- ✅ Каталог, Точки, Заказы - все страницы
- ✅ API запросы идут на Render backend
- ✅ Данные загружаются

### Проверь в DevTools:
1. Открой DevTools → **Network**
2. Обнови страницу
3. Должны быть запросы к: `https://test-coffee-panel-v1.onrender.com/locations`
4. Статус должен быть **200 OK**

---

## 🐛 Если не работает:

### Проблема: "Failed to fetch" или CORS ошибка

**Решение:** Проверь что backend на Render разрешает CORS:

В `backend/src/main.ts` должно быть:
```typescript
app.enableCors({
  origin: '*',  // или конкретный URL Vercel
  credentials: false,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Проблема: API запросы идут на localhost

**Решение:** 
1. Проверь что `VITE_API_URL` добавлен в Vercel
2. Сделай **Redeploy without cache**
3. Проверь в браузере: `console.log(import.meta.env.VITE_API_URL)` - должен показать Render URL

---

## 🎉 Готово!

После настройки:
- ✅ Frontend на Vercel: https://test-coffee-panel-v1.vercel.app
- ✅ Backend на Render: https://test-coffee-panel-v1.onrender.com
- ✅ Всё работает вместе! 🚀

---

**Сделай эти 2 шага и всё заработает!** 

