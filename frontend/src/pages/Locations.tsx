import { createSignal, For, Show } from 'solid-js';
import { theme } from '../styles/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input, { Textarea } from '../components/Input';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { api } from '../hooks/useApi';
import { locationStatusLabels } from '../utils/format';
import type { Location } from '../types';

interface LocationsProps {
  locations: Location[];
  onRefresh: () => void;
  showToast: (type: 'ok' | 'err', text: string) => void;
}

export default function Locations(props: LocationsProps) {
  const [showModal, setShowModal] = createSignal(false);
  const [form, setForm] = createSignal({
    name: '',
    city: '',
    address: '',
    phone: '',
    description: '',
  });

  const submitLocation = async () => {
    try {
      await api.createLocation(form());
      setForm({ name: '', city: '', address: '', phone: '', description: '' });
      setShowModal(false);
      props.showToast('ok', '✅ Точка создана');
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      await api.deleteLocation(id);
      props.showToast('ok', '✅ Точка удалена');
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const toggleStatus = async (loc: Location) => {
    try {
      const newStatus = loc.status === 'active' ? 'inactive' : 'active';
      await api.updateLocation(loc.id, { status: newStatus } as any);
      props.showToast('ok', `✅ Статус изменён`);
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🏪 Точки</h1>
          <p style={styles.subtitle}>Управление точками продаж</p>
        </div>
        <Button icon="➕" onClick={() => setShowModal(true)}>
          Добавить точку
        </Button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{props.locations?.length || 0}</span>
          <span style={styles.statLabel}>Всего точек</span>
        </div>
        <div style={styles.stat}>
          <span style={{ ...styles.statValue, color: theme.colors.success }}>
            {props.locations?.filter((l) => l.status === 'active').length || 0}
          </span>
          <span style={styles.statLabel}>Активных</span>
        </div>
        <div style={styles.stat}>
          <span style={{ ...styles.statValue, color: theme.colors.warning }}>
            {props.locations?.filter((l) => l.status === 'pending').length || 0}
          </span>
          <span style={styles.statLabel}>Черновиков</span>
        </div>
      </div>

      {/* Locations Grid */}
      <div style={styles.grid}>
        <For each={props.locations || []}>
          {(loc) => (
            <div style={styles.locationCard}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIcon}>🏪</div>
                <div style={styles.cardInfo}>
                  <h3 style={styles.cardTitle}>{loc.name}</h3>
                  <Badge
                    variant={loc.status === 'active' ? 'success' : loc.status === 'pending' ? 'warning' : 'default'}
                    size="sm"
                  >
                    {locationStatusLabels[loc.status] || loc.status}
                  </Badge>
                </div>
              </div>

              <div style={styles.cardBody}>
                {loc.city && (
                  <div style={styles.cardRow}>
                    <span style={styles.rowIcon}>🏙️</span>
                    <span>{loc.city}</span>
                  </div>
                )}
                {loc.address && (
                  <div style={styles.cardRow}>
                    <span style={styles.rowIcon}>📍</span>
                    <span>{loc.address}</span>
                  </div>
                )}
                {loc.phone && (
                  <div style={styles.cardRow}>
                    <span style={styles.rowIcon}>📞</span>
                    <span>{loc.phone}</span>
                  </div>
                )}
                {loc.description && (
                  <p style={styles.cardDesc}>{loc.description}</p>
                )}
              </div>

              <div style={styles.cardFooter}>
                <div style={styles.cardMeta}>
                  <span>📦 {loc._count?.orders || 0} заказов</span>
                  <span>👥 {loc._count?.staff || 0} сотрудников</span>
                </div>
                <div style={styles.cardActions}>
                  <button style={styles.actionBtn} onClick={() => toggleStatus(loc)}>
                    {loc.status === 'active' ? '⏸️' : '▶️'}
                  </button>
                  <button style={styles.actionBtn}>✏️</button>
                  <button style={styles.actionBtn} onClick={() => deleteLocation(loc.id)}>🗑️</button>
                </div>
              </div>
            </div>
          )}
        </For>
        <Show when={!props.locations?.length}>
          <div style={styles.emptyCard}>
            <span style={styles.emptyIcon}>🏪</span>
            <p style={styles.emptyText}>Нет точек продаж</p>
            <Button icon="➕" onClick={() => setShowModal(true)}>Добавить первую точку</Button>
          </div>
        </Show>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showModal()}
        onClose={() => setShowModal(false)}
        title="Новая точка"
        footer={
          <div style={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Отмена</Button>
            <Button onClick={submitLocation} disabled={!form().name || !form().city}>Создать</Button>
          </div>
        }
      >
        <div style={styles.form}>
          <Input
            label="Название точки"
            placeholder="Кофейня Арбат"
            value={form().name}
            onInput={(v) => setForm({ ...form(), name: v })}
            required
          />
          <div style={styles.formRow}>
            <Input
              label="Город"
              placeholder="Москва"
              value={form().city}
              onInput={(v) => setForm({ ...form(), city: v })}
              required
            />
            <Input
              label="Телефон"
              placeholder="+7 999 123-45-67"
              value={form().phone}
              onInput={(v) => setForm({ ...form(), phone: v })}
            />
          </div>
          <Input
            label="Адрес"
            placeholder="ул. Арбат, 24"
            value={form().address}
            onInput={(v) => setForm({ ...form(), address: v })}
          />
          <Textarea
            label="Описание"
            placeholder="Описание точки..."
            value={form().description}
            onInput={(v) => setForm({ ...form(), description: v })}
          />
        </div>
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
    gap: '24px',
  },
  stat: {
    display: 'flex',
    'flex-direction': 'column',
    gap: '4px',
  },
  statValue: {
    fontSize: '32px',
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
  locationCard: {
    background: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.bgHover}`,
    overflow: 'hidden',
    transition: theme.transition.fast,
  },
  cardHeader: {
    display: 'flex',
    'align-items': 'center',
    gap: '14px',
    padding: '20px',
    borderBottom: `1px solid ${theme.colors.bgHover}`,
  },
  cardIcon: {
    width: '48px',
    height: '48px',
    background: `${theme.colors.primary}15`,
    borderRadius: theme.radius.md,
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    fontSize: '24px',
  },
  cardInfo: {
    flex: 1,
    display: 'flex',
    'flex-direction': 'column',
    gap: '6px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: theme.colors.textPrimary,
  },
  cardBody: {
    padding: '16px 20px',
    display: 'flex',
    'flex-direction': 'column',
    gap: '8px',
  },
  cardRow: {
    display: 'flex',
    'align-items': 'center',
    gap: '8px',
    fontSize: '13px',
    color: theme.colors.textSecondary,
  },
  rowIcon: {
    width: '20px',
    textAlign: 'center',
  },
  cardDesc: {
    margin: '8px 0 0',
    fontSize: '13px',
    color: theme.colors.textMuted,
    lineHeight: 1.5,
  },
  cardFooter: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    padding: '12px 20px',
    background: theme.colors.bgInput,
    borderTop: `1px solid ${theme.colors.bgHover}`,
  },
  cardMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: theme.colors.textMuted,
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
    transition: theme.transition.fast,
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
  form: {
    display: 'flex',
    'flex-direction': 'column',
    gap: '20px',
  },
  formRow: {
    display: 'grid',
    'grid-template-columns': '1fr 1fr',
    gap: '16px',
  },
  modalFooter: {
    display: 'flex',
    'justify-content': 'flex-end',
    gap: '12px',
  },
};


