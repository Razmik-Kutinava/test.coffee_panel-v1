import { createSignal, For, Show } from 'solid-js';
import { theme } from '../styles/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { formatDate, userRoleLabels } from '../utils/format';
import type { User, Location } from '../types';

interface StaffProps {
  users: User[];
  locations: Location[];
  onRefresh: () => void;
  showToast: (type: 'ok' | 'err', text: string) => void;
}

export default function Staff(props: StaffProps) {
  // Filter staff only (non-clients)
  const staffUsers = () => (props.users || []).filter((u) => u.role !== 'client');

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👨‍💼 Сотрудники</h1>
          <p style={styles.subtitle}>{staffUsers().length} сотрудников</p>
        </div>
        <Button icon="➕">Добавить сотрудника</Button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <span style={styles.statIcon}>☕</span>
          <span style={styles.statValue}>
            {staffUsers().filter((u) => u.role === 'barista').length}
          </span>
          <span style={styles.statLabel}>Баристы</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statIcon}>👔</span>
          <span style={styles.statValue}>
            {staffUsers().filter((u) => u.role === 'manager').length}
          </span>
          <span style={styles.statLabel}>Управляющие</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statIcon}>🏪</span>
          <span style={styles.statValue}>
            {staffUsers().filter((u) => u.role === 'franchisee').length}
          </span>
          <span style={styles.statLabel}>Партнёры</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statIcon}>👑</span>
          <span style={styles.statValue}>
            {staffUsers().filter((u) => u.role === 'superadmin' || u.role === 'staff_uk').length}
          </span>
          <span style={styles.statLabel}>УК</span>
        </div>
      </div>

      {/* Staff Grid */}
      <div style={styles.grid}>
        <For each={staffUsers()}>
          {(user) => (
            <div style={styles.staffCard}>
              <div style={styles.cardHeader}>
                <div style={styles.avatar}>
                  {user.telegramFirstName?.[0] || user.email?.[0] || '?'}
                </div>
                <div style={styles.cardInfo}>
                  <h3 style={styles.cardTitle}>
                    {user.telegramFirstName} {user.telegramLastName}
                  </h3>
                  <span style={styles.cardMeta}>
                    {user.telegramUsername ? `@${user.telegramUsername}` : user.email || user.phone}
                  </span>
                </div>
                <Badge
                  variant={user.role === 'superadmin' ? 'error' : user.role === 'franchisee' ? 'warning' : 'primary'}
                  size="sm"
                >
                  {userRoleLabels[user.role]}
                </Badge>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>📍 Точки</span>
                  <span style={styles.infoValue}>—</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>📅 В системе с</span>
                  <span style={styles.infoValue}>{formatDate(user.createdAt)}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>🕐 Последний визит</span>
                  <span style={styles.infoValue}>{formatDate(user.lastSeenAt || user.createdAt)}</span>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <Badge variant={user.status === 'active' ? 'success' : 'error'} size="sm">
                  {user.status === 'active' ? '✅ Активен' : '🚫 Заблокирован'}
                </Badge>
                <div style={styles.cardActions}>
                  <button style={styles.actionBtn}>✏️</button>
                  <button style={styles.actionBtn}>🔑</button>
                </div>
              </div>
            </div>
          )}
        </For>
        <Show when={staffUsers().length === 0}>
          <div style={styles.emptyCard}>
            <span style={styles.emptyIcon}>👨‍💼</span>
            <p style={styles.emptyText}>Нет сотрудников</p>
            <Button icon="➕">Добавить первого</Button>
          </div>
        </Show>
      </div>
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
  statsRow: {
    display: 'flex',
    gap: '20px',
    'flex-wrap': 'wrap',
  },
  stat: {
    display: 'flex',
    'align-items': 'center',
    gap: '12px',
    padding: '16px 24px',
    background: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.bgHover}`,
  },
  statIcon: {
    fontSize: '24px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: '13px',
    color: theme.colors.textMuted,
  },
  grid: {
    display: 'grid',
    'grid-template-columns': 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
  staffCard: {
    background: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.bgHover}`,
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    'align-items': 'center',
    gap: '14px',
    padding: '20px',
    borderBottom: `1px solid ${theme.colors.bgHover}`,
  },
  avatar: {
    width: '48px',
    height: '48px',
    background: `${theme.colors.primary}20`,
    color: theme.colors.primary,
    borderRadius: theme.radius.full,
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    fontSize: '18px',
    fontWeight: 600,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: theme.colors.textPrimary,
  },
  cardMeta: {
    fontSize: '13px',
    color: theme.colors.textMuted,
  },
  cardBody: {
    padding: '16px 20px',
  },
  infoRow: {
    display: 'flex',
    'justify-content': 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${theme.colors.bgHover}`,
  },
  infoLabel: {
    fontSize: '13px',
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontSize: '13px',
    color: theme.colors.textSecondary,
    fontWeight: 500,
  },
  cardFooter: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    padding: '12px 20px',
    background: theme.colors.bgInput,
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    background: theme.colors.bgCard,
    border: `1px solid ${theme.colors.bgHover}`,
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
  },
  emptyCard: {
    background: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    border: `2px dashed ${theme.colors.bgHover}`,
    padding: '60px',
    display: 'flex',
    'flex-direction': 'column',
    'align-items': 'center',
    gap: '16px',
    gridColumn: '1 / -1',
  },
  emptyIcon: {
    fontSize: '48px',
    opacity: 0.5,
  },
  emptyText: {
    margin: 0,
    fontSize: '16px',
    color: theme.colors.textMuted,
  },
};


