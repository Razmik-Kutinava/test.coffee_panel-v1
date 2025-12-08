import { createSignal, For, Show, createMemo } from 'solid-js';
import { theme } from '../styles/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import { Select } from '../components/Input';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { api } from '../hooks/useApi';
import { currency, formatDateTime, orderStatusLabels, orderStatusColors, orderStatusIcons, paymentStatusLabels } from '../utils/format';
import type { Order, Location, OrderStatus } from '../types';

interface OrdersProps {
  orders: Order[];
  locations: Location[];
  onRefresh: () => void;
  showToast: (type: 'ok' | 'err', text: string) => void;
}

export default function Orders(props: OrdersProps) {
  const [filterStatus, setFilterStatus] = createSignal('');
  const [filterLocation, setFilterLocation] = createSignal('');
  const [selectedOrder, setSelectedOrder] = createSignal<Order | null>(null);

  const filteredOrders = createMemo(() => {
    let orders = props.orders || [];
    if (filterStatus()) {
      orders = orders.filter((o) => o.status === filterStatus());
    }
    if (filterLocation()) {
      orders = orders.filter((o) => o.locationId === filterLocation());
    }
    return orders;
  });

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      props.showToast('ok', `✅ Статус обновлён`);
      props.onRefresh();
      setSelectedOrder(null);
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const statusOptions: OrderStatus[] = ['paid', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📋 Заказы</h1>
          <p style={styles.subtitle}>{filteredOrders().length} заказов</p>
        </div>
        <div style={styles.filters}>
          <Select
            value={filterStatus()}
            onChange={setFilterStatus}
            placeholder="Все статусы"
            options={[
              { value: '', label: 'Все статусы' },
              { value: 'paid', label: '💳 Оплачены' },
              { value: 'accepted', label: '✅ Приняты' },
              { value: 'preparing', label: '👨‍🍳 Готовятся' },
              { value: 'ready', label: '📦 Готовы' },
              { value: 'completed', label: '🎉 Выданы' },
              { value: 'cancelled', label: '❌ Отменены' },
            ]}
          />
          <Select
            value={filterLocation()}
            onChange={setFilterLocation}
            placeholder="Все точки"
            options={[
              { value: '', label: 'Все точки' },
              ...(props.locations || []).map((l) => ({ value: l.id, label: l.name })),
            ]}
          />
        </div>
      </div>

      {/* Active Orders Stats */}
      <div style={styles.activeStats}>
        <div style={styles.activeStat}>
          <span style={{ ...styles.activeIcon, background: `${orderStatusColors.paid}20`, color: orderStatusColors.paid }}>
            💳
          </span>
          <span style={styles.activeCount}>
            {props.orders?.filter((o) => o.status === 'paid').length || 0}
          </span>
          <span style={styles.activeLabel}>Оплачены</span>
        </div>
        <div style={styles.activeStat}>
          <span style={{ ...styles.activeIcon, background: `${orderStatusColors.accepted}20`, color: orderStatusColors.accepted }}>
            ✅
          </span>
          <span style={styles.activeCount}>
            {props.orders?.filter((o) => o.status === 'accepted').length || 0}
          </span>
          <span style={styles.activeLabel}>Приняты</span>
        </div>
        <div style={styles.activeStat}>
          <span style={{ ...styles.activeIcon, background: `${orderStatusColors.preparing}20`, color: orderStatusColors.preparing }}>
            👨‍🍳
          </span>
          <span style={styles.activeCount}>
            {props.orders?.filter((o) => o.status === 'preparing' || o.status === 'in_progress').length || 0}
          </span>
          <span style={styles.activeLabel}>Готовятся</span>
        </div>
        <div style={styles.activeStat}>
          <span style={{ ...styles.activeIcon, background: `${orderStatusColors.ready}20`, color: orderStatusColors.ready }}>
            📦
          </span>
          <span style={styles.activeCount}>
            {props.orders?.filter((o) => o.status === 'ready').length || 0}
          </span>
          <span style={styles.activeLabel}>Готовы</span>
        </div>
      </div>

      {/* Orders Table */}
      <Card noPadding>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>№</th>
                <th style={styles.th}>Точка</th>
                <th style={styles.th}>Клиент</th>
                <th style={styles.th}>Сумма</th>
                <th style={styles.th}>Статус</th>
                <th style={styles.th}>Оплата</th>
                <th style={styles.th}>Дата</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              <For each={filteredOrders()}>
                {(order) => (
                  <tr style={styles.tr} onClick={() => setSelectedOrder(order)}>
                    <td style={styles.td}>
                      <code style={styles.orderCode}>#{order.orderNumber || order.id.slice(0, 6)}</code>
                    </td>
                    <td style={styles.td}>{order.location?.name || '—'}</td>
                    <td style={styles.td}>
                      <div style={styles.customer}>
                        <span style={styles.customerName}>{order.customerName || order.user?.telegramUsername || '—'}</span>
                        {order.customerPhone && (
                          <span style={styles.customerPhone}>{order.customerPhone}</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <strong style={styles.amount}>{currency(Number(order.totalAmount))}</strong>
                      {order.discountAmount > 0 && (
                        <span style={styles.discount}>-{currency(Number(order.discountAmount))}</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: `${orderStatusColors[order.status]}15`,
                        color: orderStatusColors[order.status],
                      }}>
                        {orderStatusIcons[order.status]} {orderStatusLabels[order.status]}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <Badge variant={order.paymentStatus === 'succeeded' ? 'success' : 'default'} size="sm">
                        {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                      </Badge>
                    </td>
                    <td style={styles.td}>{formatDateTime(order.createdAt)}</td>
                    <td style={styles.td}>
                      <button style={styles.viewBtn}>👁️</button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
          <Show when={filteredOrders().length === 0}>
            <div style={styles.empty}>Нет заказов</div>
          </Show>
        </div>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder()}
        onClose={() => setSelectedOrder(null)}
        title={`Заказ #${selectedOrder()?.orderNumber || selectedOrder()?.id.slice(0, 6)}`}
        size="lg"
      >
        <Show when={selectedOrder()}>
          <div style={styles.orderDetail}>
            <div style={styles.detailSection}>
              <h4 style={styles.sectionTitle}>Информация</h4>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Статус</span>
                  <span style={{
                    ...styles.statusBadge,
                    background: `${orderStatusColors[selectedOrder()!.status]}15`,
                    color: orderStatusColors[selectedOrder()!.status],
                  }}>
                    {orderStatusIcons[selectedOrder()!.status]} {orderStatusLabels[selectedOrder()!.status]}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Точка</span>
                  <span>{selectedOrder()?.location?.name || '—'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Клиент</span>
                  <span>{selectedOrder()?.customerName || '—'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Телефон</span>
                  <span>{selectedOrder()?.customerPhone || '—'}</span>
                </div>
              </div>
            </div>

            <div style={styles.detailSection}>
              <h4 style={styles.sectionTitle}>Позиции заказа</h4>
              <div style={styles.items}>
                <For each={selectedOrder()?.items || []}>
                  {(item) => (
                    <div style={styles.itemRow}>
                      <span style={styles.itemName}>{item.productName}</span>
                      <span style={styles.itemQty}>× {item.quantity}</span>
                      <span style={styles.itemPrice}>{currency(Number(item.totalPrice))}</span>
                    </div>
                  )}
                </For>
                <Show when={!selectedOrder()?.items?.length}>
                  <p style={styles.noItems}>Позиции не загружены</p>
                </Show>
              </div>
            </div>

            <div style={styles.detailSection}>
              <h4 style={styles.sectionTitle}>Итого</h4>
              <div style={styles.totals}>
                <div style={styles.totalRow}>
                  <span>Подытог</span>
                  <span>{currency(Number(selectedOrder()?.subtotal || 0))}</span>
                </div>
                {selectedOrder()?.discountAmount > 0 && (
                  <div style={styles.totalRow}>
                    <span>Скидка {selectedOrder()?.promocodeText && `(${selectedOrder()?.promocodeText})`}</span>
                    <span style={{ color: theme.colors.success }}>-{currency(Number(selectedOrder()?.discountAmount))}</span>
                  </div>
                )}
                <div style={{ ...styles.totalRow, ...styles.totalFinal }}>
                  <span>Итого</span>
                  <span>{currency(Number(selectedOrder()?.totalAmount || 0))}</span>
                </div>
              </div>
            </div>

            <div style={styles.detailSection}>
              <h4 style={styles.sectionTitle}>Изменить статус</h4>
              <div style={styles.statusButtons}>
                <For each={statusOptions}>
                  {(status) => (
                    <button
                      style={{
                        ...styles.statusBtn,
                        background: selectedOrder()?.status === status ? `${orderStatusColors[status]}30` : theme.colors.bgInput,
                        color: orderStatusColors[status],
                        border: selectedOrder()?.status === status ? `2px solid ${orderStatusColors[status]}` : '2px solid transparent',
                      }}
                      onClick={() => updateStatus(selectedOrder()!.id, status)}
                      disabled={selectedOrder()?.status === status}
                    >
                      {orderStatusIcons[status]} {orderStatusLabels[status]}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        </Show>
      </Modal>
    </div>
  );
}

const styles: Record<string, any> = {
  page: {
    padding: '32px',
    display: 'flex',
    'flex-direction': 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'center',
    'flex-wrap': 'wrap',
    gap: '16px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: theme.colors.textSecondary,
  },
  filters: {
    display: 'flex',
    gap: '12px',
  },
  activeStats: {
    display: 'flex',
    gap: '20px',
    'flex-wrap': 'wrap',
  },
  activeStat: {
    display: 'flex',
    'align-items': 'center',
    gap: '12px',
    padding: '12px 20px',
    background: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.bgHover}`,
  },
  activeIcon: {
    width: '40px',
    height: '40px',
    borderRadius: theme.radius.md,
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    fontSize: '18px',
  },
  activeCount: {
    fontSize: '24px',
    fontWeight: 700,
    color: theme.colors.textPrimary,
  },
  activeLabel: {
    fontSize: '13px',
    color: theme.colors.textMuted,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: `1px solid ${theme.colors.bgHover}`,
    background: theme.colors.bgInput,
  },
  tr: {
    borderBottom: `1px solid ${theme.colors.bgHover}`,
    cursor: 'pointer',
    transition: theme.transition.fast,
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: theme.colors.textPrimary,
  },
  orderCode: {
    background: theme.colors.bgInput,
    padding: '4px 10px',
    borderRadius: theme.radius.sm,
    fontSize: '13px',
    fontFamily: theme.fonts.mono,
    color: theme.colors.primary,
  },
  customer: {
    display: 'flex',
    'flex-direction': 'column',
    gap: '2px',
  },
  customerName: {
    fontWeight: 500,
  },
  customerPhone: {
    fontSize: '12px',
    color: theme.colors.textMuted,
  },
  amount: {
    color: theme.colors.success,
    fontSize: '15px',
  },
  discount: {
    fontSize: '12px',
    color: theme.colors.textMuted,
    marginLeft: '6px',
  },
  statusBadge: {
    display: 'inline-flex',
    'align-items': 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: theme.radius.md,
    fontSize: '12px',
    fontWeight: 600,
  },
  viewBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    opacity: 0.6,
    transition: theme.transition.fast,
  },
  empty: {
    padding: '60px',
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: '14px',
  },
  orderDetail: {
    display: 'flex',
    'flex-direction': 'column',
    gap: '24px',
  },
  detailSection: {
    paddingBottom: '20px',
    borderBottom: `1px solid ${theme.colors.bgHover}`,
  },
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  detailGrid: {
    display: 'grid',
    'grid-template-columns': 'repeat(2, 1fr)',
    gap: '16px',
  },
  detailItem: {
    display: 'flex',
    'flex-direction': 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '12px',
    color: theme.colors.textMuted,
  },
  items: {
    display: 'flex',
    'flex-direction': 'column',
    gap: '12px',
  },
  itemRow: {
    display: 'flex',
    'align-items': 'center',
    gap: '12px',
    padding: '12px',
    background: theme.colors.bgInput,
    borderRadius: theme.radius.md,
  },
  itemName: {
    flex: 1,
    fontWeight: 500,
  },
  itemQty: {
    color: theme.colors.textMuted,
    fontSize: '13px',
  },
  itemPrice: {
    fontWeight: 600,
    color: theme.colors.success,
  },
  noItems: {
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  totals: {
    display: 'flex',
    'flex-direction': 'column',
    gap: '8px',
  },
  totalRow: {
    display: 'flex',
    'justify-content': 'space-between',
    fontSize: '14px',
    color: theme.colors.textSecondary,
  },
  totalFinal: {
    paddingTop: '12px',
    marginTop: '8px',
    borderTop: `1px solid ${theme.colors.bgHover}`,
    fontSize: '18px',
    fontWeight: 700,
    color: theme.colors.textPrimary,
  },
  statusButtons: {
    display: 'flex',
    'flex-wrap': 'wrap',
    gap: '10px',
  },
  statusBtn: {
    padding: '10px 16px',
    borderRadius: theme.radius.md,
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: theme.transition.fast,
    display: 'flex',
    'align-items': 'center',
    gap: '6px',
  },
};


