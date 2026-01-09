-- Добавляем onDelete CASCADE для критических внешних ключей

-- ProductModifierGroup: При удалении Product или ModifierGroup удаляем связь
ALTER TABLE "ProductModifierGroup"
DROP CONSTRAINT IF EXISTS "ProductModifierGroup_productId_fkey",
ADD CONSTRAINT "ProductModifierGroup_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE;

ALTER TABLE "ProductModifierGroup"
DROP CONSTRAINT IF EXISTS "ProductModifierGroup_modifierGroupId_fkey",
ADD CONSTRAINT "ProductModifierGroup_modifierGroupId_fkey"
  FOREIGN KEY ("modifierGroupId") REFERENCES "ModifierGroup"("id") ON DELETE CASCADE;

-- LocationProduct: При удалении Product или Location удаляем связь
ALTER TABLE "LocationProduct"
DROP CONSTRAINT IF EXISTS "LocationProduct_productId_fkey",
ADD CONSTRAINT "LocationProduct_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE;

ALTER TABLE "LocationProduct"
DROP CONSTRAINT IF EXISTS "LocationProduct_locationId_fkey",
ADD CONSTRAINT "LocationProduct_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE;

-- LocationCategory: При удалении Category или Location удаляем связь
ALTER TABLE "LocationCategory"
DROP CONSTRAINT IF EXISTS "LocationCategory_categoryId_fkey",
ADD CONSTRAINT "LocationCategory_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE;

ALTER TABLE "LocationCategory"
DROP CONSTRAINT IF EXISTS "LocationCategory_locationId_fkey",
ADD CONSTRAINT "LocationCategory_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE;

-- Category: При удалении родительской категории удаляем дочерние
ALTER TABLE "Category"
DROP CONSTRAINT IF EXISTS "Category_parentId_fkey",
ADD CONSTRAINT "Category_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE CASCADE;

-- Product: При удалении Category ставим NULL (SetNull)
ALTER TABLE "Product"
DROP CONSTRAINT IF EXISTS "Product_categoryId_fkey",
ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL;

-- OrderItem: При удалении Order удаляем позиции
ALTER TABLE "OrderItem"
DROP CONSTRAINT IF EXISTS "OrderItem_orderId_fkey",
ADD CONSTRAINT "OrderItem_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE;

-- OrderItemModifier: При удалении OrderItem удаляем модификаторы
ALTER TABLE "OrderItemModifier"
DROP CONSTRAINT IF EXISTS "OrderItemModifier_orderItemId_fkey",
ADD CONSTRAINT "OrderItemModifier_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE;
