-- Migration: Add 'customer' value to UserRole enum
-- This migration adds the 'customer' value to the user_role enum type in PostgreSQL

DO $$ 
BEGIN
  -- Check if 'customer' value already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'customer' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    -- Add 'customer' value to the enum
    ALTER TYPE user_role ADD VALUE 'customer';
    RAISE NOTICE 'Successfully added "customer" to UserRole enum';
  ELSE
    RAISE NOTICE 'Value "customer" already exists in UserRole enum';
  END IF;
END $$;

