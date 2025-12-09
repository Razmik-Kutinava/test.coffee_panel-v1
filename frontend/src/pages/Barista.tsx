import { createSignal, onMount, onCleanup, For, Show, createEffect } from 'solid-js';
import { io, Socket } from 'socket.io-client';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { theme } from '../styles/theme';

interface BaristaProps {
  locations: any[];
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  waitingMinutes?: number;
  items: OrderItem[];
  comment?: string;
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  modifiers: any[];
  comment?: string;
}

// API URL - автоматически определяет протокол для WebSocket (ws/wss)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const statusLabels: Record<string, string> = {
  paid: 'Оплачен',
  accepted: 'Принят',
  preparing: 'Готовится',
  ready: 'Готов',
  completed: 'Выдан',
  cancelled: 'Отменён',
};

const statusColors: Record<string, string> = {
  paid: '#3B82F6',
  accepted: '#10B981',
  preparing: '#F59E0B',
  ready: '#8B5CF6',
  completed: '#6B7280',
  cancelled: '#EF4444',
};

export default function Barista(props: BaristaProps) {
  const [orders, setOrders] = createSignal<Order[]>([]);
  const [selectedLocation, setSelectedLocation] = createSignal<string>('');
  const [stats, setStats] = createSignal<any>(null);
  const [socket, setSocket] = createSignal<Socket | null>(null);
  const [connected, setConnected] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<'orders' | 'stock' | 'stats'>('orders');
  const [stock, setStock] = createSignal<any[]>([]);

  // Fetch orders
  const fetchOrders = async () => {
    if (!selectedLocation()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/barista/orders?locationId=${selectedLocation()}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      props.showToast('error', 'Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    if (!selectedLocation()) return;
    try {
      const res = await fetch(`${API_URL}/barista/stats?locationId=${selectedLocation()}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch stock
  const fetchStock = async () => {
    if (!selectedLocation()) return;
    try {
      const res = await fetch(`${API_URL}/barista/stock?locationId=${selectedLocation()}`);
      const data = await res.json();
      setStock(data);
    } catch (err) {
      console.error('Failed to fetch stock:', err);
    }
  };

  // Change order status
  const changeStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/barista/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update status');
      }
      
      props.showToast('success', `Статус изменён на "${statusLabels[newStatus]}"`);
      // WebSocket will update the UI
    } catch (err: any) {
      console.error('Failed to update status:', err);
      props.showToast('error', err.message || 'Не удалось изменить статус');
    }
  };

  // Update stock
  const updateStock = async (id: string, adjustment: number) => {
    try {
      await fetch(`${API_URL}/barista/stock/${id}/adjust`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment }),
      });
      fetchStock();
      props.showToast('success', 'Остаток обновлён');
    } catch (err) {
      props.showToast('error', 'Не удалось обновить остаток');
    }
  };

  // Initialize WebSocket
  onMount(() => {
    console.log('Connecting to WebSocket:', API_URL);
    const ws = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    ws.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    ws.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    ws.on('new_order', (order: Order) => {
      console.log('New order received:', order);
      setOrders([order, ...orders()]);
      playNotificationSound();
      props.showToast('info', `Новый заказ #${order.orderNumber}`);
    });

    ws.on('order_status_changed', (order: Order) => {
      console.log('Order status changed:', order);
      setOrders(orders().map(o => o.id === order.id ? order : o));
    });

    ws.on('stock_update', () => {
      fetchStock();
    });

    setSocket(ws);
  });

  // Subscribe to location when selected
  createEffect(() => {
    const locationId = selectedLocation();
    const ws = socket();
    
    if (locationId && ws) {
      ws.emit('subscribe_barista', locationId);
      fetchOrders();
      fetchStats();
      fetchStock();
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    socket()?.disconnect();
  });

  // Auto-select first location
  createEffect(() => {
    if (props.locations.length > 0 && !selectedLocation()) {
      setSelectedLocation(props.locations[0].id);
    }
  });

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleF8pWYnGyo+AhYl9fHh5f4eLlZujqKutqKScko2HhYaJjZKYnaGkpqWjoJ2amJaUk5OSlJWXmZydnp6enZyamJeWlZSUlJSVlpeYmZqam5uamZiXl5aWlZWVlZWWlpeXmJiYmJeXl5aWlpaWlpaWlpeXl5eXl5eXl5eWlpaWlpaWlpaWl5eXl5eXl5eXl5eXlpaWlpaW');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  // Filter orders by status
  const activeOrders = () => orders().filter(o => ['paid', 'accepted', 'preparing', 'ready'].includes(o.status));
  const newOrders = () => orders().filter(o => o.status === 'paid');
  const inProgressOrders = () => orders().filter(o => ['accepted', 'preparing'].includes(o.status));
  const readyOrders = () => orders().filter(o => o.status === 'ready');

  return (
    <div style={{ padding: '24px', background: theme.colors.bgDark, 'min-height': '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', 'font-size': '28px', 'font-weight': '700', color: theme.colors.textPrimary }}>
            ☕ Табло баристы
          </h1>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
            <span style={{
              display: 'inline-flex',
              'align-items': 'center',
              gap: '6px',
              padding: '4px 12px',
              'border-radius': '20px',
              'font-size': '13px',
              background: connected() ? '#10B98120' : '#EF444420',
              color: connected() ? '#10B981' : '#EF4444',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                'border-radius': '50%',
                background: connected() ? '#10B981' : '#EF4444',
              }} />
              {connected() ? 'Подключено' : 'Отключено'}
            </span>
          </div>
        </div>

        {/* Location selector */}
        <div style={{ display: 'flex', gap: '12px', 'align-items': 'center' }}>
          <select
            value={selectedLocation()}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{
              padding: '10px 16px',
              'border-radius': '8px',
              border: `1px solid ${theme.colors.bgHover}`,
              background: theme.colors.bgCard,
              color: theme.colors.textPrimary,
              'font-size': '14px',
              cursor: 'pointer',
            }}
          >
            <option value="">Выберите точку</option>
            <For each={props.locations}>
              {(loc) => <option value={loc.id}>{loc.name}</option>}
            </For>
          </select>
          <Button onClick={fetchOrders}>🔄 Обновить</Button>
        </div>
      </div>

      {/* Stats summary */}
      <Show when={stats()}>
        <div style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          'margin-bottom': '24px',
        }}>
          <StatBox label="Новых" value={newOrders().length} color="#3B82F6" />
          <StatBox label="В работе" value={inProgressOrders().length} color="#F59E0B" />
          <StatBox label="Готовы" value={readyOrders().length} color="#8B5CF6" />
          <StatBox label="Выдано сегодня" value={stats()?.completedOrders || 0} color="#10B981" />
          <StatBox label="Выручка" value={`${(stats()?.revenue || 0).toLocaleString()} ₽`} color="#10B981" />
        </div>
      </Show>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', 'margin-bottom': '24px' }}>
        <TabButton active={activeTab() === 'orders'} onClick={() => setActiveTab('orders')}>
          📋 Заказы ({activeOrders().length})
        </TabButton>
        <TabButton active={activeTab() === 'stock'} onClick={() => setActiveTab('stock')}>
          📦 Остатки
        </TabButton>
        <TabButton active={activeTab() === 'stats'} onClick={() => setActiveTab('stats')}>
          📊 Статистика
        </TabButton>
      </div>

      {/* Orders Tab */}
      <Show when={activeTab() === 'orders'}>
        <Show when={loading()}>
          <div style={{ 'text-align': 'center', padding: '48px', color: theme.colors.textMuted }}>
            Загрузка...
          </div>
        </Show>

        <Show when={!loading() && activeOrders().length === 0}>
          <div style={{
            'text-align': 'center',
            padding: '64px',
            color: theme.colors.textMuted,
            background: theme.colors.bgCard,
            'border-radius': '16px',
          }}>
            <div style={{ 'font-size': '48px', 'margin-bottom': '16px' }}>☕</div>
            <p style={{ margin: 0 }}>Нет активных заказов</p>
          </div>
        </Show>

        <div style={{ display: 'grid', gap: '16px' }}>
          <For each={activeOrders()}>
            {(order) => (
              <OrderCard order={order} onStatusChange={changeStatus} />
            )}
          </For>
        </div>
      </Show>

      {/* Stock Tab */}
      <Show when={activeTab() === 'stock'}>
        <div style={{ display: 'grid', gap: '12px' }}>
          <For each={stock()}>
            {(item) => (
              <StockCard item={item} onUpdate={updateStock} />
            )}
          </For>
        </div>
      </Show>

      {/* Stats Tab */}
      <Show when={activeTab() === 'stats'}>
        <Show when={stats()}>
          <Card>
            <h3 style={{ margin: '0 0 16px', color: theme.colors.textPrimary }}>📊 Статистика за сегодня</h3>
            <div style={{ display: 'grid', 'grid-template-columns': 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <p style={{ margin: '0 0 4px', color: theme.colors.textMuted, 'font-size': '13px' }}>Всего заказов</p>
                <p style={{ margin: 0, 'font-size': '24px', 'font-weight': '700', color: theme.colors.textPrimary }}>{stats().totalOrders}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', color: theme.colors.textMuted, 'font-size': '13px' }}>Выручка</p>
                <p style={{ margin: 0, 'font-size': '24px', 'font-weight': '700', color: '#10B981' }}>{stats().revenue?.toLocaleString()} ₽</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', color: theme.colors.textMuted, 'font-size': '13px' }}>Средний чек</p>
                <p style={{ margin: 0, 'font-size': '24px', 'font-weight': '700', color: theme.colors.textPrimary }}>{stats().averageCheck} ₽</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', color: theme.colors.textMuted, 'font-size': '13px' }}>Отменено</p>
                <p style={{ margin: 0, 'font-size': '24px', 'font-weight': '700', color: '#EF4444' }}>{stats().cancelledOrders}</p>
              </div>
            </div>

            <Show when={stats().topProducts?.length > 0}>
              <h4 style={{ margin: '24px 0 12px', color: theme.colors.textPrimary }}>🏆 Топ товаров</h4>
              <For each={stats().topProducts}>
                {(product: any, index) => (
                  <div style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    padding: '8px 0',
                    'border-bottom': `1px solid ${theme.colors.bgHover}`,
                  }}>
                    <span style={{ color: theme.colors.textSecondary }}>
                      {index() + 1}. {product.name}
                    </span>
                    <span style={{ color: theme.colors.textPrimary, 'font-weight': '600' }}>
                      {product.count} шт
                    </span>
                  </div>
                )}
              </For>
            </Show>
          </Card>
        </Show>
      </Show>
    </div>
  );
}

// Order Card Component
function OrderCard(props: { order: Order; onStatusChange: (id: string, status: string) => void }) {
  const { order } = props;

  const nextStatuses: Record<string, string[]> = {
    paid: ['accepted', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['completed'],
  };

  const statusButtons: Record<string, { label: string; color: string }> = {
    accepted: { label: '✅ Принять', color: '#10B981' },
    preparing: { label: '☕ Готовится', color: '#F59E0B' },
    ready: { label: '✅ Готово', color: '#8B5CF6' },
    completed: { label: '📦 Выдано', color: '#6B7280' },
    cancelled: { label: '❌ Отмена', color: '#EF4444' },
  };

  return (
    <Card>
      <div style={{ display: 'flex', 'justify-content': 'space-between', gap: '24px' }}>
        {/* Left side - Order info */}
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', gap: '12px', 'align-items': 'center', 'margin-bottom': '12px' }}>
            <h3 style={{ margin: 0, 'font-size': '22px', 'font-weight': '700', color: theme.colors.textPrimary }}>
              #{order.orderNumber || '—'}
            </h3>
            <Badge variant={order.status === 'paid' ? 'warning' : order.status === 'ready' ? 'success' : 'info'}>
              {statusLabels[order.status]}
            </Badge>
            <Show when={order.waitingMinutes !== undefined && order.waitingMinutes > 0}>
              <span style={{
                'font-size': '13px',
                color: order.waitingMinutes! > 10 ? '#EF4444' : theme.colors.textMuted,
              }}>
                ⏱ {order.waitingMinutes} мин
              </span>
            </Show>
          </div>

          {/* Customer */}
          <p style={{ margin: '0 0 16px', color: theme.colors.textSecondary, 'font-size': '15px' }}>
            👤 {order.customerName || 'Гость'}
          </p>

          {/* Items */}
          <div style={{ 'margin-bottom': '12px' }}>
            <For each={order.items}>
              {(item) => (
                <div style={{ 'margin-bottom': '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', color: theme.colors.textPrimary }}>
                    <span style={{ 'font-weight': '500' }}>{item.productName}</span>
                    <span style={{ color: theme.colors.textMuted }}>× {item.quantity}</span>
                  </div>
                  <Show when={item.modifiers?.length > 0}>
                    <div style={{ 'padding-left': '16px', 'font-size': '13px', color: theme.colors.textMuted }}>
                      <For each={item.modifiers}>
                        {(mod: any) => <div>• {mod.modifierOptionName || mod.name}</div>}
                      </For>
                    </div>
                  </Show>
                  <Show when={item.comment}>
                    <div style={{ 'padding-left': '16px', 'font-size': '13px', color: '#F59E0B' }}>
                      💬 {item.comment}
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>

          {/* Order comment */}
          <Show when={order.comment}>
            <div style={{
              padding: '8px 12px',
              background: '#F59E0B20',
              'border-radius': '8px',
              'font-size': '13px',
              color: '#F59E0B',
            }}>
              💬 {order.comment}
            </div>
          </Show>

          {/* Footer */}
          <div style={{ display: 'flex', gap: '16px', 'margin-top': '12px', 'font-size': '14px', color: theme.colors.textMuted }}>
            <span>💰 {Number(order.totalAmount).toLocaleString()} ₽</span>
            <span>🕐 {new Date(order.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px', 'min-width': '140px' }}>
          <For each={nextStatuses[order.status] || []}>
            {(status) => {
              const btn = statusButtons[status];
              return (
                <button
                  onClick={() => props.onStatusChange(order.id, status)}
                  style={{
                    padding: '12px 16px',
                    'border-radius': '10px',
                    border: 'none',
                    background: status === 'cancelled' ? '#EF444420' : `${btn.color}20`,
                    color: btn.color,
                    'font-size': '14px',
                    'font-weight': '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {btn.label}
                </button>
              );
            }}
          </For>
        </div>
      </div>
    </Card>
  );
}

// Stock Card Component
function StockCard(props: { item: any; onUpdate: (id: string, adjustment: number) => void }) {
  const { item } = props;

  const stockStatusColors: Record<string, string> = {
    normal: '#10B981',
    low: '#F59E0B',
    out_of_stock: '#EF4444',
  };

  return (
    <div style={{
      display: 'flex',
      'justify-content': 'space-between',
      'align-items': 'center',
      padding: '16px',
      background: theme.colors.bgCard,
      'border-radius': '12px',
      border: `1px solid ${theme.colors.bgHover}`,
    }}>
      <div>
        <div style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}>
          <span style={{ color: theme.colors.textPrimary, 'font-weight': '500' }}>{item.productName}</span>
          <Show when={item.stockStatus !== 'normal'}>
            <span style={{
              padding: '2px 8px',
              'border-radius': '4px',
              'font-size': '11px',
              background: `${stockStatusColors[item.stockStatus]}20`,
              color: stockStatusColors[item.stockStatus],
            }}>
              {item.stockStatus === 'low' ? 'Мало' : 'Закончилось'}
            </span>
          </Show>
        </div>
        <span style={{ 'font-size': '13px', color: theme.colors.textMuted }}>{item.categoryName}</span>
      </div>

      <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
        <button
          onClick={() => props.onUpdate(item.id, -1)}
          style={{
            width: '36px',
            height: '36px',
            'border-radius': '8px',
            border: 'none',
            background: theme.colors.bgHover,
            color: theme.colors.textPrimary,
            'font-size': '18px',
            cursor: 'pointer',
          }}
        >
          −
        </button>
        <span style={{
          'min-width': '40px',
          'text-align': 'center',
          'font-size': '18px',
          'font-weight': '600',
          color: stockStatusColors[item.stockStatus],
        }}>
          {item.stockQuantity}
        </span>
        <button
          onClick={() => props.onUpdate(item.id, 1)}
          style={{
            width: '36px',
            height: '36px',
            'border-radius': '8px',
            border: 'none',
            background: theme.colors.bgHover,
            color: theme.colors.textPrimary,
            'font-size': '18px',
            cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// Stat Box Component
function StatBox(props: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      padding: '16px',
      background: theme.colors.bgCard,
      'border-radius': '12px',
      border: `1px solid ${theme.colors.bgHover}`,
    }}>
      <p style={{ margin: '0 0 4px', 'font-size': '12px', color: theme.colors.textMuted }}>{props.label}</p>
      <p style={{ margin: 0, 'font-size': '20px', 'font-weight': '700', color: props.color }}>{props.value}</p>
    </div>
  );
}

// Tab Button Component
function TabButton(props: { active: boolean; onClick: () => void; children: any }) {
  return (
    <button
      onClick={props.onClick}
      style={{
        padding: '10px 20px',
        'border-radius': '10px',
        border: 'none',
        background: props.active ? theme.colors.accent : theme.colors.bgCard,
        color: props.active ? '#000' : theme.colors.textSecondary,
        'font-size': '14px',
        'font-weight': '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {props.children}
    </button>
  );
}

