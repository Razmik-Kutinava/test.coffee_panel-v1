import { createSignal, For, Show, createMemo } from 'solid-js';
import { theme } from '../styles/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import { Select } from '../components/Input';
import Badge from '../components/Badge';
import { currency, formatDate, userRoleLabels } from '../utils/format';
import type { User } from '../types';

interface UsersProps {
  users: User[];
  onRefresh: () => void;
  showToast: (type: 'ok' | 'err', text: string) => void;
}

export default function Users(props: UsersProps) {
  const [filterRole, setFilterRole] = createSignal('');
  const [filterStatus, setFilterStatus] = createSignal('');

  const filteredUsers = createMemo(() => {
    let users = props.users || [];
    if (filterRole()) {
      users = users.filter((u) => u.role === filterRole());
    }
    if (filterStatus()) {
      users = users.filter((u) => u.status === filterStatus());
    }
    return users;
  });

  const stats = createMemo(() => ({
    total: (props.users || []).length,
    active: (props.users || []).filter((u) => u.status === 'active').length,
    clients: (props.users || []).filter((u) => u.role === 'client').length,
    staff: (props.users || []).filter((u) => u.role !== 'client').length,
  }));

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👥 Пользователи</h1>
          <p style={styles.subtitle}>{filteredUsers().length} пользователей</p>
        </div>
        <Button icon="📤">Экспорт</Button>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats().total}</span>
          <span style={styles.statLabel}>Всего</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statValue, color: theme.colors.success }}>{stats().active}</span>
          <span style={styles.statLabel}>Активных</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statValue, color: theme.colors.info }}>{stats().clients}</span>
          <span style={styles.statLabel}>Клиентов</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statValue, color: theme.colors.warning }}>{stats().staff}</span>
          <span style={styles.statLabel}>Сотрудников</span>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <Select
          value={filterRole()}
          onChange={setFilterRole}
          placeholder="Все роли"
          options={[
            { value: '', label: 'Все роли' },
            { value: 'client', label: '👤 Клиенты' },
            { value: 'barista', label: '☕ Баристы' },
            { value: 'manager', label: '👔 Управляющие' },
            { value: 'franchisee', label: '🏪 Партнёры' },
            { value: 'superadmin', label: '👑 Суперадмины' },
          ]}
        />
        <Select
          value={filterStatus()}
          onChange={setFilterStatus}
          placeholder="Все статусы"
          options={[
            { value: '', label: 'Все статусы' },
            { value: 'active', label: '✅ Активные' },
            { value: 'blocked', label: '🚫 Заблокированные' },
          ]}
        />
      </div>

      {/* Users Table */}
      <Card noPadding>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Пользователь</th>
                <th style={styles.th}>Роль</th>
                <th style={styles.th}>Заказов</th>
                <th style={styles.th}>Сумма</th>
                <th style={styles.th}>Посл. визит</th>
                <th style={styles.th}>Статус</th>
              </tr>
            </thead>
            <tbody>
              <For each={filteredUsers()}>
                {(user) => (
                  <tr style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        <div style={styles.avatar}>
                          {user.telegramFirstName?.[0] || user.email?.[0] || '?'}
                        </div>
                        <div style={styles.userInfo}>
                          <span style={styles.userName}>
                            {user.telegramFirstName} {user.telegramLastName}
                          </span>
                          <span style={styles.userMeta}>
                            {user.telegramUsername ? `@${user.telegramUsername}` : user.email || user.phone || '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <Badge
                        variant={user.role === 'superadmin' ? 'error' : user.role === 'client' ? 'default' : 'primary'}
                        size="sm"
                      >
                        {userRoleLabels[user.role] || user.role}
                      </Badge>
                    </td>
                    <td style={styles.td}>{user.totalOrdersCount}</td>
                    <td style={styles.td}>
                      <span style={styles.amount}>{currency(Number(user.totalOrdersAmount))}</span>
                    </td>
                    <td style={styles.td}>{formatDate(user.lastSeenAt || user.createdAt)}</td>
                    <td style={styles.td}>
                      <Badge variant={user.status === 'active' ? 'success' : 'error'} size="sm">
                        {user.status === 'active' ? '✅ Активен' : '🚫 Заблокирован'}
                      </Badge>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
          <Show when={filteredUsers().length === 0}>
            <div style={styles.empty}>Нет пользователей</div>
          </Show>
        </div>
      </Card>
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
  statsGrid: {
    display: 'grid',
    'grid-template-columns': 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  statCard: {
    background: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.bgHover}`,
    padding: '20px',
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 700,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: '13px',
    color: theme.colors.textMuted,
    marginTop: '4px',
    display: 'block',
  },
  filters: {
    display: 'flex',
    gap: '12px',
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
    borderBottom: `1px solid ${theme.colors.bgHover}`,
    background: theme.colors.bgInput,
  },
  tr: {
    borderBottom: `1px solid ${theme.colors.bgHover}`,
    transition: theme.transition.fast,
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: theme.colors.textPrimary,
  },
  userCell: {
    display: 'flex',
    'align-items': 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    background: `${theme.colors.primary}20`,
    color: theme.colors.primary,
    borderRadius: theme.radius.full,
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    fontSize: '16px',
    fontWeight: 600,
  },
  userInfo: {
    display: 'flex',
    'flex-direction': 'column',
    gap: '2px',
  },
  userName: {
    fontWeight: 500,
  },
  userMeta: {
    fontSize: '12px',
    color: theme.colors.textMuted,
  },
  amount: {
    color: theme.colors.success,
    fontWeight: 600,
  },
  empty: {
    padding: '60px',
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: '14px',
  },
};


