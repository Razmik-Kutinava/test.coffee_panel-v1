# 🚨 БЫСТРОЕ ИСПРАВЛЕНИЕ: Загрузка изображений не работает

## Проблема

Ошибка при загрузке изображений:
```
❌ Ошибка загрузки изображения: Supabase Storage не настроен. 
Проверьте переменные окружения SUPABASE_URL и SUPABASE_SERVICE_KEY.
```

## ✅ Решение (5 минут)

### Шаг 1: Откройте Render Dashboard

1. Перейдите на https://dashboard.render.com
2. Войдите в аккаунт
3. Найдите сервис **coffee-panel-backend**

### Шаг 2: Добавьте переменные окружения

1. В меню сервиса выберите **Environment**
2. Нажмите **Add Environment Variable**

**Добавьте 2 переменные:**

#### 1. SUPABASE_URL
```
Key:   SUPABASE_URL
Value: https://wntvxdgxzenehfzvorae.supabase.co
```

#### 2. SUPABASE_SERVICE_KEY
```
Key:   SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudHZ4ZGd4emVuZWhmenZvcmFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTExNDEwOCwiZXhwIjoyMDgwNjkwMTA4fQ.xea_k8DBEUjPO1ThPGgwxkAwsH2SnRIgxfiPpRhy9kk
```

### Шаг 3: Сохраните и дождитесь redeploy

1. Нажмите **Save Changes**
2. Дождитесь завершения redeploy (2-5 минут)

### Шаг 4: Проверьте

1. Откройте https://test-coffee-panel-v1.vercel.app/
2. Перейдите в **Каталог** → **Товары** → **➕ Добавить товар**
3. Попробуйте загрузить изображение

**Должно работать!** ✅

---

## 📋 Полная инструкция

См. файл `RENDER_ENV_SETUP.md` для подробной инструкции.
