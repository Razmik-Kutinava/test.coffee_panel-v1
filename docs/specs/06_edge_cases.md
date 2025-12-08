# Edge Cases & Error Handling — Цифровая кофейня v1.0

## Обзор

Этот документ описывает все граничные случаи (edge cases) и стратегии обработки ошибок для каждого компонента системы.

---

# 1. КЛИЕНТСКИЙ ПУТЬ (Mini App)

## 1.1 Геолокация

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Пользователь разрешил доступ к геолокации | Показать карту с ближайшими точками, отсортировать по расстоянию | Карта с маркерами точек |
| Пользователь отказал в доступе | Показать список точек с ручным выбором | Список городов → список точек |
| Пользователь смахнул/закрыл запрос геолокации | То же что при отказе | Список точек |
| Геолокация недоступна (браузер/устройство) | Показать ручной выбор без повторных запросов | Список точек + сообщение "Включите геолокацию для автоматического определения" |
| Нет точек в радиусе 5 км | "Ближайшая точка в X км. Показать?" | Карта с одной точкой + кнопка "Показать все точки" |
| Нет точек в городе пользователя | "В вашем городе пока нет точек. Выберите другой город" | Список доступных городов |
| Геолокация вернула ошибку/таймаут | Показать ручной выбор | Список точек + сообщение об ошибке |

### Код обработки:
```typescript
async function handleGeolocation(): Promise<Location[]> {
  try {
    const position = await requestGeolocation({ timeout: 10000 });
    const nearbyLocations = await api.getLocations({
      lat: position.coords.latitude,
      lon: position.coords.longitude
    });
    
    if (nearbyLocations.length === 0) {
      // Найти ближайшую точку без ограничения радиуса
      const allLocations = await api.getLocations({ limit: 1 });
      if (allLocations.length > 0) {
        showConfirmDialog(
          `Ближайшая точка в ${allLocations[0].distance_km} км. Показать?`,
          () => navigateToLocation(allLocations[0])
        );
      }
    }
    
    return nearbyLocations;
  } catch (error) {
    if (error.code === GeolocationError.PERMISSION_DENIED) {
      // Пользователь отказал — не спрашивать повторно
      localStorage.setItem('geo_denied', 'true');
    }
    return await api.getLocations(); // Вернуть все точки
  }
}
```

---

## 1.2 Выбор точки

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Точка закрыта (не в рабочие часы) | Показать часы работы, заблокировать заказ | "Точка закрыта. Откроется в HH:MM" |
| Точка временно не работает (is_accepting_orders = false) | Показать сообщение | "Точка временно не принимает заказы" |
| Точка закрыта навсегда (status = closed) | Не показывать в списке | — |
| Точка на модерации (status = pending) | Не показывать клиентам | — |
| У точки особый режим работы (праздник) | Показать актуальные часы | Метка "Сегодня: 10:00-18:00" |

### Проверка доступности точки:
```typescript
function checkLocationAvailability(location: Location): AvailabilityResult {
  if (location.status !== 'active') {
    return { available: false, reason: 'location_inactive' };
  }
  
  if (!location.is_accepting_orders) {
    return { available: false, reason: 'not_accepting_orders' };
  }
  
  const now = new Date();
  const todayHours = location.working_hours[getDayName(now)];
  
  if (!todayHours.is_working) {
    return { 
      available: false, 
      reason: 'day_off',
      next_open_at: calculateNextOpenTime(location)
    };
  }
  
  const currentTime = formatTime(now);
  if (currentTime < todayHours.open || currentTime > todayHours.close) {
    return {
      available: false,
      reason: 'outside_hours',
      working_hours: todayHours,
      next_open_at: currentTime < todayHours.open 
        ? parseTime(todayHours.open)
        : calculateNextOpenTime(location)
    };
  }
  
  return { available: true };
}
```

---

## 1.3 Каталог и товары

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Товар закончился (stock = 0) | Показать с меткой, заблокировать добавление | Badge "Раскупили" на карточке |
| Товар временно недоступен | Показать с меткой и причиной | Badge "Временно нет" + подсказка |
| Товар скрыт на точке | Не показывать в меню | — |
| Модификатор недоступен | Заблокировать выбор | Серый цвет + пояснение |
| Вся категория пуста | Не показывать категорию | — |
| Нет товаров на точке | "Меню формируется" | Заглушка с информацией |

### Статусы товара:
```typescript
enum StockStatus {
  IN_STOCK = 'in_stock',       // Есть в наличии
  LOW_STOCK = 'low_stock',     // Мало (показываем "Осталось X шт")
  SOLD_OUT = 'sold_out',       // Раскупили
  UNAVAILABLE = 'unavailable'  // Временно недоступен
}

function getProductStockStatus(locationProduct: LocationProduct): StockStatus {
  if (!locationProduct.is_available) {
    return StockStatus.UNAVAILABLE;
  }
  
  if (locationProduct.stock_quantity === 0) {
    return StockStatus.SOLD_OUT;
  }
  
  if (locationProduct.stock_quantity <= 3) {
    return StockStatus.LOW_STOCK;
  }
  
  return StockStatus.IN_STOCK;
}
```

---

## 1.4 Корзина

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Товар в корзине закончился | Уведомить, предложить удалить | Alert + кнопка "Удалить" |
| Цена товара изменилась | Обновить цену, уведомить | "Цена товара изменилась: было X, стало Y" |
| Точка закрылась пока формировали заказ | Уведомить, заблокировать оформление | Modal "Точка закрыта. Заказ можно оформить с HH:MM" |
| Корзина пуста при попытке оформить | Заблокировать кнопку | Кнопка "Оформить" неактивна |
| Минимальная сумма заказа не достигнута | Показать сколько осталось | "До минимальной суммы заказа: X ₽" |

### Валидация корзины перед оформлением:
```typescript
interface CartValidationResult {
  isValid: boolean;
  errors: CartError[];
  warnings: CartWarning[];
}

async function validateCart(cart: CartItem[], locationId: string): Promise<CartValidationResult> {
  const errors: CartError[] = [];
  const warnings: CartWarning[] = [];
  
  // Проверить доступность точки
  const location = await api.getLocation(locationId);
  const availability = checkLocationAvailability(location);
  
  if (!availability.available) {
    errors.push({
      type: 'location_unavailable',
      message: getUnavailabilityMessage(availability),
      data: availability
    });
    return { isValid: false, errors, warnings };
  }
  
  // Проверить каждый товар
  const menu = await api.getLocationMenu(locationId);
  
  for (const item of cart) {
    const product = menu.findProduct(item.productId);
    
    if (!product) {
      errors.push({
        type: 'product_not_found',
        message: `Товар "${item.productName}" больше недоступен`,
        itemId: item.id
      });
      continue;
    }
    
    if (!product.is_available) {
      errors.push({
        type: 'product_unavailable',
        message: `"${product.name}" — ${product.unavailable_reason || 'временно недоступен'}`,
        itemId: item.id
      });
      continue;
    }
    
    if (product.stock_quantity < item.quantity) {
      if (product.stock_quantity === 0) {
        errors.push({
          type: 'out_of_stock',
          message: `"${product.name}" раскупили`,
          itemId: item.id
        });
      } else {
        errors.push({
          type: 'insufficient_stock',
          message: `"${product.name}" — осталось только ${product.stock_quantity} шт`,
          itemId: item.id,
          availableQuantity: product.stock_quantity
        });
      }
    }
    
    // Проверить цену
    const currentPrice = calculateItemPrice(product, item.modifiers);
    if (currentPrice !== item.unitPrice) {
      warnings.push({
        type: 'price_changed',
        message: `Цена "${product.name}" изменилась`,
        itemId: item.id,
        oldPrice: item.unitPrice,
        newPrice: currentPrice
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

---

## 1.5 Промокоды

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Промокод не найден | Показать ошибку | "Промокод не найден" |
| Промокод истёк | Показать ошибку | "Срок действия промокода истёк" |
| Промокод уже использован (лимит на юзера) | Показать ошибку | "Вы уже использовали этот промокод" |
| Общий лимит исчерпан | Показать ошибку | "Промокод больше недействителен" |
| Не достигнута минимальная сумма | Показать требование | "Минимальная сумма заказа для промокода: X ₽" |
| Промокод для другой точки | Показать ошибку | "Промокод действует только в точке Y" |
| Промокод успешно применён | Показать скидку | "Скидка X ₽ применена" |

### Обработка промокода:
```typescript
async function applyPromoCode(code: string, cart: Cart): Promise<PromoResult> {
  try {
    const result = await api.validatePromoCode({
      code,
      location_id: cart.locationId,
      order_amount: cart.subtotal
    });
    
    if (!result.is_valid) {
      return {
        success: false,
        error: getPromoErrorMessage(result.reason)
      };
    }
    
    return {
      success: true,
      discount: result.calculated_discount,
      promoCode: result
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Не удалось проверить промокод. Попробуйте позже.'
    };
  }
}

function getPromoErrorMessage(reason: string): string {
  const messages = {
    'not_found': 'Промокод не найден',
    'expired': 'Срок действия промокода истёк',
    'already_used': 'Вы уже использовали этот промокод',
    'usage_limit_reached': 'Промокод больше недействителен',
    'min_amount_not_reached': 'Минимальная сумма заказа не достигнута',
    'wrong_location': 'Промокод недействителен для этой точки',
    'inactive': 'Промокод неактивен'
  };
  return messages[reason] || 'Промокод недействителен';
}
```

---

## 1.6 Оплата

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Ошибка оплаты (отклонено) | Retry + сохранить корзину | "Оплата отклонена. Попробуйте другую карту" |
| Таймаут оплаты | Проверить статус на бэке, предложить retry | "Проверяем статус оплаты..." |
| Двойное списание | Проверка по payment_id, автовозврат | Логирование, уведомление поддержки |
| Пользователь закрыл форму оплаты | Сохранить заказ как черновик | "Заказ сохранён. Вернуться к оплате?" |
| Недостаточно средств | Показать ошибку | "Недостаточно средств на карте" |
| Карта заблокирована | Показать ошибку | "Карта заблокирована. Используйте другую" |
| Успешная оплата | Показать подтверждение + статус | "Заказ #42 оплачен!" |

### Обработка оплаты:
```typescript
async function processPayment(order: Order): Promise<PaymentResult> {
  const maxRetries = 3;
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Проверить, не была ли уже проведена оплата (защита от дублей)
      const existingPayment = await api.checkPaymentStatus(order.id);
      if (existingPayment.status === 'succeeded') {
        return { success: true, alreadyPaid: true };
      }
      
      // Инициировать оплату через Telegram Payments
      const payment = await telegramWebApp.openInvoice(order.payment.telegram_invoice_payload);
      
      if (payment.status === 'paid') {
        // Подождать подтверждения от webhook
        const confirmed = await waitForPaymentConfirmation(order.id, { timeout: 30000 });
        
        if (confirmed) {
          return { success: true };
        }
      }
      
      if (payment.status === 'cancelled') {
        return { 
          success: false, 
          cancelled: true,
          message: 'Оплата отменена' 
        };
      }
      
      if (payment.status === 'failed') {
        lastError = new Error(payment.error || 'Payment failed');
      }
      
    } catch (error) {
      lastError = error;
      
      // Проверить статус на бэке (возможно оплата прошла)
      const status = await api.checkPaymentStatus(order.id);
      if (status.status === 'succeeded') {
        return { success: true };
      }
      
      if (attempt < maxRetries) {
        await delay(1000 * attempt); // Exponential backoff
      }
    }
  }
  
  // Сохранить корзину для повторной попытки
  await saveCartToStorage(order);
  
  return {
    success: false,
    error: getPaymentErrorMessage(lastError),
    canRetry: true
  };
}

async function waitForPaymentConfirmation(orderId: string, options: { timeout: number }): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < options.timeout) {
    const status = await api.getOrderStatus(orderId);
    
    if (status.payment_status === 'succeeded') {
      return true;
    }
    
    if (status.payment_status === 'failed') {
      return false;
    }
    
    await delay(1000);
  }
  
  // Таймаут — статус неизвестен
  throw new Error('Payment confirmation timeout');
}
```

---

## 1.7 Статусы заказа

| Сценарий | Push-уведомление | UI |
|----------|------------------|-----|
| Заказ создан | — | "Ожидает оплаты" |
| Заказ оплачен | "Заказ #42 оплачен!" | "Ожидает подтверждения" |
| Заказ принят | "Ваш заказ принят!" | "Принят" |
| Заказ готовится | "Ваш заказ готовится ☕" | "Готовится" + прогресс |
| Заказ готов | "Заказ #42 готов! Заберите на кассе 🎉" | "Готов к выдаче" |
| Заказ выдан | "Спасибо за заказ! Ждём вас снова 🙏" | "Завершён" |
| Заказ отменён | "Заказ #42 отменён. Средства вернутся на карту" | "Отменён" + причина |

### Допустимые переходы статусов:
```typescript
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'created': ['paid', 'cancelled'],
  'paid': ['accepted', 'cancelled'],
  'accepted': ['preparing', 'cancelled'],
  'preparing': ['ready', 'cancelled'],
  'ready': ['completed', 'cancelled'],
  'completed': [], // Финальный статус
  'cancelled': ['refunded'],
  'refunded': [] // Финальный статус
};

function canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}
```

---

# 2. БАРИСТА (Табло заказов)

## 2.1 Работа с заказами

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Новый заказ | Звуковое уведомление + push | 🔔 Уведомление в TG + карточка в списке |
| Бариста не принимает заказ долго (>5 мин) | Повторное уведомление | Пометка "Ожидает 5+ мин" |
| Попытка принять заказ, уже принятый другим | Показать кто принял | "Заказ уже принят: Анна" |
| Потеря соединения | Показать статус, автопереподключение | "Нет связи. Переподключение..." |
| Восстановление соединения | Синхронизировать данные | Обновить список заказов |

### Обработка конкурентного доступа:
```typescript
async function acceptOrder(orderId: string, baristaId: string): Promise<AcceptResult> {
  try {
    // Оптимистичная блокировка через версию
    const order = await api.getOrder(orderId);
    
    if (order.status !== 'paid') {
      return {
        success: false,
        error: order.status === 'accepted' 
          ? `Заказ уже принят: ${order.accepted_by?.name}`
          : `Некорректный статус заказа: ${order.status}`
      };
    }
    
    const result = await api.updateOrderStatus(orderId, {
      status: 'accepted',
      expected_version: order.version // Оптимистичная блокировка
    });
    
    return { success: true, order: result };
    
  } catch (error) {
    if (error.code === 'CONFLICT') {
      // Кто-то успел раньше
      const order = await api.getOrder(orderId);
      return {
        success: false,
        error: `Заказ уже принят: ${order.accepted_by?.name}`
      };
    }
    throw error;
  }
}
```

---

## 2.2 Управление остатками

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Остаток = 0 | Товар помечается "Раскупили" в Mini App | Кнопка [-] неактивна |
| Остаток ≤ min_threshold | Предупреждение | ⚠️ "Мало на складе" |
| Ввод отрицательного значения | Валидация | "Остаток не может быть отрицательным" |
| Одновременное изменение остатка | Последнее значение выигрывает + лог | Показать кто изменил последним |
| Списание при выдаче заказа | Автоматическое уменьшение остатка | Лог в истории |

### Обновление остатков:
```typescript
async function updateStock(
  locationProductId: string, 
  newQuantity: number, 
  reason: string
): Promise<StockUpdateResult> {
  
  if (newQuantity < 0) {
    return { success: false, error: 'Остаток не может быть отрицательным' };
  }
  
  const current = await api.getLocationProduct(locationProductId);
  const adjustment = newQuantity - current.stock_quantity;
  
  const result = await api.updateStock(locationProductId, {
    stock_quantity: newQuantity,
    is_available: newQuantity > 0,
    unavailable_reason: newQuantity === 0 ? 'Раскупили' : null,
    reason
  });
  
  // Создать запись движения
  await api.createStockMovement({
    location_product_id: locationProductId,
    movement_type: adjustment > 0 ? 'adjustment_add' : 'adjustment_sub',
    quantity: adjustment,
    reason
  });
  
  return { success: true, newQuantity };
}
```

---

## 2.3 Отмена заказа

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Отмена оплаченного заказа | Инициировать возврат | Обязательный ввод причины |
| Отмена во время приготовления | Подтверждение + возврат | "Заказ уже готовится. Отменить?" |
| Ингредиент закончился | Частичная отмена (v2.0) | "Удалить позицию из заказа?" |

---

# 3. АДМИНКА (Hub)

## 3.1 Роли и доступы

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Бариста уволен | Деактивация без удаления (аудит) | Статус "Деактивирован" |
| Франчайзи продал точку | Передача прав новому владельцу | Wizard передачи прав |
| Попытка доступа без прав | 403 Forbidden | "У вас нет доступа к этому разделу" |
| Суперадмин удаляет себя | Запретить | "Нельзя удалить последнего суперадмина" |
| Истечение временного доступа | Автоматическая деактивация | Уведомление за 3 дня |

### Проверка прав:
```typescript
interface PermissionCheck {
  module: PermissionModule;
  action: PermissionAction;
  locationId?: string;
}

async function checkPermission(
  userId: string, 
  check: PermissionCheck
): Promise<boolean> {
  
  const user = await db.users.findById(userId);
  
  // Суперадмин имеет все права
  if (user.role === 'superadmin') {
    return true;
  }
  
  // Проверить гранулярные права
  const permission = await db.permissions.findOne({
    user_id: userId,
    module: check.module,
    action: check.action,
    // location_id = NULL означает доступ ко всем точкам
    location_id: check.locationId ? { $in: [check.locationId, null] } : null,
    // Проверить срок действия
    $or: [
      { expires_at: null },
      { expires_at: { $gt: new Date() } }
    ]
  });
  
  return !!permission;
}

// Middleware для NestJS
@Injectable()
export class PermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requiredPermission = this.reflector.get<PermissionCheck>('permission', context.getHandler());
    
    if (!requiredPermission) {
      return true; // Нет требований к правам
    }
    
    const locationId = request.params.locationId || request.body.location_id;
    
    const hasPermission = await checkPermission(request.user.id, {
      ...requiredPermission,
      locationId
    });
    
    if (!hasPermission) {
      throw new ForbiddenException('Недостаточно прав для выполнения действия');
    }
    
    return true;
  }
}
```

---

## 3.2 Управление точками

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Создание точки с существующим slug | Ошибка валидации | "Такой адрес уже существует" |
| Удаление точки с активными заказами | Запретить | "Есть незавершённые заказы" |
| Изменение координат | Пересчёт расстояний | Предупреждение + подтверждение |
| Массовое закрытие точек | Подтверждение | "Закрыть X точек?" |

---

## 3.3 Управление каталогом

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Удаление категории с товарами | Предупреждение | "В категории X товаров. Удалить?" |
| Удаление товара с историей заказов | Soft delete | Статус → inactive |
| Дубликат товара (slug) | Ошибка | "Товар с таким URL уже существует" |
| Товар партнёра на модерации | Показать в отдельном списке | Секция "На модерации" |

### Создание товара партнёром:
```typescript
async function createProductByPartner(
  partnerId: string,
  locationId: string,
  productData: CreateProductDto
): Promise<Product> {
  
  // Проверить, что партнёр владеет точкой
  const location = await db.locations.findById(locationId);
  if (location.owner_id !== partnerId) {
    throw new ForbiddenException('Вы не можете создавать товары для этой точки');
  }
  
  // Создать товар со статусом "на модерации"
  const product = await db.products.create({
    ...productData,
    status: 'pending_moderation',
    created_by: partnerId
  });
  
  // Уведомить УК о новом товаре
  await notificationService.notifyUK({
    type: 'product_pending_moderation',
    product_id: product.id,
    location_name: location.name,
    created_by_name: (await db.users.findById(partnerId)).name
  });
  
  return product;
}
```

---

## 3.4 Рассылки

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Рассылка пустому сегменту | Предупреждение | "Нет получателей для этой рассылки" |
| Telegram rate limit | Очередь с задержкой | "Отправка: X/Y" |
| Пользователь заблокировал бота | Пропустить, отметить | Статус "Заблокирован" |
| Отмена запланированной рассылки | Удалить из очереди | "Рассылка отменена" |

### Обработка рассылки:
```typescript
async function processBroadcast(broadcastId: string): Promise<void> {
  const broadcast = await db.broadcasts.findById(broadcastId);
  
  if (broadcast.status !== 'scheduled' && broadcast.status !== 'draft') {
    throw new Error('Broadcast already processed');
  }
  
  // Получить получателей
  const recipients = await getRecipients(broadcast);
  
  if (recipients.length === 0) {
    await db.broadcasts.update(broadcastId, { 
      status: 'cancelled',
      cancelled_reason: 'no_recipients'
    });
    return;
  }
  
  await db.broadcasts.update(broadcastId, { 
    status: 'sending',
    total_recipients: recipients.length,
    started_at: new Date()
  });
  
  let sentCount = 0;
  let failedCount = 0;
  
  for (const recipient of recipients) {
    try {
      // Rate limiting: max 30 msg/sec
      await rateLimiter.acquire();
      
      const result = await telegramBot.sendMessage(recipient.telegram_id, {
        text: broadcast.message,
        photo: broadcast.image_url,
        reply_markup: broadcast.button_text ? {
          inline_keyboard: [[{
            text: broadcast.button_text,
            url: broadcast.button_url
          }]]
        } : undefined
      });
      
      await db.broadcastLogs.create({
        broadcast_id: broadcastId,
        user_id: recipient.id,
        telegram_message_id: result.message_id,
        status: 'sent'
      });
      
      sentCount++;
      
    } catch (error) {
      await db.broadcastLogs.create({
        broadcast_id: broadcastId,
        user_id: recipient.id,
        status: 'failed',
        error_message: error.message
      });
      
      // Если пользователь заблокировал бота
      if (error.code === 403) {
        await db.users.update(recipient.id, { 
          accepts_marketing: false 
        });
      }
      
      failedCount++;
    }
    
    // Обновлять прогресс каждые 100 сообщений
    if ((sentCount + failedCount) % 100 === 0) {
      await db.broadcasts.update(broadcastId, { 
        sent_count: sentCount 
      });
    }
  }
  
  await db.broadcasts.update(broadcastId, { 
    status: 'sent',
    sent_count: sentCount,
    completed_at: new Date()
  });
}
```

---

# 4. TV-БОРД

| Сценарий | Поведение | UI |
|----------|-----------|-----|
| Потеря WebSocket соединения | Автопереподключение каждые 5 сек | Индикатор "Переподключение..." |
| Нет заказов | Показать логотип/рекламу | Слайдшоу или заставка |
| Много заказов (>10) | Пагинация или скролл | Автоскролл по списку |
| Заказ готов долго (>10 мин) | Мигающий индикатор | Пульсирующая анимация |

### WebSocket reconnection:
```typescript
class TVBoardConnection {
  private ws: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;
  
  connect(locationSlug: string) {
    this.ws = new WebSocket(`wss://api.brand.ru/ws/tv-board/${locationSlug}`);
    
    this.ws.onopen = () => {
      console.log('Connected to TV Board WebSocket');
      this.reconnectAttempts = 0;
      this.updateConnectionStatus('connected');
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket closed, attempting reconnect...');
      this.updateConnectionStatus('disconnected');
      this.scheduleReconnect(locationSlug);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateConnectionStatus('error');
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
  }
  
  private scheduleReconnect(locationSlug: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateConnectionStatus('failed');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      this.updateConnectionStatus('reconnecting');
      this.connect(locationSlug);
    }, delay);
  }
  
  private handleMessage(data: TVBoardMessage) {
    switch (data.type) {
      case 'orders_update':
        this.updateOrders(data.data);
        break;
      case 'order_ready':
        this.highlightReadyOrder(data.data);
        this.playSound('order_ready');
        break;
    }
  }
}
```

---

# 5. TELEGRAM BOT (Уведомления)

| Сценарий | Поведение | Сообщение |
|----------|-----------|-----------|
| Пользователь заблокировал бота | Отметить в БД, не пытаться отправлять | — |
| Telegram API недоступен | Retry с exponential backoff, очередь | — |
| Дубликат уведомления | Проверка по idempotency key | — |
| Слишком длинное сообщение | Разбить на части | Несколько сообщений |

---

# 6. ОБЩИЕ ПАТТЕРНЫ ОБРАБОТКИ ОШИБОК

## 6.1 Retry Strategy

```typescript
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Проверить, можно ли повторить
      if (!config.retryableErrors.includes(error.code)) {
        throw error;
      }
      
      if (attempt === config.maxAttempts) {
        break;
      }
      
      // Ждать перед повтором
      await sleep(delay);
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }
  
  throw lastError;
}

// Использование
const result = await withRetry(
  () => api.createOrder(orderData),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE']
  }
);
```

## 6.2 Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 30000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime! > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

## 6.3 Idempotency

```typescript
// Middleware для идемпотентных запросов
@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  constructor(private redis: RedisService) {}
  
  async use(req: Request, res: Response, next: NextFunction) {
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    
    if (!idempotencyKey) {
      return next();
    }
    
    // Проверить, был ли уже обработан такой запрос
    const cached = await this.redis.get(`idempotency:${idempotencyKey}`);
    
    if (cached) {
      const { statusCode, body } = JSON.parse(cached);
      return res.status(statusCode).json(body);
    }
    
    // Перехватить ответ
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Сохранить результат
      this.redis.set(
        `idempotency:${idempotencyKey}`,
        JSON.stringify({ statusCode: res.statusCode, body }),
        'EX',
        86400 // 24 часа
      );
      return originalJson(body);
    };
    
    next();
  }
}
```

---

# 7. МОНИТОРИНГ И АЛЕРТЫ

| Метрика | Порог | Действие |
|---------|-------|----------|
| Ошибки оплаты > 5% | Warning | Уведомление команде |
| Ошибки оплаты > 15% | Critical | Алерт + проверка платёжки |
| Время ответа API > 2s | Warning | Проверить нагрузку |
| Время ответа API > 5s | Critical | Масштабирование |
| WebSocket disconnects > 10/min | Warning | Проверить сеть |
| Заказ не принят > 10 мин | Warning | Push баристе |
| Заказ не принят > 20 мин | Critical | Алерт партнёру |

---

# 8. ЛОГИРОВАНИЕ

```typescript
// Структура лога
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  action: string;
  user_id?: string;
  order_id?: string;
  location_id?: string;
  duration_ms?: number;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

// Пример
{
  "timestamp": "2024-01-15T14:32:15.123Z",
  "level": "error",
  "service": "payment",
  "action": "process_payment",
  "user_id": "uuid",
  "order_id": "uuid",
  "duration_ms": 3500,
  "error": {
    "code": "PAYMENT_TIMEOUT",
    "message": "Payment gateway timeout after 3500ms"
  },
  "metadata": {
    "payment_provider": "telegram",
    "amount": 520,
    "retry_attempt": 2
  }
}
```
