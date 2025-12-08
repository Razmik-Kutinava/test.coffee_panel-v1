# API Endpoints — Цифровая кофейня v1.0

## Обзор архитектуры API

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                    │
│                         api.brand.ru/v1/                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   PUBLIC    │  │   BARISTA   │  │    ADMIN    │  │  WEBHOOKS   │        │
│  │   /public   │  │  /barista   │  │   /admin    │  │  /webhooks  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│        │                │                │                │                │
│        ▼                ▼                ▼                ▼                │
│  Mini App (Flutter) TG Bot (табло)  Hub (Solid.js)  Telegram API          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Аутентификация

### Telegram Mini App
```
Header: X-Telegram-Init-Data: <initData from WebApp>
```
Бэкенд валидирует `initData` через HMAC с bot token.

### Admin Hub / Barista Bot
```
Header: Authorization: Bearer <JWT>
```
JWT содержит: `user_id`, `role`, `location_ids[]`, `permissions[]`

---

# 1. PUBLIC API (Mini App)

Доступно для всех пользователей Mini App.

## 1.1 Локации

### GET /public/locations
Получить список активных точек.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| lat | number | No | Широта для сортировки по расстоянию |
| lon | number | No | Долгота |
| city | string | No | Фильтр по городу |
| limit | number | No | Лимит (default: 50) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Кофейня Тверская",
      "slug": "msk-tverskaya",
      "address": "Тверская ул., 15",
      "city": "Москва",
      "latitude": 55.7558,
      "longitude": 37.6173,
      "distance_km": 0.5,
      "is_open": true,
      "is_accepting_orders": true,
      "working_hours": {
        "today": {"open": "08:00", "close": "22:00"},
        "is_working": true
      },
      "next_open_at": null
    }
  ],
  "meta": {
    "total": 15,
    "limit": 50
  }
}
```

### GET /public/locations/:id
Получить детали точки.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Кофейня Тверская",
    "slug": "msk-tverskaya",
    "address": "Тверская ул., 15",
    "city": "Москва",
    "phone": "+7 999 123-45-67",
    "latitude": 55.7558,
    "longitude": 37.6173,
    "is_open": true,
    "is_accepting_orders": true,
    "working_hours": {
      "monday": {"open": "08:00", "close": "22:00", "is_working": true},
      "tuesday": {"open": "08:00", "close": "22:00", "is_working": true},
      "wednesday": {"open": "08:00", "close": "22:00", "is_working": true},
      "thursday": {"open": "08:00", "close": "22:00", "is_working": true},
      "friday": {"open": "08:00", "close": "22:00", "is_working": true},
      "saturday": {"open": "09:00", "close": "21:00", "is_working": true},
      "sunday": {"open": "10:00", "close": "20:00", "is_working": true}
    },
    "payment_methods": ["telegram_payments"],
    "legal_documents": {
      "privacy_policy_url": "https://...",
      "terms_url": "https://...",
      "offer_url": "https://..."
    }
  }
}
```

**Response 404:**
```json
{
  "error": {
    "code": "LOCATION_NOT_FOUND",
    "message": "Точка не найдена"
  }
}
```

---

## 1.2 Меню

### GET /public/locations/:locationId/menu
Получить меню точки (категории + товары).

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| category | string | No | Фильтр по slug категории |

**Response 200:**
```json
{
  "data": {
    "location_id": "uuid",
    "location_name": "Кофейня Тверская",
    "categories": [
      {
        "id": "uuid",
        "name": "Кофе",
        "slug": "coffee",
        "sort_order": 1,
        "products": [
          {
            "id": "uuid",
            "name": "Капучино",
            "slug": "cappuccino",
            "description": "Классический итальянский капучино",
            "short_description": "Эспрессо + молочная пенка",
            "image_url": "https://...",
            "price": 320,
            "is_available": true,
            "is_featured": false,
            "is_new": true,
            "stock_status": "in_stock",
            "unavailable_reason": null,
            "modifier_groups": [
              {
                "id": "uuid",
                "name": "Размер",
                "type": "single",
                "is_required": true,
                "options": [
                  {"id": "uuid", "name": "S (250мл)", "price_adjustment": 0, "is_default": false},
                  {"id": "uuid", "name": "M (350мл)", "price_adjustment": 50, "is_default": true},
                  {"id": "uuid", "name": "L (450мл)", "price_adjustment": 100, "is_default": false}
                ]
              },
              {
                "id": "uuid",
                "name": "Молоко",
                "type": "single",
                "is_required": false,
                "options": [
                  {"id": "uuid", "name": "Обычное", "price_adjustment": 0, "is_default": true},
                  {"id": "uuid", "name": "Овсяное", "price_adjustment": 60, "is_default": false},
                  {"id": "uuid", "name": "Кокосовое", "price_adjustment": 60, "is_default": false}
                ]
              },
              {
                "id": "uuid",
                "name": "Сироп",
                "type": "multiple",
                "is_required": false,
                "max_selections": 3,
                "options": [
                  {"id": "uuid", "name": "Ваниль", "price_adjustment": 40, "is_default": false},
                  {"id": "uuid", "name": "Карамель", "price_adjustment": 40, "is_default": false},
                  {"id": "uuid", "name": "Лесной орех", "price_adjustment": 40, "is_default": false}
                ]
              }
            ]
          }
        ]
      },
      {
        "id": "uuid",
        "name": "Выпечка",
        "slug": "bakery",
        "sort_order": 2,
        "products": [
          {
            "id": "uuid",
            "name": "Круассан",
            "slug": "croissant",
            "description": "Французский круассан",
            "image_url": "https://...",
            "price": 180,
            "is_available": false,
            "stock_status": "sold_out",
            "unavailable_reason": "Раскупили",
            "modifier_groups": []
          }
        ]
      }
    ]
  }
}
```

### GET /public/products/:productId
Получить детали товара.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Капучино",
    "slug": "cappuccino",
    "description": "Классический итальянский капучино с нежной молочной пенкой",
    "images": [
      "https://cdn.brand.ru/products/cappuccino-1.jpg",
      "https://cdn.brand.ru/products/cappuccino-2.jpg"
    ],
    "category": {
      "id": "uuid",
      "name": "Кофе",
      "slug": "coffee"
    },
    "modifier_groups": [...],
    "nutritional_info": {
      "calories": 120,
      "proteins": 6,
      "fats": 5,
      "carbs": 12
    }
  }
}
```

---

## 1.3 Заказы

### POST /public/orders
Создать заказ.

**Request Body:**
```json
{
  "location_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 1,
      "modifier_option_ids": ["uuid", "uuid"],
      "comment": "Без сахара"
    },
    {
      "product_id": "uuid",
      "quantity": 2,
      "modifier_option_ids": []
    }
  ],
  "promo_code": "COFFEE10",
  "customer_name": "Александр",
  "comment": "Позвоните когда будет готово"
}
```

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "order_number": 42,
    "status": "created",
    "items": [
      {
        "id": "uuid",
        "product_name": "Капучино",
        "product_image_url": "https://...",
        "quantity": 1,
        "modifiers": [
          {"name": "M (350мл)", "price_adjustment": 50},
          {"name": "Овсяное молоко", "price_adjustment": 60}
        ],
        "unit_price": 430,
        "total_price": 430
      },
      {
        "id": "uuid",
        "product_name": "Круассан",
        "quantity": 2,
        "modifiers": [],
        "unit_price": 180,
        "total_price": 360
      }
    ],
    "subtotal": 790,
    "discount": {
      "code": "COFFEE10",
      "type": "percentage",
      "value": 10,
      "amount": 79
    },
    "total_amount": 711,
    "payment": {
      "status": "pending",
      "payment_url": "https://t.me/$PAYMENT_INVOICE_LINK",
      "telegram_invoice_payload": "..."
    },
    "location": {
      "id": "uuid",
      "name": "Кофейня Тверская",
      "address": "Тверская ул., 15"
    },
    "created_at": "2024-01-15T14:32:00Z"
  }
}
```

**Response 400 (товар недоступен):**
```json
{
  "error": {
    "code": "PRODUCT_UNAVAILABLE",
    "message": "Некоторые товары недоступны",
    "details": {
      "unavailable_items": [
        {
          "product_id": "uuid",
          "product_name": "Круассан",
          "reason": "sold_out"
        }
      ]
    }
  }
}
```

**Response 400 (точка закрыта):**
```json
{
  "error": {
    "code": "LOCATION_CLOSED",
    "message": "Точка сейчас закрыта",
    "details": {
      "working_hours": {"open": "08:00", "close": "22:00"},
      "next_open_at": "2024-01-16T08:00:00Z"
    }
  }
}
```

**Response 400 (промокод):**
```json
{
  "error": {
    "code": "PROMO_CODE_INVALID",
    "message": "Промокод недействителен",
    "details": {
      "reason": "expired" | "already_used" | "min_amount_not_reached" | "not_found"
    }
  }
}
```

### GET /public/orders/:id
Получить статус заказа.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "order_number": 42,
    "status": "preparing",
    "status_text": "Готовится",
    "payment_status": "succeeded",
    "items": [...],
    "total_amount": 711,
    "location": {
      "id": "uuid",
      "name": "Кофейня Тверская",
      "address": "Тверская ул., 15"
    },
    "customer_name": "Александр",
    "timeline": [
      {"status": "created", "at": "2024-01-15T14:32:00Z"},
      {"status": "paid", "at": "2024-01-15T14:32:15Z"},
      {"status": "accepted", "at": "2024-01-15T14:33:00Z"},
      {"status": "preparing", "at": "2024-01-15T14:33:30Z"}
    ],
    "estimated_ready_at": "2024-01-15T14:40:00Z",
    "created_at": "2024-01-15T14:32:00Z"
  }
}
```

### GET /public/orders
Получить историю заказов пользователя.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | No | Фильтр по статусу |
| limit | number | No | Лимит (default: 20) |
| offset | number | No | Смещение |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "order_number": 42,
      "status": "completed",
      "total_amount": 711,
      "items_count": 2,
      "location": {
        "name": "Кофейня Тверская"
      },
      "created_at": "2024-01-15T14:32:00Z",
      "completed_at": "2024-01-15T14:45:00Z"
    }
  ],
  "meta": {
    "total": 14,
    "limit": 20,
    "offset": 0
  }
}
```

---

## 1.4 Промокоды

### POST /public/promo-codes/validate
Проверить промокод.

**Request Body:**
```json
{
  "code": "COFFEE10",
  "location_id": "uuid",
  "order_amount": 790
}
```

**Response 200:**
```json
{
  "data": {
    "is_valid": true,
    "code": "COFFEE10",
    "type": "percentage",
    "discount_value": 10,
    "calculated_discount": 79,
    "min_order_amount": null,
    "max_discount_amount": 500,
    "expires_at": "2024-02-01T00:00:00Z"
  }
}
```

**Response 200 (невалидный):**
```json
{
  "data": {
    "is_valid": false,
    "code": "COFFEE10",
    "reason": "min_amount_not_reached",
    "message": "Минимальная сумма заказа: 1000 ₽"
  }
}
```

---

## 1.5 Пользователь

### GET /public/me
Получить профиль текущего пользователя.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "telegram_id": 123456789,
    "first_name": "Александр",
    "last_name": "Иванов",
    "username": "@alex_i",
    "phone": "+7 999 123-45-67",
    "preferred_location": {
      "id": "uuid",
      "name": "Кофейня Тверская"
    },
    "stats": {
      "total_orders": 14,
      "total_amount": 12500
    },
    "accepts_marketing": true
  }
}
```

### PATCH /public/me
Обновить профиль.

**Request Body:**
```json
{
  "phone": "+7 999 123-45-67",
  "preferred_location_id": "uuid",
  "accepts_marketing": false
}
```

---

# 2. BARISTA API (Табло баристы)

Доступно для пользователей с ролью `barista` или выше.

## 2.1 Заказы

### GET /barista/orders
Получить заказы точки.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| location_id | uuid | Yes* | ID точки (*автоматически для баристы одной точки) |
| status | string | No | Фильтр: `active` (paid,accepted,preparing,ready), или конкретный статус |
| date | date | No | Дата (default: today) |

**Response 200:**
```json
{
  "data": {
    "location": {
      "id": "uuid",
      "name": "Кофейня Тверская"
    },
    "summary": {
      "new": 3,
      "in_progress": 2,
      "ready": 1,
      "completed_today": 47,
      "cancelled_today": 0
    },
    "orders": [
      {
        "id": "uuid",
        "order_number": 42,
        "status": "paid",
        "customer_name": "Александр",
        "items": [
          {
            "product_name": "Капучино",
            "quantity": 1,
            "modifiers": ["M (350мл)", "Овсяное молоко", "Ванильный сироп"]
          },
          {
            "product_name": "Круассан",
            "quantity": 1,
            "modifiers": []
          }
        ],
        "total_amount": 520,
        "comment": "Без сахара",
        "created_at": "2024-01-15T14:32:00Z",
        "waiting_time_minutes": 5
      }
    ]
  }
}
```

### PATCH /barista/orders/:id/status
Изменить статус заказа.

**Request Body:**
```json
{
  "status": "accepted" | "preparing" | "ready" | "completed" | "cancelled",
  "cancellation_reason": "Нет ингредиентов"
}
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "order_number": 42,
    "status": "accepted",
    "accepted_at": "2024-01-15T14:33:00Z",
    "accepted_by": {
      "id": "uuid",
      "name": "Анна"
    }
  },
  "notifications": {
    "customer_notified": true,
    "tv_board_updated": true
  }
}
```

**Response 400 (некорректный переход):**
```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Нельзя перевести заказ из статуса 'completed' в 'preparing'",
    "details": {
      "current_status": "completed",
      "requested_status": "preparing",
      "allowed_transitions": []
    }
  }
}
```

### GET /barista/orders/:id
Получить детали заказа.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "order_number": 42,
    "status": "preparing",
    "customer": {
      "name": "Александр",
      "phone": "+7 999 ***-**-67",
      "telegram_username": "@alex_i"
    },
    "items": [
      {
        "id": "uuid",
        "product_name": "Капучино",
        "product_image_url": "https://...",
        "quantity": 1,
        "modifiers": [
          {"group": "Размер", "option": "M (350мл)"},
          {"group": "Молоко", "option": "Овсяное"},
          {"group": "Сироп", "option": "Ваниль"}
        ],
        "unit_price": 430,
        "comment": "Без сахара"
      }
    ],
    "subtotal": 610,
    "discount": {
      "code": "COFFEE10",
      "amount": 61
    },
    "total_amount": 549,
    "payment": {
      "status": "succeeded",
      "provider": "telegram",
      "paid_at": "2024-01-15T14:32:15Z"
    },
    "comment": "Позвоните когда готово",
    "timeline": [...],
    "created_at": "2024-01-15T14:32:00Z"
  }
}
```

---

## 2.2 Остатки

### GET /barista/stock
Получить остатки точки.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| location_id | uuid | Yes* | ID точки |
| category_id | uuid | No | Фильтр по категории |
| low_stock_only | boolean | No | Только товары с низким остатком |

**Response 200:**
```json
{
  "data": {
    "location_id": "uuid",
    "products": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "name": "Капучино",
        "category": "Кофе",
        "stock_quantity": 45,
        "min_stock_threshold": 10,
        "is_available": true,
        "stock_status": "normal"
      },
      {
        "id": "uuid",
        "product_id": "uuid",
        "name": "Круассан",
        "category": "Выпечка",
        "stock_quantity": 3,
        "min_stock_threshold": 5,
        "is_available": true,
        "stock_status": "low"
      },
      {
        "id": "uuid",
        "product_id": "uuid",
        "name": "Сэндвич",
        "category": "Еда",
        "stock_quantity": 0,
        "min_stock_threshold": 3,
        "is_available": false,
        "unavailable_reason": "Раскупили",
        "stock_status": "out_of_stock"
      }
    ]
  }
}
```

### PATCH /barista/stock/:locationProductId
Обновить остаток товара.

**Request Body:**
```json
{
  "stock_quantity": 10,
  "is_available": true,
  "reason": "Допекли партию"
}
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "product_name": "Круассан",
    "stock_quantity": 10,
    "is_available": true,
    "updated_at": "2024-01-15T14:35:00Z",
    "updated_by": {
      "id": "uuid",
      "name": "Анна"
    }
  }
}
```

### POST /barista/stock/:locationProductId/adjust
Быстрая корректировка остатка (+1/-1).

**Request Body:**
```json
{
  "adjustment": 1 | -1,
  "reason": "Списание по порче"
}
```

---

# 3. ADMIN API (Hub)

Доступно для `franchisee`, `staff_uk`, `superadmin` с соответствующими правами.

## 3.1 Дашборд

### GET /admin/dashboard
Получить сводную статистику.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| location_id | uuid | No | Фильтр по точке (для партнёров автоматически) |
| period | string | No | `today`, `week`, `month`, `custom` |
| start_date | date | No | Начало периода (для custom) |
| end_date | date | No | Конец периода |

**Response 200:**
```json
{
  "data": {
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-15"
    },
    "overview": {
      "total_revenue": 1250000,
      "total_orders": 2847,
      "average_check": 439,
      "new_customers": 156,
      "returning_customers_rate": 0.42
    },
    "comparison": {
      "revenue_change": 0.12,
      "orders_change": 0.08,
      "average_check_change": 0.04
    },
    "by_location": [
      {
        "location_id": "uuid",
        "location_name": "Кофейня Тверская",
        "revenue": 450000,
        "orders": 1024,
        "average_check": 439
      }
    ],
    "top_products": [
      {
        "product_id": "uuid",
        "product_name": "Капучино",
        "quantity_sold": 892,
        "revenue": 285440
      }
    ],
    "hourly_distribution": [
      {"hour": 8, "orders": 45},
      {"hour": 9, "orders": 78},
      {"hour": 10, "orders": 112}
    ]
  }
}
```

### GET /admin/dashboard/realtime
Получить данные в реальном времени (для WebSocket или polling).

**Response 200:**
```json
{
  "data": {
    "active_orders": {
      "new": 3,
      "preparing": 5,
      "ready": 2
    },
    "today": {
      "revenue": 45200,
      "orders": 98,
      "average_check": 461
    },
    "locations_status": [
      {
        "location_id": "uuid",
        "name": "Тверская",
        "is_open": true,
        "active_orders": 4,
        "today_orders": 52
      }
    ]
  }
}
```

---

## 3.2 Локации (Точки)

### GET /admin/locations
Получить список точек.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | No | Фильтр по статусу |
| city | string | No | Фильтр по городу |
| owner_id | uuid | No | Фильтр по владельцу (для УК) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Кофейня Тверская",
      "slug": "msk-tverskaya",
      "address": "Тверская ул., 15",
      "city": "Москва",
      "status": "active",
      "is_open": true,
      "owner": {
        "id": "uuid",
        "name": "Сергей Ковалёв"
      },
      "stats": {
        "today_orders": 52,
        "today_revenue": 23400
      },
      "created_at": "2023-06-15"
    }
  ]
}
```

### POST /admin/locations
Создать точку.

**Request Body:**
```json
{
  "name": "Кофейня Арбат",
  "slug": "msk-arbat",
  "address": "Арбат, 24",
  "city": "Москва",
  "latitude": 55.7520,
  "longitude": 37.5877,
  "phone": "+7 999 765-43-21",
  "owner_id": "uuid",
  "working_hours": {...},
  "use_global_catalog": true,
  "payment_settings": {
    "telegram_payments": true
  }
}
```

### GET /admin/locations/:id
Получить детали точки.

### PATCH /admin/locations/:id
Обновить точку.

### DELETE /admin/locations/:id
Закрыть точку (soft delete → status = 'closed').

---

## 3.3 Каталог (Категории и Товары)

### GET /admin/categories
Получить все категории.

### POST /admin/categories
Создать категорию.

```json
{
  "name": "Десерты",
  "slug": "desserts",
  "description": "Сладости к кофе",
  "image_url": "https://...",
  "sort_order": 5
}
```

### PATCH /admin/categories/:id
Обновить категорию.

### DELETE /admin/categories/:id
Удалить категорию.

### GET /admin/products
Получить все товары.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| category_id | uuid | No | Фильтр по категории |
| status | string | No | Фильтр по статусу |
| search | string | No | Поиск по названию |

### POST /admin/products
Создать товар.

```json
{
  "name": "Раф",
  "slug": "raf",
  "description": "Нежный кофейный напиток со сливками",
  "short_description": "Эспрессо + сливки + ванильный сахар",
  "category_id": "uuid",
  "base_price": 380,
  "image_url": "https://...",
  "modifier_group_ids": ["uuid", "uuid"],
  "is_featured": false,
  "is_new": true
}
```

### PATCH /admin/products/:id
Обновить товар.

### DELETE /admin/products/:id
Удалить товар (soft delete → status = 'inactive').

---

## 3.4 Модификаторы

### GET /admin/modifier-groups
Получить все группы модификаторов.

### POST /admin/modifier-groups
Создать группу.

```json
{
  "name": "Топпинги",
  "type": "multiple",
  "is_required": false,
  "max_selections": 5,
  "options": [
    {"name": "Взбитые сливки", "price_adjustment": 50, "sort_order": 1},
    {"name": "Шоколадная крошка", "price_adjustment": 30, "sort_order": 2},
    {"name": "Маршмеллоу", "price_adjustment": 40, "sort_order": 3}
  ]
}
```

### PATCH /admin/modifier-groups/:id
Обновить группу.

### POST /admin/modifier-groups/:id/options
Добавить опцию в группу.

### PATCH /admin/modifier-options/:id
Обновить опцию.

### DELETE /admin/modifier-options/:id
Удалить опцию.

---

## 3.5 Привязка товаров к точкам

### GET /admin/locations/:locationId/products
Получить товары точки.

### POST /admin/locations/:locationId/products
Привязать товары к точке.

```json
{
  "products": [
    {
      "product_id": "uuid",
      "price_override": 350,
      "stock_quantity": 50,
      "is_available": true
    }
  ]
}
```

### PATCH /admin/locations/:locationId/products/:productId
Обновить настройки товара на точке.

```json
{
  "price_override": 380,
  "is_available": false,
  "unavailable_reason": "Сезонный товар"
}
```

### DELETE /admin/locations/:locationId/products/:productId
Открепить товар от точки.

---

## 3.6 Заказы

### GET /admin/orders
Получить все заказы.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| location_id | uuid | No | Фильтр по точке |
| status | string | No | Фильтр по статусу |
| user_id | uuid | No | Фильтр по клиенту |
| date_from | date | No | Начало периода |
| date_to | date | No | Конец периода |
| search | string | No | Поиск по номеру заказа или имени |
| sort | string | No | Сортировка: `created_at`, `-created_at`, `total_amount` |
| limit | number | No | Лимит |
| offset | number | No | Смещение |

### GET /admin/orders/:id
Получить детали заказа (расширенные данные для админа).

### POST /admin/orders/:id/refund
Оформить возврат.

```json
{
  "amount": 520,
  "reason": "Клиент отказался от заказа"
}
```

### GET /admin/orders/export
Экспорт заказов в CSV/Excel.

---

## 3.7 Пользователи (Клиенты)

### GET /admin/users
Получить список клиентов.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| location_id | uuid | No | Клиенты точки |
| segment | string | No | `new`, `active`, `inactive`, `vip` |
| search | string | No | Поиск |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "telegram_id": 123456789,
      "name": "Александр Иванов",
      "username": "@alex_i",
      "phone": "+7 999 123-45-67",
      "status": "active",
      "stats": {
        "total_orders": 14,
        "total_amount": 12500,
        "average_check": 893,
        "last_order_at": "2024-01-15"
      },
      "preferred_location": "Тверская",
      "created_at": "2023-08-20"
    }
  ],
  "meta": {
    "total": 207,
    "segments": {
      "active": 175,
      "inactive": 32,
      "new_this_week": 12
    }
  }
}
```

### GET /admin/users/:id
Детали клиента с историей заказов.

### PATCH /admin/users/:id
Обновить клиента (например, заблокировать).

```json
{
  "status": "blocked",
  "block_reason": "Злоупотребление промокодами"
}
```

---

## 3.8 Промокоды

### GET /admin/promo-codes
Получить все промокоды.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| location_id | uuid | No | Фильтр по точке |
| status | string | No | `active`, `expired`, `depleted` |

### POST /admin/promo-codes
Создать промокод.

```json
{
  "code": "WINTER20",
  "description": "Зимняя акция -20%",
  "type": "percentage",
  "discount_value": 20,
  "scope": "global",
  "min_order_amount": 500,
  "max_discount_amount": 300,
  "usage_limit": 1000,
  "usage_limit_per_user": 1,
  "starts_at": "2024-01-15T00:00:00Z",
  "expires_at": "2024-02-15T23:59:59Z"
}
```

### PATCH /admin/promo-codes/:id
Обновить промокод.

### DELETE /admin/promo-codes/:id
Деактивировать промокод.

### GET /admin/promo-codes/:id/usages
Получить историю использований.

---

## 3.9 Рассылки

### GET /admin/broadcasts
Получить все рассылки.

### POST /admin/broadcasts
Создать рассылку.

```json
{
  "title": "Новый сезонный латте",
  "message": "☕ Тыквенный спайс уже в меню!\nПромокод PUMPKIN на скидку 15%",
  "image_url": "https://...",
  "button_text": "Открыть меню",
  "button_url": "https://t.me/brand_bot?start=menu",
  "scope": "location",
  "location_id": "uuid",
  "scheduled_at": "2024-01-20T10:00:00Z"
}
```

### GET /admin/broadcasts/:id
Детали рассылки со статистикой.

### POST /admin/broadcasts/:id/send
Отправить рассылку немедленно.

### DELETE /admin/broadcasts/:id
Отменить запланированную рассылку.

---

## 3.10 Сотрудники и Доступы

### GET /admin/staff
Получить сотрудников.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| location_id | uuid | No | Фильтр по точке |
| role | string | No | Фильтр по роли |

### POST /admin/staff
Добавить сотрудника.

```json
{
  "telegram_id": 987654321,
  "role": "barista",
  "location_id": "uuid",
  "position": "Бариста"
}
```

### GET /admin/staff/:id
Детали сотрудника с правами.

### PATCH /admin/staff/:id
Обновить сотрудника.

### DELETE /admin/staff/:id
Уволить сотрудника (soft delete → deactivate).

### GET /admin/staff/:id/permissions
Получить права сотрудника.

### PUT /admin/staff/:id/permissions
Установить права сотрудника.

```json
{
  "permissions": [
    {"module": "orders", "action": "view"},
    {"module": "orders", "action": "change_status"},
    {"module": "products", "action": "view"},
    {"module": "products", "action": "manage_stock"}
  ]
}
```

---

## 3.11 Настройки

### GET /admin/settings
Получить настройки (бота, оплаты, и т.д.).

### PATCH /admin/settings
Обновить настройки.

### GET /admin/settings/documents
Получить юридические документы.

### PATCH /admin/settings/documents
Обновить документы.

---

# 4. WEBHOOKS

## 4.1 Telegram Bot Webhook

### POST /webhooks/telegram
Обработка апдейтов от Telegram.

Обрабатывает:
- Команды: `/start`, `/help`, `/orders`
- Callback queries от inline кнопок (табло баристы)
- Pre-checkout и successful payment события

**Telegram Update Format:**
```json
{
  "update_id": 123456789,
  "message": {...},
  "callback_query": {...},
  "pre_checkout_query": {...},
  "successful_payment": {...}
}
```

---

## 4.2 Payment Webhook (Telegram Payments)

### POST /webhooks/telegram/payment
Callback при успешной оплате (часть telegram webhook).

**Processing:**
1. Валидировать `successful_payment`
2. Обновить статус заказа → `paid`
3. Отправить уведомление баристе
4. Отправить чек клиенту
5. Обновить TV-борд через WebSocket

---

# 5. WEBSOCKET API

## 5.1 TV Board (Экран на точке)

### WS /ws/tv-board/:locationSlug
Подключение TV-борда точки.

**Входящие события:**
```json
{
  "type": "subscribe",
  "location_slug": "msk-tverskaya"
}
```

**Исходящие события:**
```json
{
  "type": "orders_update",
  "data": {
    "preparing": [
      {"order_number": 42, "customer_name": "Александр"},
      {"order_number": 43, "customer_name": "Мария"}
    ],
    "ready": [
      {"order_number": 41, "customer_name": "Елена"}
    ]
  }
}
```

```json
{
  "type": "order_ready",
  "data": {
    "order_number": 42,
    "customer_name": "Александр"
  }
}
```

---

## 5.2 Barista Dashboard

### WS /ws/barista/:locationId
Подключение табло баристы.

**Исходящие события:**
```json
{
  "type": "new_order",
  "data": {
    "id": "uuid",
    "order_number": 44,
    "customer_name": "Дмитрий",
    "items": [...],
    "total_amount": 450
  }
}
```

---

# 6. ERROR CODES

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Не авторизован |
| `FORBIDDEN` | 403 | Нет прав доступа |
| `NOT_FOUND` | 404 | Ресурс не найден |
| `VALIDATION_ERROR` | 400 | Ошибка валидации |
| `LOCATION_NOT_FOUND` | 404 | Точка не найдена |
| `LOCATION_CLOSED` | 400 | Точка закрыта |
| `PRODUCT_UNAVAILABLE` | 400 | Товар недоступен |
| `INSUFFICIENT_STOCK` | 400 | Недостаточно остатков |
| `PROMO_CODE_INVALID` | 400 | Промокод недействителен |
| `PROMO_CODE_EXPIRED` | 400 | Промокод истёк |
| `PROMO_CODE_USED` | 400 | Промокод уже использован |
| `PAYMENT_FAILED` | 400 | Ошибка оплаты |
| `PAYMENT_TIMEOUT` | 408 | Таймаут оплаты |
| `INVALID_STATUS_TRANSITION` | 400 | Некорректный переход статуса |
| `PERMISSION_DENIED` | 403 | Действие запрещено для роли |
| `RATE_LIMIT_EXCEEDED` | 429 | Превышен лимит запросов |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка |

---

# 7. RATE LIMITING

| Endpoint Group | Limit |
|----------------|-------|
| Public API | 100 req/min per user |
| Barista API | 200 req/min per user |
| Admin API | 300 req/min per user |
| Webhooks | 1000 req/min |

---

# 8. VERSIONING

API версионируется через URL prefix: `/v1/`, `/v2/`

Deprecation policy:
- Анонс за 3 месяца до отключения версии
- Header `X-API-Deprecated: true` для устаревших endpoints
- Header `X-API-Sunset: 2024-06-01` с датой отключения
