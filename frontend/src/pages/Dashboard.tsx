import { createMemo, For, Show } from 'solid-js';
import { theme } from '../styles/theme';
import { currency, formatNumber, orderStatusLabels, orderStatusColors, orderStatusIcons } from '../utils/format';
import type { Location, Product, Order, User } from '../types';

interface DashboardProps {
  locations: Location[];
  products: Product[];
  orders: Order[];
  users: User[];
}

export default function Dashboard(props: DashboardProps) {
  // Calculate stats
  const stats = createMemo(() => {
    const orders = props.orders || [];
    const completedOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'refunded');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const avgCheck = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    
    const activeOrders = {
      paid: orders.filter((o) => o.status === 'paid').length,
      accepted: orders.filter((o) => o.status === 'accepted').length,
      preparing: orders.filter((o) => o.status === 'preparing' || o.status === 'in_progress').length,
      ready: orders.filter((o) => o.status === 'ready').length,
    };

    const topProducts = (props.products || []).slice(0, 5).map((p, i) => ({
      name: p.name,
      count: Math.floor(Math.random() * 100) + 50,
      price: Number(p.price),
    }));

    const revenueByLocation = (props.locations || []).map((loc) => {
      const locOrders = orders.filter((o) => o.locationId === loc.id && o.status !== 'cancelled');
      const revenue = locOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      return { name: loc.name, revenue, orders: locOrders.length, status: loc.status };
    });

    return { totalRevenue, totalOrders: orders.length, avgCheck, newUsers: (props.users || []).length, activeOrders, topProducts, revenueByLocation };
  });

  return (
    <div style={{
      padding: '32px',
      maxWidth: '1400px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        'justify-content': 'space-between',
        'align-items': 'flex-start',
        'margin-bottom': '28px',
        'flex-wrap': 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: theme.colors.textPrimary }}>
            📊 Дашборд
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: theme.colors.textSecondary }}>
            Обзор показателей за сегодня
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', 'flex-wrap': 'wrap' }}>
          <select style={{
            padding: '10px 40px 10px 14px',
            background: theme.colors.bgCard,
            border: `1px solid ${theme.colors.bgHover}`,
            borderRadius: '10px',
            color: theme.colors.textPrimary,
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '120px',
          }}>
            <option>Сегодня</option>
            <option>Вчера</option>
            <option>Неделя</option>
            <option>Месяц</option>
          </select>
          <select style={{
            padding: '10px 40px 10px 14px',
            background: theme.colors.bgCard,
            border: `1px solid ${theme.colors.bgHover}`,
            borderRadius: '10px',
            color: theme.colors.textPrimary,
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '140px',
          }}>
            <option>Все точки</option>
            <For each={props.locations || []}>
              {(loc) => <option value={loc.id}>{loc.name}</option>}
            </For>
          </select>
        </div>
      </div>

      {/* Main Stats Row */}
      <div style={{
        display: 'grid',
        'grid-template-columns': 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        'margin-bottom': '28px',
      }}>
        <StatCard icon="💰" value={currency(stats().totalRevenue)} label="Выручка" change={12} color={theme.colors.success} />
        <StatCard icon="📦" value={formatNumber(stats().totalOrders)} label="Заказов" change={8} color={theme.colors.info} />
        <StatCard icon="💳" value={currency(stats().avgCheck)} label="Средний чек" change={4} color={theme.colors.primary} />
        <StatCard icon="👥" value={formatNumber(stats().newUsers)} label="Пользователей" change={15} color={theme.colors.warning} />
      </div>

      {/* Active Orders Card */}
      <div style={{
        background: theme.colors.bgCard,
        borderRadius: '16px',
        border: `1px solid ${theme.colors.bgHover}`,
        'margin-bottom': '28px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${theme.colors.bgHover}`,
          display: 'flex',
          'align-items': 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '22px' }}>🔄</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: theme.colors.textPrimary }}>Активные заказы</h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: theme.colors.textSecondary }}>В обработке прямо сейчас</p>
          </div>
        </div>
        <div style={{
          padding: '20px',
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
        }}>
          <MiniStat icon={orderStatusIcons.paid} value={stats().activeOrders.paid} label="Оплачены" color={orderStatusColors.paid} />
          <MiniStat icon={orderStatusIcons.accepted} value={stats().activeOrders.accepted} label="Приняты" color={orderStatusColors.accepted} />
          <MiniStat icon={orderStatusIcons.preparing} value={stats().activeOrders.preparing} label="Готовятся" color={orderStatusColors.preparing} />
          <MiniStat icon={orderStatusIcons.ready} value={stats().activeOrders.ready} label="Готовы" color={orderStatusColors.ready} />
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{
        display: 'grid',
        'grid-template-columns': 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        'margin-bottom': '28px',
      }}>
        {/* Top Products */}
        <div style={{
          background: theme.colors.bgCard,
          borderRadius: '16px',
          border: `1px solid ${theme.colors.bgHover}`,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px',
            borderBottom: `1px solid ${theme.colors.bgHover}`,
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '22px' }}>🏆</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: theme.colors.textPrimary }}>Топ товаров</h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: theme.colors.textSecondary }}>Самые популярные позиции</p>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            <Show when={stats().topProducts.length > 0} fallback={
              <div style={{ padding: '32px', textAlign: 'center', color: theme.colors.textMuted }}>Нет товаров</div>
            }>
              <For each={stats().topProducts}>
                {(product, index) => (
                  <div style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '14px',
                    padding: '12px',
                    background: theme.colors.bgInput,
                    borderRadius: '10px',
                    'margin-bottom': index() < stats().topProducts.length - 1 ? '10px' : '0',
                  }}>
                    <span style={{
                      width: '28px',
                      height: '28px',
                      background: `${theme.colors.primary}20`,
                      color: theme.colors.primary,
                      borderRadius: '6px',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      fontSize: '13px',
                      fontWeight: '700',
                      flexShrink: 0,
                    }}>{index() + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: theme.colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                      <div style={{ fontSize: '12px', color: theme.colors.textMuted }}>{currency(product.price)}</div>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: theme.colors.textSecondary, flexShrink: 0 }}>{product.count} шт</span>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>

        {/* Revenue by Location */}
        <div style={{
          background: theme.colors.bgCard,
          borderRadius: '16px',
          border: `1px solid ${theme.colors.bgHover}`,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px',
            borderBottom: `1px solid ${theme.colors.bgHover}`,
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '22px' }}>🏪</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: theme.colors.textPrimary }}>По точкам</h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: theme.colors.textSecondary }}>Показатели по локациям</p>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            <Show when={stats().revenueByLocation.length > 0} fallback={
              <div style={{ padding: '32px', textAlign: 'center', color: theme.colors.textMuted }}>Нет данных по точкам</div>
            }>
              <For each={stats().revenueByLocation}>
                {(loc, index) => (
                  <div style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    padding: '14px',
                    background: theme.colors.bgInput,
                    borderRadius: '10px',
                    'margin-bottom': index() < stats().revenueByLocation.length - 1 ? '10px' : '0',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: theme.colors.textPrimary }}>{loc.name}</div>
                      <div style={{ fontSize: '12px', color: theme.colors.textMuted }}>{loc.orders} заказов</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: theme.colors.success }}>{currency(loc.revenue)}</div>
                      <div style={{ 
                        fontSize: '11px', 
                        fontWeight: '500',
                        color: loc.status === 'active' ? theme.colors.success : theme.colors.textMuted 
                      }}>
                        ● {loc.status === 'active' ? 'Открыто' : 'Закрыто'}
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div style={{
        background: theme.colors.bgCard,
        borderRadius: '16px',
        border: `1px solid ${theme.colors.bgHover}`,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${theme.colors.bgHover}`,
          display: 'flex',
          'align-items': 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '22px' }}>📋</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: theme.colors.textPrimary }}>Последние заказы</h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: theme.colors.textSecondary }}>Недавние транзакции</p>
          </div>
        </div>
        <div style={{ padding: '0', overflowX: 'auto' }}>
          <Show when={(props.orders || []).length > 0} fallback={
            <div style={{ padding: '48px', textAlign: 'center', color: theme.colors.textMuted }}>Нет заказов</div>
          }>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.colors.bgHover}` }}>№</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.colors.bgHover}` }}>Точка</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.colors.bgHover}` }}>Сумма</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.colors.bgHover}` }}>Статус</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.colors.bgHover}` }}>Время</th>
                </tr>
              </thead>
              <tbody>
                <For each={(props.orders || []).slice(0, 5)}>
                  {(order) => (
                    <tr style={{ borderBottom: `1px solid ${theme.colors.bgHover}` }}>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: theme.colors.textPrimary }}>
                        <code style={{
                          background: theme.colors.bgInput,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontFamily: theme.fonts.mono,
                          color: theme.colors.textSecondary,
                        }}>#{order.orderNumber || order.id.slice(0, 6)}</code>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: theme.colors.textPrimary }}>{order.location?.name || '—'}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: theme.colors.success }}>{currency(Number(order.totalAmount))}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          'align-items': 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: `${orderStatusColors[order.status]}15`,
                          color: orderStatusColors[order.status],
                        }}>
                          {orderStatusIcons[order.status]} {orderStatusLabels[order.status]}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: theme.colors.textSecondary }}>
                        {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        </div>
      </div>
    </div>
  );
}

// StatCard Component
function StatCard(props: { icon: string; value: string | number; label: string; change?: number; color?: string }) {
  const isPositive = (props.change ?? 0) >= 0;
  return (
    <div style={{
      background: theme.colors.bgCard,
      borderRadius: '16px',
      border: `1px solid ${theme.colors.bgHover}`,
      padding: '20px',
      display: 'flex',
      'align-items': 'center',
      gap: '16px',
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        background: `${props.color || theme.colors.primary}15`,
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        fontSize: '24px',
        flexShrink: 0,
      }}>{props.icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '26px', fontWeight: '700', color: theme.colors.textPrimary, lineHeight: '1.2' }}>{props.value}</div>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px', marginTop: '4px' }}>
          <span style={{ fontSize: '13px', color: theme.colors.textSecondary }}>{props.label}</span>
          {props.change !== undefined && (
            <span style={{ fontSize: '12px', fontWeight: '600', color: isPositive ? theme.colors.success : theme.colors.error }}>
              {isPositive ? '↑' : '↓'} {Math.abs(props.change)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// MiniStat Component
function MiniStat(props: { icon: string; value: number; label: string; color: string }) {
  return (
    <div style={{
      background: theme.colors.bgInput,
      borderRadius: '12px',
      padding: '16px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        background: `${props.color}15`,
        color: props.color,
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        fontSize: '20px',
        margin: '0 auto 10px',
      }}>{props.icon}</div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: theme.colors.textPrimary }}>{props.value}</div>
      <div style={{ fontSize: '12px', color: theme.colors.textMuted, textTransform: 'uppercase', marginTop: '4px' }}>{props.label}</div>
    </div>
  );
}

