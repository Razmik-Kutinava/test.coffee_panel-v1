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
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      // NestJS возвращает ошибки в формате { message: string } или { message: object }
      if (errorData.message) {
        if (Array.isArray(errorData.message)) {
          errorMessage = errorData.message.join(', ');
        } else if (typeof errorData.message === 'object') {
          // Если message - объект (например, Prisma ошибка)
          if (errorData.message.error) {
            errorMessage = errorData.message.error;
            if (errorData.message.details) {
              errorMessage += ': ' + errorData.message.details;
            }
          } else {
            errorMessage = JSON.stringify(errorData.message);
          }
        } else {
          errorMessage = errorData.message;
        }
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // Если не удалось распарсить JSON, пробуем получить текст
      try {
        const text = await res.text();
        if (text) errorMessage = text;
      } catch (textError) {
        // Игнорируем ошибку парсинга текста
      }
    }
    throw new Error(errorMessage);
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
  uploadProductImage: async (file: File) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/591d0845-0350-4c40-8a2d-46d6cbed8569',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useApi.ts:144',message:'uploadProductImage entry',data:{fileName:file.name,fileSize:file.size,fileType:file.type,apiBase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.log('📤 Отправка POST запроса на /products/upload-image', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    const formData = new FormData();
    formData.append('image', file);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/591d0845-0350-4c40-8a2d-46d6cbed8569',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useApi.ts:152',message:'Before fetch request',data:{url:`${apiBase}/products/upload-image`,method:'POST',hasFormData:true,formDataKeys:Array.from(formData.keys())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const res = await fetch(`${apiBase}/products/upload-image`, {
      method: 'POST',
      body: formData,
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/591d0845-0350-4c40-8a2d-46d6cbed8569',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useApi.ts:156',message:'After fetch request',data:{status:res.status,statusText:res.statusText,ok:res.ok,contentType:res.headers.get('content-type')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!res.ok) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/591d0845-0350-4c40-8a2d-46d6cbed8569',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useApi.ts:157',message:'Response not OK',data:{status:res.status,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      let errorMessage = 'Ошибка загрузки изображения';
      try {
        const errorData = await res.json();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/591d0845-0350-4c40-8a2d-46d6cbed8569',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useApi.ts:160',message:'Error data parsed',data:{errorMessage:errorData.message,errorStatus:errorData.statusCode,errorData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('❌ Ошибка загрузки:', {
          status: res.status,
          statusText: res.statusText,
          errorData,
          url: `${apiBase}/products/upload-image`,
        });

        // Извлекаем сообщение об ошибке из разных форматов
        if (errorData.message) {
          if (typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          } else if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ');
          } else if (typeof errorData.message === 'object' && errorData.message.message) {
            errorMessage = errorData.message.message;
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        console.error('❌ Не удалось распарсить ошибку:', e);
        errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      }

      throw new Error(errorMessage);
    }
    const result = await res.json();
    console.log('✅ Изображение успешно загружено:', result);
    return result;
  },

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
  linkModifierToProduct: (groupId: string, productId: string, position?: number) =>
    fetchJSON(`/modifier-groups/${groupId}/link-product/${productId}`, { 
      method: 'POST', 
      body: JSON.stringify({ position: position || 0 }) 
    }),
  unlinkModifierFromProduct: (groupId: string, productId: string) =>
    fetchJSON(`/modifier-groups/${groupId}/unlink-product/${productId}`, { 
      method: 'DELETE' 
    }),

  // Modifier Options
  createModifierOption: (groupId: string, data: any) => 
    fetchJSON(`/modifier-options`, { method: 'POST', body: JSON.stringify({ ...data, groupId }) }),
  updateModifierOption: (id: string, data: any) => 
    fetchJSON(`/modifier-options/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
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

