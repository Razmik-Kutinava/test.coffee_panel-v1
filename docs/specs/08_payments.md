# 08. Модуль оплаты

> Интеграция с Telegram Payments API

---

## 1. Описание

Оплата заказов через Telegram Payments API. В РФ используется провайдер (ЮKassa, Тинькофф, СБП через Telegram).

---

## 2. Архитектура оплаты

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLOW ОПЛАТЫ                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Mini App                    Backend                    Telegram              Provider
    │                          │                          │                      │
    │  1. Создать заказ        │                          │                      │
    │─────────────────────────▶│                          │                      │
    │                          │                          │                      │
    │  2. Invoice payload      │                          │                      │
    │◀─────────────────────────│                          │                      │
    │                          │                          │                      │
    │  3. openInvoice()        │                          │                      │
    │─────────────────────────────────────────────────────▶                      │
    │                          │                          │                      │
    │                          │                          │  4. Форма оплаты     │
    │◀─────────────────────────────────────────────────────                      │
    │                          │                          │                      │
    │  5. Ввод карты           │                          │                      │
    │─────────────────────────────────────────────────────▶                      │
    │                          │                          │                      │
    │                          │                          │  6. Запрос оплаты    │
    │                          │                          │─────────────────────▶│
    │                          │                          │                      │
    │                          │                          │  7. Результат        │
    │                          │                          │◀─────────────────────│
    │                          │                          │                      │
    │                          │  8. pre_checkout_query   │                      │
    │                          │◀─────────────────────────│                      │
    │                          │                          │                      │
    │                          │  9. answerPreCheckout    │                      │
    │                          │─────────────────────────▶│                      │
    │                          │                          │                      │
    │                          │  10. successful_payment  │                      │
    │                          │◀─────────────────────────│                      │
    │                          │                          │                      │
    │  11. Подтверждение       │                          │                      │
    │◀─────────────────────────│                          │                      │
```

---

## 3. Создание заказа и Invoice

### 3.1 Создание заказа (Backend)

```typescript
// POST /api/v1/public/orders
async function createOrder(dto: CreateOrderDto, user: User): Promise<Order> {
  // 1. Валидация
  const location = await validateLocation(dto.location_id);
  const items = await validateItems(dto.items, dto.location_id);
  
  // 2. Расчёт цен
  const subtotal = calculateSubtotal(items);
  const discount = await calculateDiscount(dto.promo_code, subtotal);
  const total = subtotal - discount.amount;
  
  // 3. Создание заказа
  const order = await db.orders.create({
    user_id: user.id,
    location_id: dto.location_id,
    order_number: await generateOrderNumber(dto.location_id),
    status: 'created',
    payment_status: 'pending',
    subtotal,
    discount_amount: discount.amount,
    total_amount: total,
    promo_code_id: discount.promo_code_id,
    promo_code_text: dto.promo_code,
    customer_name: user.telegram_first_name,
    comment: dto.comment
  });
  
  // 4. Создание позиций
  await createOrderItems(order.id, items);
  
  // 5. Генерация invoice для Telegram Payments
  const invoice = createTelegramInvoice(order);
  
  return {
    ...order,
    payment: {
      status: 'pending',
      telegram_invoice_payload: invoice.payload
    }
  };
}
```

### 3.2 Генерация Telegram Invoice

```typescript
interface TelegramInvoice {
  title: string;
  description: string;
  payload: string;
  provider_token: string;
  currency: string;
  prices: Array<{ label: string; amount: number }>;
  photo_url?: string;
}

function createTelegramInvoice(order: Order): TelegramInvoice {
  return {
    title: `Заказ #${order.order_number}`,
    description: formatOrderDescription(order),
    payload: JSON.stringify({
      order_id: order.id,
      amount: order.total_amount,
      timestamp: Date.now()
    }),
    provider_token: process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN,
    currency: 'RUB',
    prices: [
      {
        label: 'Заказ',
        amount: Math.round(order.total_amount * 100) // В копейках
      }
    ],
    photo_url: order.items[0]?.product_image_url,
    photo_size: 600,
    photo_width: 600,
    photo_height: 400
  };
}

function formatOrderDescription(order: Order): string {
  const items = order.items
    .map(item => `${item.product_name} × ${item.quantity}`)
    .join(', ');
  
  return items.length > 200 
    ? items.substring(0, 197) + '...' 
    : items;
}
```

---

## 4. Обработка Webhooks

### 4.1 Pre-checkout Query

Telegram отправляет этот запрос ДО списания средств. Мы должны подтвердить, что заказ валиден.

```typescript
// POST /webhooks/telegram
async function handlePreCheckoutQuery(query: PreCheckoutQuery): Promise<void> {
  try {
    const payload = JSON.parse(query.invoice_payload);
    const order = await db.orders.findById(payload.order_id);
    
    // Проверки
    if (!order) {
      await bot.answerPreCheckoutQuery(query.id, false, 'Заказ не найден');
      return;
    }
    
    if (order.payment_status !== 'pending') {
      await bot.answerPreCheckoutQuery(query.id, false, 'Заказ уже оплачен');
      return;
    }
    
    if (order.total_amount !== payload.amount) {
      await bot.answerPreCheckoutQuery(query.id, false, 'Сумма изменилась');
      return;
    }
    
    // Проверить доступность товаров
    const validation = await validateOrderItems(order);
    if (!validation.valid) {
      await bot.answerPreCheckoutQuery(query.id, false, validation.message);
      return;
    }
    
    // Проверить точку
    const location = await db.locations.findById(order.location_id);
    if (!isLocationOpen(location)) {
      await bot.answerPreCheckoutQuery(query.id, false, 'Точка закрыта');
      return;
    }
    
    // Всё ок — подтверждаем
    await bot.answerPreCheckoutQuery(query.id, true);
    
    // Обновляем статус на "обрабатывается"
    await db.orders.update(order.id, { payment_status: 'processing' });
    
  } catch (error) {
    console.error('Pre-checkout error:', error);
    await bot.answerPreCheckoutQuery(query.id, false, 'Ошибка обработки');
  }
}
```

### 4.2 Successful Payment

Telegram отправляет после успешного списания средств.

```typescript
async function handleSuccessfulPayment(message: Message): Promise<void> {
  const payment = message.successful_payment;
  const payload = JSON.parse(payment.invoice_payload);
  
  // Защита от дублей
  const existingPayment = await db.orders.findOne({
    payment_id: payment.provider_payment_charge_id
  });
  
  if (existingPayment) {
    console.warn('Duplicate payment webhook:', payment.provider_payment_charge_id);
    return;
  }
  
  // Обновить статус заказа
  await db.orders.update(payload.order_id, {
    status: 'paid',
    payment_status: 'succeeded',
    payment_id: payment.provider_payment_charge_id,
    payment_provider: 'telegram',
    payment_data: {
      telegram_payment_charge_id: payment.telegram_payment_charge_id,
      provider_payment_charge_id: payment.provider_payment_charge_id,
      total_amount: payment.total_amount,
      currency: payment.currency
    },
    paid_at: new Date()
  });
  
  // Записать в историю статусов
  await db.orderStatusHistory.create({
    order_id: payload.order_id,
    old_status: 'created',
    new_status: 'paid',
    change_source: 'system'
  });
  
  // Параллельные действия
  await Promise.all([
    // Чек клиенту
    sendReceiptToCustomer(payload.order_id),
    
    // Уведомление баристе
    notifyBarista(payload.order_id),
    
    // Обновить TV-борд (через WebSocket)
    // Заказ появится после принятия баристой
  ]);
}
```

---

## 5. Статусы оплаты

| Статус | Описание | Действия |
|--------|----------|----------|
| `pending` | Ожидает оплаты | Invoice создан, ждём оплату |
| `processing` | Обрабатывается | Pre-checkout подтверждён |
| `succeeded` | Оплачено | Деньги списаны |
| `failed` | Ошибка | Оплата не прошла |
| `cancelled` | Отменено | Пользователь закрыл форму |
| `refunded` | Возврат | Деньги возвращены |

---

## 6. Отправка чека

```typescript
async function sendReceiptToCustomer(orderId: string): Promise<void> {
  const order = await db.orders.findById(orderId, {
    include: ['user', 'location', 'items']
  });
  
  const receiptText = formatReceipt(order);
  
  await bot.sendMessage(order.user.telegram_id, receiptText, {
    parse_mode: 'HTML'
  });
}

function formatReceipt(order: Order): string {
  const items = order.items
    .map(item => {
      const modifiers = item.modifiers
        .map(m => `   • ${m.option_name}`)
        .join('\n');
      
      return `${item.product_name} × ${item.quantity}\n${modifiers}\n${item.total_price} ₽`;
    })
    .join('\n\n');
  
  return `
✅ <b>Заказ #${order.order_number} оплачен!</b>

📍 ${order.location.name}
${order.location.address}

━━━━━━━━━━━━━━━━━━━━

${items}

━━━━━━━━━━━━━━━━━━━━

${order.discount_amount > 0 ? `Скидка: -${order.discount_amount} ₽\n` : ''}
<b>Итого: ${order.total_amount} ₽</b>

━━━━━━━━━━━━━━━━━━━━

Ожидайте уведомление о готовности!
  `.trim();
}
```

---

## 7. Возврат средств

```typescript
// Ручной возврат через админку
async function refundOrder(
  orderId: string, 
  adminId: string,
  reason: string
): Promise<void> {
  const order = await db.orders.findById(orderId);
  
  if (order.payment_status !== 'succeeded') {
    throw new Error('Order is not paid');
  }
  
  if (order.status === 'completed') {
    throw new Error('Cannot refund completed order');
  }
  
  // Вызов API провайдера для возврата
  // (зависит от провайдера)
  await paymentProvider.refund({
    payment_id: order.payment_id,
    amount: order.total_amount
  });
  
  // Обновить статусы
  await db.orders.update(orderId, {
    status: 'cancelled',
    payment_status: 'refunded',
    cancelled_at: new Date(),
    cancelled_by: adminId,
    cancellation_reason: reason
  });
  
  // Уведомить клиента
  await bot.sendMessage(order.user.telegram_id, `
❌ Заказ #${order.order_number} отменён

${reason}

💰 Средства будут возвращены на карту в течение 3-5 рабочих дней.
  `);
}
```

---

## 8. Обработка ошибок

### 8.1 Типичные ошибки

| Ошибка | Причина | Действие |
|--------|---------|----------|
| Недостаточно средств | На карте нет денег | Показать ошибку, сохранить корзину |
| Карта заблокирована | Банк заблокировал | Предложить другую карту |
| Таймаут | Долгий ответ | Проверить статус, retry |
| Двойное списание | Race condition | Проверка по payment_id |
| Товар закончился | Между корзиной и оплатой | Отменить, вернуть деньги |

### 8.2 Retry стратегия (на клиенте)

```typescript
async function processPayment(order: Order): Promise<PaymentResult> {
  const maxRetries = 3;
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Проверить, не оплачен ли уже
      const status = await api.checkPaymentStatus(order.id);
      if (status.payment_status === 'succeeded') {
        return { success: true, alreadyPaid: true };
      }
      
      // Открыть форму оплаты
      const result = await telegramWebApp.openInvoice(
        order.payment.telegram_invoice_payload
      );
      
      if (result.status === 'paid') {
        // Дождаться подтверждения от webhook
        const confirmed = await waitForConfirmation(order.id, 30000);
        if (confirmed) {
          return { success: true };
        }
      }
      
      if (result.status === 'cancelled') {
        return { success: false, cancelled: true };
      }
      
    } catch (error) {
      lastError = error;
      
      // Проверить статус на бэке
      const status = await api.checkPaymentStatus(order.id);
      if (status.payment_status === 'succeeded') {
        return { success: true };
      }
      
      if (attempt < maxRetries) {
        await delay(1000 * attempt); // Exponential backoff
      }
    }
  }
  
  // Сохранить корзину
  await saveCartToStorage(order);
  
  return {
    success: false,
    error: getPaymentErrorMessage(lastError),
    canRetry: true
  };
}
```

---

## 9. Безопасность

### 9.1 Проверки

1. **Валидация payload** — проверять подпись от Telegram
2. **Идемпотентность** — проверка по payment_id от дублей
3. **Актуальность суммы** — сверять amount в payload с заказом
4. **Доступность товаров** — проверять перед подтверждением
5. **Статус точки** — проверять перед подтверждением

### 9.2 Логирование

```typescript
// Логировать все платёжные события
await db.paymentLogs.create({
  order_id: orderId,
  event_type: 'pre_checkout' | 'successful_payment' | 'refund',
  payload: JSON.stringify(data),
  result: 'success' | 'error',
  error_message: error?.message,
  created_at: new Date()
});
```

---

## 10. Настройки в Hub

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Настройки → Оплата                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TELEGRAM PAYMENTS                                                          │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  Провайдер          [ЮKassa ▼]                                             │
│  Provider Token     [••••••••••••••••••••••••••••]  [Показать]             │
│                                                                             │
│  Тестовый режим     [ ]                                                    │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  ДОСТУПНЫЕ МЕТОДЫ ПО ТОЧКАМ                                                 │
│                                                                             │
│  ┌───────────────────┬─────────────┬─────────┬───────┐                     │
│  │ Точка             │ TG Payments │ Наличные│ СБП   │                     │
│  ├───────────────────┼─────────────┼─────────┼───────┤                     │
│  │ Тверская          │ [✓]         │ [ ]     │ [ ]   │                     │
│  │ Арбат             │ [✓]         │ [ ]     │ [ ]   │                     │
│  │ Сити              │ [✓]         │ [✓]     │ [ ]   │                     │
│  └───────────────────┴─────────────┴─────────┴───────┘                     │
│                                                                             │
│  [Сохранить]                                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
