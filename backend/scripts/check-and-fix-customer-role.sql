-- Проверка и исправление роли 'customer' в enum UserRole

-- 1. Проверяем, какие значения есть в enum
SELECT unnest(enum_range(NULL::"UserRole")) AS role_value;

-- 2. Проверяем, есть ли записи с ролью 'customer'
SELECT COUNT(*) as users_with_customer_role 
FROM "User" 
WHERE role = 'customer';

-- 3. Если значение 'customer' отсутствует в enum, добавляем его
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'customer' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'customer';
    RAISE NOTICE 'Successfully added "customer" to UserRole enum';
  ELSE
    RAISE NOTICE 'Value "customer" already exists in UserRole enum';
  END IF;
END $$;

-- 4. Проверяем результат
SELECT unnest(enum_range(NULL::"UserRole")) AS role_value;

