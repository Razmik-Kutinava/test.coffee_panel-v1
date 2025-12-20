import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOrphanedProducts() {
  try {
    console.log('🧹 Начинаем очистку товаров "латте" и "капучино"...');

    // Находим товары по имени
    const productsToDelete = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'латте', mode: 'insensitive' } },
          { name: { contains: 'капучино', mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: {
            orderItems: true,
            locations: true,
          },
        },
      },
    });

    console.log(`📦 Найдено товаров для удаления: ${productsToDelete.length}`);

    for (const product of productsToDelete) {
      console.log(`\n🗑️  Удаляем товар: ${product.name} (ID: ${product.id})`);
      console.log(`   - Заказов: ${product._count.orderItems}`);
      console.log(`   - Локаций: ${product._count.locations}`);

      try {
        // Удаляем все связанные записи
        const modifierGroups = await prisma.productModifierGroup.deleteMany({
          where: { productId: product.id },
        });
        console.log(`   ✅ Удалено групп модификаторов: ${modifierGroups.count}`);

        const locationProducts = await prisma.locationProduct.deleteMany({
          where: { productId: product.id },
        });
        console.log(`   ✅ Удалено связей с локациями: ${locationProducts.count}`);

        // Если есть заказы, удаляем orderItems
        if (product._count.orderItems > 0) {
          const orderItems = await prisma.orderItem.deleteMany({
            where: { productId: product.id },
          });
          console.log(`   ✅ Удалено позиций заказов: ${orderItems.count}`);
        }

        // Удаляем сам товар
        await prisma.product.delete({
          where: { id: product.id },
        });
        console.log(`   ✅ Товар успешно удален`);
      } catch (error: any) {
        console.error(`   ❌ Ошибка при удалении товара ${product.id}:`, error.message);
      }
    }

    console.log(`\n✨ Очистка завершена! Удалено товаров: ${productsToDelete.length}`);
  } catch (error) {
    console.error('❌ Ошибка при очистке:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedProducts();

