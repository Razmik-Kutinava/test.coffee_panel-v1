# Проверка и исправление роли 'customer'

## Шаг 1: Проверьте, добавлено ли значение в базу данных

Выполните в Supabase SQL Editor:

```sql
-- Проверка текущих значений enum
SELECT unnest(enum_range(NULL::"UserRole")) AS role_value;
```

Если `customer` отсутствует в списке, выполните:

```sql
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'customer';
```

## Шаг 2: Проверьте, есть ли записи с ролью 'customer'

```sql
SELECT COUNT(*) as count, role 
FROM "User" 
WHERE role = 'customer'
GROUP BY role;
```

## Шаг 3: Перезапустите бэкенд сервер

После добавления значения в enum и перегенерации Prisma Client нужно перезапустить бэкенд:

1. Остановите текущий процесс бэкенда (Ctrl+C)
2. Запустите заново: `.\start-backend-only.ps1`

Или если запускаете вручную:
```powershell
cd backend
npm run start:dev
```

## Если проблема сохраняется

Если после всех шагов ошибка остается, возможно в базе данных есть записи с `customer`, но enum не содержит это значение. В таком случае:

1. Сначала добавьте значение в enum (шаг 1)
2. Затем перезапустите бэкенд (шаг 3)

