# Настройка Supabase Storage для загрузки изображений товаров

## Шаг 1: Создание Bucket в Supabase Dashboard

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **Storage** (в левом меню)
4. Нажмите **"New bucket"** или **"Create bucket"**
5. Заполните форму:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **Включите** (чтобы изображения были доступны публично)
   - **File size limit**: `5 MB` (или больше, если нужно)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif` (опционально)

6. Нажмите **"Create bucket"**

## Шаг 2: Настройка политик доступа (Storage Policies)

После создания bucket нужно настроить политики доступа:

1. В Storage → `product-images` → **Policies**
2. Создайте следующие политики:

### Политика для чтения (SELECT) - Публичный доступ

```sql
-- Политика: Публичное чтение изображений
CREATE POLICY "Public Access for product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');
```

### Политика для загрузки (INSERT) - Только для авторизованных (опционально)

Если вы хотите ограничить загрузку только авторизованными пользователями:

```sql
-- Политика: Загрузка изображений (только для авторизованных)
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

**Или** для публичной загрузки (для тестирования):

```sql
-- Политика: Публичная загрузка изображений
CREATE POLICY "Public upload for product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images');
```

### Политика для удаления (DELETE) - Только для авторизованных (опционально)

```sql
-- Политика: Удаление изображений (только для авторизованных)
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

**Или** для публичного удаления (для тестирования):

```sql
-- Политика: Публичное удаление изображений
CREATE POLICY "Public delete for product images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-images');
```

## Шаг 3: Получение переменных окружения

1. В Supabase Dashboard перейдите в **Settings** → **API**
2. Найдите следующие значения:

### SUPABASE_URL
- **Project URL** (например: `https://xxxxx.supabase.co`)
- Скопируйте это значение

### SUPABASE_SERVICE_KEY
- **service_role** key (⚠️ **Секретный ключ!** Не публикуйте его)
- Это ключ с правами администратора
- Скопируйте это значение

## Шаг 4: Добавление переменных в .env

Откройте файл `backend/.env` и добавьте:

```env
# Supabase Storage для загрузки изображений
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

**Важно:**
- Замените `your-project-ref` на ваш Project Reference
- Замените `your-service-role-key-here` на ваш service_role key
- **НЕ коммитьте** `.env` файл в git (он должен быть в `.gitignore`)

## Шаг 5: Проверка работы

1. Перезапустите backend сервер
2. Попробуйте создать товар с изображением через фронтенд
3. Проверьте логи backend - должны быть сообщения:
   - `✅ Изображение загружено: https://...`
   - Или предупреждения, если переменные не настроены

## Troubleshooting

### Ошибка: "Supabase Storage не настроен"
- Проверьте, что переменные `SUPABASE_URL` и `SUPABASE_SERVICE_KEY` добавлены в `.env`
- Перезапустите backend после добавления переменных

### Ошибка: "Bucket not found"
- Убедитесь, что bucket `product-images` создан в Supabase Dashboard
- Проверьте, что имя bucket точно совпадает: `product-images`

### Ошибка: "new row violates row-level security policy"
- Проверьте, что политики доступа настроены правильно
- Для тестирования можно использовать публичные политики (см. выше)

### Изображения не отображаются
- Проверьте, что bucket помечен как **Public**
- Проверьте URL изображения в БД - должен начинаться с `https://...supabase.co/storage/v1/object/public/product-images/...`
- Откройте URL изображения в браузере напрямую

## Безопасность

⚠️ **Важно для production:**

1. **Не используйте публичные политики** для INSERT и DELETE в production
2. Настройте аутентификацию через JWT токены
3. Используйте **service_role key** только на backend (никогда на frontend!)
4. Регулярно ротируйте ключи доступа
5. Ограничьте размер файлов через политики bucket

## Дополнительная информация

- [Документация Supabase Storage](https://supabase.com/docs/guides/storage)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Storage API](https://supabase.com/docs/reference/javascript/storage)

