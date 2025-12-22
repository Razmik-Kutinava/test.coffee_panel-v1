# Миграция: Добавление роли 'customer' в enum UserRole

## Описание
Эта миграция добавляет значение `'customer'` в enum `user_role` в PostgreSQL.

## Выполнение миграции

### Вариант 1: Через Supabase Dashboard
1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Выполните SQL из файла `add_customer_role.sql`

### Вариант 2: Через psql
```bash
psql -h <your-host> -U <your-user> -d <your-database> -f add_customer_role.sql
```

### Вариант 3: Через Prisma Studio (если доступно)
Выполните SQL команду напрямую в базе данных:
```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';
```

## Проверка
После выполнения миграции проверьте, что значение добавлено:
```sql
SELECT unnest(enum_range(NULL::user_role)) AS role_value;
```

Должно быть видно значение `customer` в списке.

## Примечание
Если значение `customer` уже существует в enum, миграция безопасно пропустит добавление (благодаря `IF NOT EXISTS`).

