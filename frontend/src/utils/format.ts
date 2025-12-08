// ============================================
// FORMATTING UTILITIES
// ============================================

export const currency = (v: number) =>
  new Intl.NumberFormat('ru-RU', { 
    style: 'currency', 
    currency: 'RUB', 
    maximumFractionDigits: 0 
  }).format(v || 0);

export const formatDate = (date: string | Date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | Date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date: string | Date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatNumber = (n: number) => 
  new Intl.NumberFormat('ru-RU').format(n || 0);

export const truncate = (str: string, length: number = 20) => 
  str && str.length > length ? str.slice(0, length) + '...' : str;

// Status helpers
export const orderStatusLabels: Record<string, string> = {
  pending: 'Ожидает',
  created: 'Создан',
  paid: 'Оплачен',
  accepted: 'Принят',
  in_progress: 'В работе',
  preparing: 'Готовится',
  ready: 'Готов',
  completed: 'Выдан',
  cancelled: 'Отменён',
  refunded: 'Возврат',
};

export const orderStatusIcons: Record<string, string> = {
  pending: '⏳',
  created: '📝',
  paid: '💳',
  accepted: '✅',
  in_progress: '🔄',
  preparing: '👨‍🍳',
  ready: '📦',
  completed: '🎉',
  cancelled: '❌',
  refunded: '↩️',
};

export const orderStatusColors: Record<string, string> = {
  pending: '#fbbf24',
  created: '#6b7280',
  paid: '#3b82f6',
  accepted: '#10b981',
  in_progress: '#8b5cf6',
  preparing: '#f59e0b',
  ready: '#22c55e',
  completed: '#10b981',
  cancelled: '#ef4444',
  refunded: '#6b7280',
};

export const paymentStatusLabels: Record<string, string> = {
  pending: 'Ожидает',
  processing: 'Обработка',
  succeeded: 'Оплачено',
  failed: 'Ошибка',
  refunded: 'Возврат',
  cancelled: 'Отменён',
};

export const userRoleLabels: Record<string, string> = {
  client: 'Клиент',
  barista: 'Бариста',
  manager: 'Управляющий',
  franchisee: 'Партнёр',
  staff_uk: 'Сотрудник УК',
  superadmin: 'Суперадмин',
};

export const locationStatusLabels: Record<string, string> = {
  active: 'Активна',
  inactive: 'Неактивна',
  closed: 'Закрыта',
  pending: 'Черновик',
};

export const broadcastStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  scheduled: 'Запланирована',
  sending: 'Отправляется',
  sent: 'Отправлена',
  cancelled: 'Отменена',
};

