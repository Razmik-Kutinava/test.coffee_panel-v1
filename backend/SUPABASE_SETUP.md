# Настройка подключения к Supabase для Prisma

## Проблема

Ошибка `P1000: Authentication failed` возникает когда:
- Учетные данные базы данных неверные или устарели
- Пароль базы данных был изменен в панели Supabase
- Неправильно настроены строки подключения в `.env`

## Решение

### Шаг 1: Получите актуальные учетные данные из Supabase

1. Откройте панель Supabase: https://supabase.com/dashboard
2. Выберите ваш проект (ID: `wntvxdgxzenehfzvorae`)
3. Перейдите в **Settings** → **Database**
4. Найдите раздел **Connection string**
5. Скопируйте строки подключения:
   - **Connection pooling** (для `DATABASE_URL`)
   - **Direct connection** (для `DIRECT_URL`)

### Шаг 2: Обновите файл `.env`

Обновите следующие переменные в `backend/.env`:

```env
# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

**Важно:**
- Замените `[PROJECT_REF]` на ваш project reference
- Замените `[PASSWORD]` на актуальный пароль базы данных
- Для `DIRECT_URL` используйте тот же пароль, что и для `DATABASE_URL`
- Порт для `DIRECT_URL` должен быть `5432` (не `6543`)

### Шаг 3: Сброс пароля базы данных (если нужно)

Если вы не помните пароль:

1. В панели Supabase перейдите в **Settings** → **Database**
2. Найдите раздел **Database password**
3. Нажмите **Reset database password**
4. Скопируйте новый пароль
5. Обновите `.env` файл с новым паролем

### Шаг 4: Проверьте подключение

После обновления `.env` файла выполните:

```bash
cd backend
npx prisma db push
```

## Что нужно было сделать заранее

Чтобы избежать этой ошибки:

1. **Сохранить пароль базы данных** сразу после создания проекта Supabase
2. **Использовать переменные окружения** вместо хардкода паролей в коде
3. **Проверить строки подключения** перед запуском миграций
4. **Использовать Supabase CLI** для получения актуальных строк подключения:
   ```bash
   supabase status
   ```

## Дополнительная информация

- **DATABASE_URL** используется для обычных запросов через connection pooling (порт 6543)
- **DIRECT_URL** используется для миграций Prisma и требует прямого подключения (порт 5432)
- Оба URL должны использовать один и тот же пароль базы данных
- Хост для обоих URL обычно одинаковый (`aws-1-ap-south-1.pooler.supabase.com`)

