# Frontend Developer

## Роль

Разработка пользовательского интерфейса на SolidJS, интеграция с backend API.

## Ответственность

- Разработка UI компонентов
- Интеграция с API
- Работа с состоянием
- Оптимизация производительности

## Quick Reference

```bash
# Создать проект (когда будет готово)
npm create solid@latest

# Запуск dev сервера
npm run dev
```

## Работа с API

### Fetch данных

```typescript
import { createSignal, onMount } from 'solid-js';

const [products, setProducts] = createSignal([]);
const [loading, setLoading] = createSignal(true);

onMount(async () => {
  const response = await fetch('http://localhost:3001/products');
  const data = await response.json();
  setProducts(data);
  setLoading(false);
});
```

### Создание ресурса

```typescript
async function createProduct(data: CreateProductDto) {
  const response = await fetch('http://localhost:3001/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

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
```

### Компонент со состоянием

```typescript
import { Component, createSignal } from 'solid-js';

const Counter: Component = () => {
  const [count, setCount] = createSignal(0);
  
  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>+</button>
    </div>
  );
};
```

## Best Practices

### 1. Использовать сигналы

```typescript
// ✅ ПРАВИЛЬНО
const [count, setCount] = createSignal(0);

// ❌ НЕПРАВИЛЬНО
let count = 0; // Не реактивно
```

### 2. Обрабатывать ошибки

```typescript
try {
  const data = await fetchProducts();
  setProducts(data);
} catch (error) {
  console.error('Error:', error);
  setError('Failed to load products');
}
```

### 3. Оптимизировать re-renders

```typescript
// Использовать createMemo для вычислений
const total = createMemo(() => 
  products().reduce((sum, p) => sum + p.price, 0)
);
```

## Related Docs

- [Frontend SolidJS](../tech-stack/frontend-solidjs.md)
- [API Design](../tech-stack/api-design.md)

