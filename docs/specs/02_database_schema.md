# Database Schema — Цифровая кофейня v1.0

## Обзор архитектуры

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE ENTITIES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Users ←──────┬──────→ Locations ←──────→ Products                         │
│    │          │            │                  │                            │
│    │          │            │                  │                            │
│    ▼          ▼            ▼                  ▼                            │
│  Permissions  Staff    LocationProducts   ProductModifiers                 │
│                            │                  │                            │
│                            ▼                  ▼                            │
│                         Orders ←────────→ OrderItems                       │
│                            │                  │                            │
│                            ▼                  ▼                            │
│                    OrderStatusHistory   OrderItemModifiers                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. USERS (Пользователи)

Все пользователи системы: клиенты, баристы, партнёры, сотрудники УК.

```sql
CREATE TYPE user_role AS ENUM (
    'client',           -- Покупатель
    'barista',          -- Бариста (работает через TG-табло)
    'manager',          -- Управляющий точки
    'franchisee',       -- Партнёр/франчайзи (админ своей точки)
    'staff_uk',         -- Сотрудник УК (ограниченный доступ)
    'superadmin'        -- Суперадмин УК (полный доступ)
);

CREATE TYPE user_status AS ENUM (
    'active',
    'blocked',
    'deactivated'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Telegram данные (основной способ авторизации)
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username VARCHAR(255),
    telegram_first_name VARCHAR(255),
    telegram_last_name VARCHAR(255),
    telegram_photo_url TEXT,
    telegram_language_code VARCHAR(10) DEFAULT 'ru',
    
    -- Контактные данные
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Роль и статус
    role user_role NOT NULL DEFAULT 'client',
    status user_status NOT NULL DEFAULT 'active',
    
    -- Для клиентов: предпочтительная точка
    preferred_location_id UUID REFERENCES locations(id),
    
    -- Маркетинг
    accepts_marketing BOOLEAN DEFAULT true,
    last_order_at TIMESTAMPTZ,
    total_orders_count INTEGER DEFAULT 0,
    total_orders_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Метаданные (для аналитики)
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Индексы
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_order_at ON users(last_order_at);
```

### Комментарии:
- `telegram_id` — уникальный идентификатор, не требует регистрации
- `role` — базовая роль, детальные права через `permissions`
- `metadata` — гибкое поле для UTM-меток, источника, устройства
- Статистика (`total_orders_count`, `total_orders_amount`) денормализована для быстрой сегментации

---

## 2. LOCATIONS (Точки продаж)

Единица контроля бизнеса. Каждая точка = адрес = поддомен.

```sql
CREATE TYPE location_status AS ENUM (
    'active',           -- Работает
    'inactive',         -- Временно не работает
    'closed',           -- Закрыта навсегда
    'pending'           -- На модерации
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Основная информация
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,  -- для поддомена: msk-tverskaya
    description TEXT,
    
    -- Адрес и геолокация
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    
    -- Контакты точки
    phone VARCHAR(20),
    
    -- Владелец (франчайзи)
    owner_id UUID REFERENCES users(id),
    
    -- Статус и настройки
    status location_status NOT NULL DEFAULT 'pending',
    is_accepting_orders BOOLEAN DEFAULT true,
    
    -- Режим работы (по дням недели)
    working_hours JSONB NOT NULL DEFAULT '{
        "monday": {"open": "08:00", "close": "22:00", "is_working": true},
        "tuesday": {"open": "08:00", "close": "22:00", "is_working": true},
        "wednesday": {"open": "08:00", "close": "22:00", "is_working": true},
        "thursday": {"open": "08:00", "close": "22:00", "is_working": true},
        "friday": {"open": "08:00", "close": "22:00", "is_working": true},
        "saturday": {"open": "09:00", "close": "21:00", "is_working": true},
        "sunday": {"open": "10:00", "close": "20:00", "is_working": true}
    }'::jsonb,
    
    -- Настройки каталога
    use_global_catalog BOOLEAN DEFAULT true,  -- использовать глобальный каталог или локальный
    
    -- Настройки оплаты
    payment_settings JSONB DEFAULT '{
        "telegram_payments": true,
        "cash_on_pickup": false,
        "sbp": false
    }'::jsonb,
    
    -- TV-борд настройки
    tv_board_enabled BOOLEAN DEFAULT true,
    tv_board_theme JSONB DEFAULT '{
        "background_color": "#1a1a1a",
        "text_color": "#ffffff",
        "accent_color": "#00ff00"
    }'::jsonb,
    
    -- Юридические документы (можно переопределить для точки)
    legal_documents JSONB DEFAULT '{}'::jsonb,
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Метаданные
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Индексы
CREATE INDEX idx_locations_slug ON locations(slug);
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_owner_id ON locations(owner_id);
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_geo ON locations USING GIST (
    ll_to_earth(latitude, longitude)
);  -- Для поиска ближайших точек

-- Функция для вычисления расстояния
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
```

### Комментарии:
- `slug` — используется для поддомена TV-борда: `{slug}.brand.ru`
- `working_hours` — JSON для гибкости (праздники, особые дни)
- `use_global_catalog` — флаг для точек с особым меню
- `payment_settings` — модульная система оплаты для разных стран

---

## 3. CATEGORIES (Категории товаров)

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Основная информация
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    
    -- Иерархия (для подкатегорий, если нужно)
    parent_id UUID REFERENCES categories(id),
    
    -- Порядок отображения
    sort_order INTEGER DEFAULT 0,
    
    -- Статус
    is_active BOOLEAN DEFAULT true,
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
```

---

## 4. PRODUCTS (Глобальный каталог товаров)

```sql
CREATE TYPE product_status AS ENUM (
    'active',
    'inactive',
    'pending_moderation',  -- Создан партнёром, ждёт одобрения УК
    'rejected'
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Основная информация
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    
    -- Категория
    category_id UUID NOT NULL REFERENCES categories(id),
    
    -- Медиа
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,  -- Массив дополнительных изображений
    
    -- Цена (базовая, может переопределяться на точке)
    base_price DECIMAL(10, 2) NOT NULL,
    
    -- Статус
    status product_status NOT NULL DEFAULT 'active',
    
    -- Кто создал (NULL = УК, иначе партнёр)
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    -- Флаги
    is_featured BOOLEAN DEFAULT false,  -- Показывать в топе
    is_new BOOLEAN DEFAULT false,       -- Метка "Новинка"
    
    -- SEO и метаданные
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_by ON products(created_by);
```

---

## 5. PRODUCT_MODIFIERS (Модификаторы / Тех.карта)

Группы модификаторов и их опции (размер, молоко, сиропы).

```sql
CREATE TYPE modifier_type AS ENUM (
    'single',   -- Выбор одного (размер)
    'multiple'  -- Выбор нескольких (топпинги)
);

-- Группы модификаторов
CREATE TABLE modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(255) NOT NULL,           -- "Размер", "Молоко", "Сироп"
    type modifier_type NOT NULL DEFAULT 'single',
    
    is_required BOOLEAN DEFAULT false,    -- Обязательный выбор
    min_selections INTEGER DEFAULT 0,     -- Мин. количество выборов (для multiple)
    max_selections INTEGER DEFAULT 1,     -- Макс. количество выборов
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Опции модификаторов
CREATE TABLE modifier_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,           -- "S (250мл)", "Овсяное молоко"
    price_adjustment DECIMAL(10, 2) DEFAULT 0,  -- Доплата к цене
    
    is_default BOOLEAN DEFAULT false,     -- Выбран по умолчанию
    is_active BOOLEAN DEFAULT true,
    
    sort_order INTEGER DEFAULT 0,
    
    -- Для учёта на складе (v2.0)
    sku VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Связь продуктов с группами модификаторов
CREATE TABLE product_modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    
    sort_order INTEGER DEFAULT 0,
    
    UNIQUE(product_id, modifier_group_id)
);

-- Индексы
CREATE INDEX idx_modifier_options_group_id ON modifier_options(group_id);
CREATE INDEX idx_product_modifier_groups_product_id ON product_modifier_groups(product_id);
```

### Пример данных:
```sql
-- Группа "Размер"
INSERT INTO modifier_groups (name, type, is_required) 
VALUES ('Размер', 'single', true);

-- Опции размера
INSERT INTO modifier_options (group_id, name, price_adjustment, is_default) VALUES
('...', 'S (250мл)', 0, false),
('...', 'M (350мл)', 50, true),
('...', 'L (450мл)', 100, false);

-- Группа "Молоко"
INSERT INTO modifier_groups (name, type, is_required, max_selections) 
VALUES ('Молоко', 'single', false, 1);

-- Опции молока
INSERT INTO modifier_options (group_id, name, price_adjustment) VALUES
('...', 'Обычное', 0),
('...', 'Овсяное', 60),
('...', 'Кокосовое', 60),
('...', 'Без молока', 0);
```

---

## 6. LOCATION_PRODUCTS (Ассортимент точки)

Привязка товаров к точкам с возможностью переопределить цену и остатки.

```sql
CREATE TABLE location_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Цена на точке (если NULL — используется base_price продукта)
    price_override DECIMAL(10, 2),
    
    -- Остатки
    stock_quantity INTEGER DEFAULT 0,
    min_stock_threshold INTEGER DEFAULT 5,  -- Порог для предупреждения
    
    -- Доступность
    is_available BOOLEAN DEFAULT true,
    unavailable_reason VARCHAR(255),  -- "Раскупили", "Временно нет"
    
    -- Порядок в меню точки
    sort_order INTEGER DEFAULT 0,
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(location_id, product_id)
);

-- Индексы
CREATE INDEX idx_location_products_location_id ON location_products(location_id);
CREATE INDEX idx_location_products_product_id ON location_products(product_id);
CREATE INDEX idx_location_products_is_available ON location_products(is_available);
CREATE INDEX idx_location_products_stock ON location_products(stock_quantity);
```

---

## 7. LOCATION_CATEGORIES (Категории на точке)

Позволяет точке иметь свой порядок категорий или скрывать некоторые.

```sql
CREATE TABLE location_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    -- Можно переопределить название для точки
    name_override VARCHAR(255),
    
    UNIQUE(location_id, category_id)
);

CREATE INDEX idx_location_categories_location_id ON location_categories(location_id);
```

---

## 8. ORDERS (Заказы)

```sql
CREATE TYPE order_status AS ENUM (
    'created',      -- Создан, ожидает оплаты
    'paid',         -- Оплачен, ждёт принятия баристой
    'accepted',     -- Принят баристой
    'preparing',    -- Готовится
    'ready',        -- Готов к выдаче
    'completed',    -- Выдан клиенту
    'cancelled',    -- Отменён
    'refunded'      -- Возврат средств
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'succeeded',
    'failed',
    'refunded',
    'cancelled'
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Номер заказа (человекочитаемый, уникален в пределах дня и точки)
    order_number INTEGER NOT NULL,
    
    -- Связи
    user_id UUID NOT NULL REFERENCES users(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    
    -- Статус
    status order_status NOT NULL DEFAULT 'created',
    
    -- Суммы
    subtotal DECIMAL(10, 2) NOT NULL,      -- Сумма товаров
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,  -- Итого к оплате
    
    -- Промокод
    promo_code_id UUID REFERENCES promo_codes(id),
    promo_code_text VARCHAR(50),
    
    -- Данные оплаты
    payment_status payment_status DEFAULT 'pending',
    payment_provider VARCHAR(50),          -- 'telegram', 'yookassa', etc.
    payment_id VARCHAR(255),               -- ID транзакции в платёжной системе
    payment_data JSONB DEFAULT '{}'::jsonb,
    paid_at TIMESTAMPTZ,
    
    -- Данные клиента на момент заказа
    customer_name VARCHAR(255) NOT NULL,   -- Имя для TV-борда
    customer_phone VARCHAR(20),
    
    -- Комментарий к заказу
    comment TEXT,
    
    -- Временные метки статусов
    accepted_at TIMESTAMPTZ,
    preparing_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Кто обработал
    accepted_by UUID REFERENCES users(id),
    completed_by UUID REFERENCES users(id),
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Уникальный номер заказа в пределах дня и точки
    UNIQUE(location_id, order_number, DATE(created_at))
);

-- Функция генерации номера заказа
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    SELECT COALESCE(MAX(order_number), 0) + 1 INTO NEW.order_number
    FROM orders
    WHERE location_id = NEW.location_id
    AND DATE(created_at) = CURRENT_DATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- Индексы
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_location_id ON orders(location_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_payment_id ON orders(payment_id);
CREATE INDEX idx_orders_location_date ON orders(location_id, DATE(created_at));
```

---

## 9. ORDER_ITEMS (Позиции заказа)

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Данные на момент заказа (денормализация для истории)
    product_name VARCHAR(255) NOT NULL,
    product_image_url TEXT,
    
    -- Количество и цены
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,     -- Цена за единицу (с модификаторами)
    base_price DECIMAL(10, 2) NOT NULL,     -- Базовая цена товара
    modifiers_price DECIMAL(10, 2) DEFAULT 0, -- Сумма доплат за модификаторы
    total_price DECIMAL(10, 2) NOT NULL,    -- unit_price * quantity
    
    -- Комментарий к позиции
    comment TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

---

## 10. ORDER_ITEM_MODIFIERS (Модификаторы позиций)

```sql
CREATE TABLE order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    modifier_option_id UUID NOT NULL REFERENCES modifier_options(id),
    
    -- Данные на момент заказа (денормализация)
    modifier_group_name VARCHAR(255) NOT NULL,
    modifier_option_name VARCHAR(255) NOT NULL,
    price_adjustment DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_item_modifiers_order_item_id ON order_item_modifiers(order_item_id);
```

---

## 11. ORDER_STATUS_HISTORY (История статусов)

```sql
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    old_status order_status,
    new_status order_status NOT NULL,
    
    changed_by UUID REFERENCES users(id),  -- NULL = система
    change_source VARCHAR(50),             -- 'barista_bot', 'admin_hub', 'system'
    
    comment TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at);
```

---

## 12. PROMO_CODES (Промокоды)

```sql
CREATE TYPE promo_code_type AS ENUM (
    'percentage',    -- Процент скидки
    'fixed_amount',  -- Фиксированная сумма
    'free_item'      -- Бесплатный товар (v2.0)
);

CREATE TYPE promo_code_scope AS ENUM (
    'global',        -- Все точки
    'location'       -- Конкретная точка
);

CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    
    -- Тип и размер скидки
    type promo_code_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,  -- Процент или сумма
    
    -- Область применения
    scope promo_code_scope NOT NULL DEFAULT 'global',
    location_id UUID REFERENCES locations(id),  -- Для локальных промокодов
    
    -- Условия
    min_order_amount DECIMAL(10, 2),           -- Минимальная сумма заказа
    max_discount_amount DECIMAL(10, 2),        -- Максимальная скидка (для процентных)
    
    -- Лимиты
    usage_limit INTEGER,                        -- Общий лимит использований
    usage_limit_per_user INTEGER DEFAULT 1,    -- Лимит на пользователя
    current_usage_count INTEGER DEFAULT 0,
    
    -- Период действия
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Статус
    is_active BOOLEAN DEFAULT true,
    
    -- Кто создал
    created_by UUID REFERENCES users(id),
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Использования промокодов
CREATE TABLE promo_code_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    
    discount_applied DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(promo_code_id, order_id)
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_location_id ON promo_codes(location_id);
CREATE INDEX idx_promo_code_usages_user_id ON promo_code_usages(user_id);
```

---

## 13. PERMISSIONS (Гранулярная система доступов)

```sql
-- Модули системы
CREATE TYPE permission_module AS ENUM (
    'categories',
    'products',
    'orders',
    'users',
    'broadcasts',
    'promo_codes',
    'statistics',
    'staff',
    'settings',
    'locations',
    'reviews',
    'bot_manager',
    'app_design'
);

-- Действия
CREATE TYPE permission_action AS ENUM (
    'view',
    'create',
    'edit',
    'delete',
    'export',
    'manage_stock',
    'change_status',
    'send',
    'approve',
    'grant_access'
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Область действия (NULL = все точки для УК)
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    
    -- Модуль и действие
    module permission_module NOT NULL,
    action permission_action NOT NULL,
    
    -- Кто выдал доступ
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Для временных доступов
    expires_at TIMESTAMPTZ,
    
    UNIQUE(user_id, location_id, module, action)
);

CREATE INDEX idx_permissions_user_id ON permissions(user_id);
CREATE INDEX idx_permissions_location_id ON permissions(location_id);
CREATE INDEX idx_permissions_module ON permissions(module);

-- View для удобной проверки прав
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    u.telegram_id,
    u.role,
    p.location_id,
    l.name as location_name,
    p.module,
    p.action,
    p.expires_at
FROM users u
LEFT JOIN permissions p ON u.id = p.user_id
LEFT JOIN locations l ON p.location_id = l.id
WHERE u.status = 'active'
AND (p.expires_at IS NULL OR p.expires_at > NOW());
```

### Шаблоны ролей (для автозаполнения):

```sql
-- Функция создания базовых прав для роли
CREATE OR REPLACE FUNCTION create_default_permissions(
    p_user_id UUID,
    p_role user_role,
    p_location_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
    -- Суперадмин — все права, все точки
    IF p_role = 'superadmin' THEN
        INSERT INTO permissions (user_id, module, action)
        SELECT p_user_id, m, a
        FROM unnest(enum_range(NULL::permission_module)) m,
             unnest(enum_range(NULL::permission_action)) a
        ON CONFLICT DO NOTHING;
    
    -- Партнёр — права на свою точку
    ELSIF p_role = 'franchisee' AND p_location_id IS NOT NULL THEN
        INSERT INTO permissions (user_id, location_id, module, action) VALUES
        (p_user_id, p_location_id, 'categories', 'view'),
        (p_user_id, p_location_id, 'products', 'view'),
        (p_user_id, p_location_id, 'products', 'manage_stock'),
        (p_user_id, p_location_id, 'orders', 'view'),
        (p_user_id, p_location_id, 'orders', 'change_status'),
        (p_user_id, p_location_id, 'users', 'view'),
        (p_user_id, p_location_id, 'broadcasts', 'view'),
        (p_user_id, p_location_id, 'broadcasts', 'create'),
        (p_user_id, p_location_id, 'broadcasts', 'send'),
        (p_user_id, p_location_id, 'promo_codes', 'view'),
        (p_user_id, p_location_id, 'promo_codes', 'create'),
        (p_user_id, p_location_id, 'statistics', 'view'),
        (p_user_id, p_location_id, 'staff', 'view'),
        (p_user_id, p_location_id, 'staff', 'create'),
        (p_user_id, p_location_id, 'staff', 'edit'),
        (p_user_id, p_location_id, 'staff', 'grant_access')
        ON CONFLICT DO NOTHING;
    
    -- Бариста — минимальные права
    ELSIF p_role = 'barista' AND p_location_id IS NOT NULL THEN
        INSERT INTO permissions (user_id, location_id, module, action) VALUES
        (p_user_id, p_location_id, 'orders', 'view'),
        (p_user_id, p_location_id, 'orders', 'change_status'),
        (p_user_id, p_location_id, 'products', 'view'),
        (p_user_id, p_location_id, 'products', 'manage_stock')
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 14. STAFF (Привязка сотрудников к точкам)

```sql
CREATE TABLE location_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    position VARCHAR(100),  -- Должность
    
    is_active BOOLEAN DEFAULT true,
    
    hired_at TIMESTAMPTZ DEFAULT NOW(),
    fired_at TIMESTAMPTZ,
    
    -- Кто назначил
    assigned_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(location_id, user_id)
);

CREATE INDEX idx_location_staff_location_id ON location_staff(location_id);
CREATE INDEX idx_location_staff_user_id ON location_staff(user_id);
```

---

## 15. BROADCASTS (Рассылки)

```sql
CREATE TYPE broadcast_status AS ENUM (
    'draft',
    'scheduled',
    'sending',
    'sent',
    'cancelled'
);

CREATE TYPE broadcast_scope AS ENUM (
    'all',           -- Все пользователи
    'location',      -- Пользователи точки
    'segment'        -- По сегменту (v2.0)
);

CREATE TABLE broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Контент
    title VARCHAR(255),
    message TEXT NOT NULL,
    image_url TEXT,
    button_text VARCHAR(100),
    button_url TEXT,
    
    -- Область рассылки
    scope broadcast_scope NOT NULL DEFAULT 'all',
    location_id UUID REFERENCES locations(id),  -- Для локальных рассылок
    
    -- Сегментация (v2.0)
    segment_filter JSONB,  -- {"min_orders": 3, "last_order_days": 30}
    
    -- Статистика
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    
    -- Планирование
    status broadcast_status NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Кто создал
    created_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Логи отправки
CREATE TABLE broadcast_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    telegram_message_id BIGINT,
    status VARCHAR(50),  -- 'sent', 'delivered', 'read', 'failed'
    error_message TEXT,
    
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_broadcasts_status ON broadcasts(status);
CREATE INDEX idx_broadcasts_location_id ON broadcasts(location_id);
CREATE INDEX idx_broadcast_logs_broadcast_id ON broadcast_logs(broadcast_id);
```

---

## 16. STOCK_MOVEMENTS (История движения остатков) — для v2.0

```sql
CREATE TYPE stock_movement_type AS ENUM (
    'sale',           -- Продажа (списание)
    'adjustment_add', -- Ручное добавление
    'adjustment_sub', -- Ручное списание
    'delivery',       -- Поставка
    'return',         -- Возврат
    'writeoff'        -- Списание (порча)
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    location_id UUID NOT NULL REFERENCES locations(id),
    product_id UUID NOT NULL REFERENCES products(id),
    
    movement_type stock_movement_type NOT NULL,
    quantity INTEGER NOT NULL,  -- Положительное или отрицательное
    
    -- Связь с заказом (для продаж)
    order_id UUID REFERENCES orders(id),
    
    -- Кто сделал
    created_by UUID REFERENCES users(id),
    reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_location_product ON stock_movements(location_id, product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
```

---

## 17. AUDIT_LOG (Логи действий)

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID REFERENCES users(id),
    
    action VARCHAR(100) NOT NULL,        -- 'order.status_changed', 'product.created'
    entity_type VARCHAR(50) NOT NULL,    -- 'order', 'product', 'user'
    entity_id UUID NOT NULL,
    
    old_data JSONB,
    new_data JSONB,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

---

## 18. BOT_SESSIONS (Сессии Telegram бота)

```sql
CREATE TABLE bot_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES users(id),
    telegram_chat_id BIGINT NOT NULL,
    
    -- Состояние диалога
    current_state VARCHAR(100),  -- 'awaiting_location', 'in_checkout'
    state_data JSONB DEFAULT '{}'::jsonb,
    
    -- Корзина (до оформления заказа)
    cart JSONB DEFAULT '[]'::jsonb,
    selected_location_id UUID REFERENCES locations(id),
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(telegram_chat_id)
);

CREATE INDEX idx_bot_sessions_user_id ON bot_sessions(user_id);
CREATE INDEX idx_bot_sessions_telegram_chat_id ON bot_sessions(telegram_chat_id);
```

---

## 19. NOTIFICATIONS (Уведомления)

```sql
CREATE TYPE notification_type AS ENUM (
    'order_created',
    'order_accepted',
    'order_preparing',
    'order_ready',
    'order_completed',
    'order_cancelled',
    'promo_code',
    'broadcast',
    'system'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES users(id),
    
    type notification_type NOT NULL,
    title VARCHAR(255),
    message TEXT NOT NULL,
    
    -- Связанные сущности
    order_id UUID REFERENCES orders(id),
    
    -- Доставка
    telegram_message_id BIGINT,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_sent ON notifications(is_sent);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

## ER-диаграмма (упрощённая)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Users     │────<│  Permissions │>────│  Locations   │
└──────┬───────┘     └──────────────┘     └──────┬───────┘
       │                                         │
       │                                         │
       │     ┌──────────────┐     ┌──────────────┤
       │     │  Categories  │     │              │
       │     └──────┬───────┘     │              │
       │            │             │              │
       │     ┌──────▼───────┐     │     ┌────────▼───────┐
       │     │   Products   │─────┼────>│LocationProducts│
       │     └──────┬───────┘     │     └────────────────┘
       │            │             │
       │     ┌──────▼───────┐     │
       │     │ModifierGroups│     │
       │     └──────┬───────┘     │
       │            │             │
       │     ┌──────▼───────┐     │
       │     │ModifierOption│     │
       │     └──────────────┘     │
       │                          │
       │     ┌──────────────┐     │
       └────>│    Orders    │<────┘
             └──────┬───────┘
                    │
             ┌──────▼───────┐
             │  OrderItems  │
             └──────┬───────┘
                    │
             ┌──────▼───────┐
             │OrderItemMods │
             └──────────────┘
```

---

## Supabase Policies (RLS)

```sql
-- Включаем RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ... и так далее

-- Политика: Клиент видит только свои заказы
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT
    USING (user_id = auth.uid());

-- Политика: Бариста видит заказы своей точки
CREATE POLICY "Staff can view location orders" ON orders
    FOR SELECT
    USING (
        location_id IN (
            SELECT location_id FROM location_staff
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Политика: Партнёр управляет своей точкой
CREATE POLICY "Owner can manage own location" ON locations
    FOR ALL
    USING (owner_id = auth.uid());
```

---

## Миграции (версионирование)

```
migrations/
├── 001_create_users.sql
├── 002_create_locations.sql
├── 003_create_categories.sql
├── 004_create_products.sql
├── 005_create_modifiers.sql
├── 006_create_location_products.sql
├── 007_create_orders.sql
├── 008_create_permissions.sql
├── 009_create_promo_codes.sql
├── 010_create_broadcasts.sql
├── 011_create_audit_log.sql
└── 012_create_indexes.sql
```

---

## Важные связи и ограничения

| Таблица | Ключевые связи | Каскадное удаление |
|---------|---------------|-------------------|
| `orders` | user, location | Нет (история) |
| `order_items` | order, product | Да (при удалении заказа) |
| `permissions` | user, location | Да (при удалении пользователя) |
| `location_products` | location, product | Да (при удалении точки) |
| `promo_code_usages` | promo_code, user, order | Нет (история) |
| `audit_log` | - | Нет (всегда сохранять) |

---

## Дополнительные индексы для производительности

```sql
-- Составные индексы для частых запросов
CREATE INDEX idx_orders_location_status_date 
    ON orders(location_id, status, created_at DESC);

CREATE INDEX idx_location_products_available 
    ON location_products(location_id, is_available) 
    WHERE is_available = true;

-- Полнотекстовый поиск по товарам
CREATE INDEX idx_products_search 
    ON products USING gin(to_tsvector('russian', name || ' ' || COALESCE(description, '')));

-- GIN индекс для JSONB полей
CREATE INDEX idx_orders_payment_data ON orders USING gin(payment_data);
```
