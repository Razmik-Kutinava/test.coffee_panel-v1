# Frontend: SolidJS

## Overview

SolidJS - реактивный UI framework для создания высокопроизводительных веб-приложений. Использует fine-grained reactivity для оптимальной производительности.

## Quick Reference

```bash
# Создать новый проект (когда будет готово)
npm create solid@latest

# Запуск dev сервера
npm run dev

# Сборка
npm run build
```

## Особенности

### Fine-grained Reactivity

SolidJS использует сигналы для реактивности на уровне DOM, а не на уровне компонентов.

```typescript
import { createSignal } from 'solid-js';

function Counter() {
  const [count, setCount] = createSignal(0);
  
  return (
    <div>
      <button onClick={() => setCount(count() + 1)}>
        Count: {count()}
      </button>
    </div>
  );
}
```

### Производительность

- ✅ Меньший bundle size чем React
- ✅ Быстрее рендеринг
- ✅ Меньше re-renders
- ✅ Лучшая производительность на мобильных

## Компоненты

### Базовый компонент

```typescript
import { Component } from 'solid-js';

interface Props {
  name: string;
}

const Greeting: Component<Props> = (props) => {
  return <h1>Hello, {props.name}!</h1>;
};

export default Greeting;
```

### Компонент с состоянием

```typescript
import { Component, createSignal } from 'solid-js';

const Counter: Component = () => {
  const [count, setCount] = createSignal(0);
  
  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>+</button>
      <button onClick={() => setCount(count() - 1)}>-</button>
    </div>
  );
};
```

## Работа с API

### Fetch данных

```typescript
import { Component, createSignal, onMount } from 'solid-js';

interface Product {
  id: number;
  name: string;
  price: number;
}

const ProductsList: Component = () => {
  const [products, setProducts] = createSignal<Product[]>([]);
  const [loading, setLoading] = createSignal(true);
  
  onMount(async () => {
    try {
      const response = await fetch('http://localhost:3001/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  });
  
  return (
    <div>
      {loading() ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {products().map(product => (
            <li>{product.name} - ${product.price}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

## Роутинг

### Установка

```bash
npm install @solidjs/router
```

### Использование

```typescript
import { Router, Route } from '@solidjs/router';
import Home from './pages/Home';
import Products from './pages/Products';

function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
    </Router>
  );
}
```

## TypeScript

SolidJS полностью поддерживает TypeScript.

```typescript
import { Component } from 'solid-js';

interface User {
  id: number;
  name: string;
  email: string;
}

const UserCard: Component<{ user: User }> = (props) => {
  return (
    <div>
      <h2>{props.user.name}</h2>
      <p>{props.user.email}</p>
    </div>
  );
};
```

## Best Practices

### 1. Использовать сигналы для состояния

```typescript
// ✅ ПРАВИЛЬНО
const [count, setCount] = createSignal(0);

// ❌ НЕПРАВИЛЬНО
let count = 0; // Не реактивно
```

### 2. Использовать createEffect для side effects

```typescript
import { createEffect } from 'solid-js';

createEffect(() => {
  console.log('Count changed:', count());
});
```

### 3. Использовать createMemo для вычислений

```typescript
import { createMemo } from 'solid-js';

const doubleCount = createMemo(() => count() * 2);
```

## Интеграция с Backend

### API Client

```typescript
// api/client.ts
const API_URL = 'http://localhost:3001';

export async function fetchProducts() {
  const response = await fetch(`${API_URL}/products`);
  return response.json();
}

export async function createProduct(data: CreateProductDto) {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

## Deployment

### Vercel

```bash
# Установка Vercel CLI
npm i -g vercel

# Деплой
vercel
```

## Related Docs

- [Tech Stack Overview](./overview.md)
- [API Design](./api-design.md)

