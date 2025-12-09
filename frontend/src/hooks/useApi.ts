import { createResource, createSignal } from 'solid-js';
import type { 
  Location, Product, Order, Promocode, Category, 
  ModifierGroup, User, Broadcast, LocationStaff, DashboardStats 
} from '../types';

// API URL - в production используем переменную окружения или localhost для dev
const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  
  // Check content type to avoid parsing HTML as JSON
  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    console.error(`API ${path} returned non-JSON response:`, contentType);
    throw new Error(`Server returned ${contentType || 'unknown'} instead of JSON. Backend may not be running.`);
  }
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

// Dashboard
export function useDashboard() {
  const [stats, { refetch }] = createResource<DashboardStats>(() => fetchJSON('/dashboard'));
  return { stats, refetch };
}

// Locations
export function useLocations() {
  const [locations, { refetch }] = createResource<Location[]>(() => fetchJSON('/locations'));
  return { locations, refetch };
}

// Products
export function useProducts() {
  const [products, { refetch }] = createResource<Product[]>(() => fetchJSON('/products'));
  return { products, refetch };
}

// Categories
export function useCategories() {
  const [categories, { refetch }] = createResource<Category[]>(() => fetchJSON('/categories'));
  return { categories, refetch };
}

// Orders
export function useOrders() {
  const [orders, { refetch }] = createResource<Order[]>(() => fetchJSON('/orders'));
  return { orders, refetch };
}

// Promocodes
export function usePromocodes() {
  const [promocodes, { refetch }] = createResource<Promocode[]>(() => fetchJSON('/promocodes'));
  return { promocodes, refetch };
}

// Users
export function useUsers() {
  const [users, { refetch }] = createResource<User[]>(() => fetchJSON('/users'));
  return { users, refetch };
}

// Modifier Groups
export function useModifierGroups() {
  const [groups, { refetch }] = createResource<ModifierGroup[]>(() => fetchJSON('/modifier-groups'));
  return { groups, refetch };
}

// Broadcasts
export function useBroadcasts() {
  const [broadcasts, { refetch }] = createResource<Broadcast[]>(() => fetchJSON('/broadcasts'));
  return { broadcasts, refetch };
}

// Toast notification
export function useToast() {
  const [toast, setToast] = createSignal<{ type: 'ok' | 'err'; text: string } | null>(null);
  
  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };
  
  return { toast, showToast };
}

// API Actions
export const api = {
  // Locations
  createLocation: (data: Partial<Location>) => 
    fetchJSON<Location>('/locations', { method: 'POST', body: JSON.stringify(data) }),
  updateLocation: (id: string, data: Partial<Location>) => 
    fetchJSON<Location>(`/locations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLocation: (id: string) => 
    fetchJSON(`/locations/${id}`, { method: 'DELETE' }),

  // Products
  createProduct: (data: Partial<Product>) => 
    fetchJSON<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Product>) => 
    fetchJSON<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => 
    fetchJSON(`/products/${id}`, { method: 'DELETE' }),

  // Categories
  createCategory: (data: Partial<Category>) => 
    fetchJSON<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Partial<Category>) => 
    fetchJSON<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => 
    fetchJSON(`/categories/${id}`, { method: 'DELETE' }),

  // Orders
  createOrder: (data: any) => 
    fetchJSON<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string) => 
    fetchJSON<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Promocodes
  createPromocode: (data: Partial<Promocode>) => 
    fetchJSON<Promocode>('/promocodes', { method: 'POST', body: JSON.stringify(data) }),
  updatePromocode: (id: string, data: Partial<Promocode>) => 
    fetchJSON<Promocode>(`/promocodes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePromocode: (id: string) => 
    fetchJSON(`/promocodes/${id}`, { method: 'DELETE' }),

  // Users
  createUser: (data: Partial<User>) => 
    fetchJSON<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: Partial<User>) => 
    fetchJSON<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Modifier Groups
  createModifierGroup: (data: Partial<ModifierGroup>) => 
    fetchJSON<ModifierGroup>('/modifier-groups', { method: 'POST', body: JSON.stringify(data) }),
  updateModifierGroup: (id: string, data: Partial<ModifierGroup>) => 
    fetchJSON<ModifierGroup>(`/modifier-groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteModifierGroup: (id: string) => 
    fetchJSON(`/modifier-groups/${id}`, { method: 'DELETE' }),

  // Modifier Options
  createModifierOption: (groupId: string, data: any) => 
    fetchJSON(`/modifier-options`, { method: 'POST', body: JSON.stringify({ ...data, groupId }) }),
  deleteModifierOption: (id: string) => 
    fetchJSON(`/modifier-options/${id}`, { method: 'DELETE' }),

  // Broadcasts
  createBroadcast: (data: Partial<Broadcast>) => 
    fetchJSON<Broadcast>('/broadcasts', { method: 'POST', body: JSON.stringify(data) }),
  updateBroadcast: (id: string, data: Partial<Broadcast>) => 
    fetchJSON<Broadcast>(`/broadcasts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteBroadcast: (id: string) => 
    fetchJSON(`/broadcasts/${id}`, { method: 'DELETE' }),
};

