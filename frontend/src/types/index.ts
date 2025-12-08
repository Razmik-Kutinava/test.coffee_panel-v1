// ============================================
// TYPES - Все типы данных согласно Prisma схеме
// ============================================

export type UserRole = 'client' | 'barista' | 'manager' | 'franchisee' | 'staff_uk' | 'superadmin';
export type UserStatus = 'active' | 'blocked' | 'deactivated';
export type LocationStatus = 'active' | 'inactive' | 'closed' | 'pending';
export type ProductStatus = 'active' | 'inactive' | 'pending_moderation' | 'rejected';
export type ModifierType = 'single' | 'multiple';
export type OrderStatus = 'pending' | 'created' | 'paid' | 'accepted' | 'in_progress' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
export type PromocodeScope = 'global' | 'location';
export type PromocodeType = 'percent' | 'fixed';
export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
export type BroadcastScope = 'all' | 'location' | 'segment';

export interface User {
  id: string;
  telegramId?: bigint;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  phone?: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  totalOrdersCount: number;
  totalOrdersAmount: number;
  lastSeenAt?: string;
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  status: LocationStatus;
  isAcceptingOrders: boolean;
  workingHours?: any;
  tvBoardEnabled: boolean;
  createdAt: string;
  _count?: { orders?: number; staff?: number };
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  _count?: { products?: number };
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  category?: Category;
  imageUrl?: string;
  price: number;
  status: ProductStatus;
  isFeatured: boolean;
  isNew: boolean;
  createdAt: string;
}

export interface ModifierGroup {
  id: string;
  name: string;
  type: ModifierType;
  required: boolean;
  minSelect?: number;
  maxSelect?: number;
  sortOrder: number;
  options?: ModifierOption[];
  createdAt: string;
}

export interface ModifierOption {
  id: string;
  groupId: string;
  name: string;
  price: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface Order {
  id: string;
  orderNumber?: number;
  userId?: string;
  user?: User;
  locationId: string;
  location?: Location;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  promocodeText?: string;
  paymentStatus: PaymentStatus;
  customerName?: string;
  customerPhone?: string;
  comment?: string;
  createdAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Promocode {
  id: string;
  code: string;
  description?: string;
  type: PromocodeType;
  value: number;
  scope: PromocodeScope;
  locationId?: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Broadcast {
  id: string;
  title?: string;
  message: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  scope: BroadcastScope;
  locationId?: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  status: BroadcastStatus;
  scheduledAt?: string;
  createdAt: string;
}

export interface LocationStaff {
  id: string;
  locationId: string;
  location?: Location;
  userId: string;
  user?: User;
  position?: string;
  isActive: boolean;
  hiredAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageCheck: number;
  newUsers: number;
  activeOrders: { paid: number; accepted: number; preparing: number; ready: number };
  topProducts: Array<{ name: string; count: number }>;
  revenueByLocation: Array<{ name: string; revenue: number; orders: number }>;
}

export type Tab = 'dashboard' | 'catalog' | 'locations' | 'orders' | 'users' | 'marketing' | 'staff' | 'settings';
export type CatalogTab = 'categories' | 'products' | 'modifiers';
export type MarketingTab = 'promocodes' | 'broadcasts';

