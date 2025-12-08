import { createSignal, For, Show } from 'solid-js';
import { theme } from '../styles/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input, { Select, Textarea } from '../components/Input';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { api } from '../hooks/useApi';
import { currency, formatDate, broadcastStatusLabels } from '../utils/format';
import type { Promocode, Broadcast, Location, MarketingTab } from '../types';

interface MarketingProps {
  promocodes: Promocode[];
  broadcasts: Broadcast[];
  locations: Location[];
  onRefresh: () => void;
  showToast: (type: 'ok' | 'err', text: string) => void;
}

export default function Marketing(props: MarketingProps) {
  const [activeTab, setActiveTab] = createSignal<MarketingTab>('promocodes');
  const [showModal, setShowModal] = createSignal<'promocode' | 'broadcast' | null>(null);

  // Promocode form
  const [promoForm, setPromoForm] = createSignal({
    code: '',
    description: '',
    type: 'percent',
    value: 10,
    scope: 'global',
    locationId: '',
    usageLimit: '',
    minOrderAmount: '',
  });

  // Broadcast form
  const [broadcastForm, setBroadcastForm] = createSignal({
    title: '',
    message: '',
    scope: 'all',
    locationId: '',
    buttonText: '',
    buttonUrl: '',
  });

  const submitPromocode = async () => {
    try {
      await api.createPromocode({
        ...promoForm(),
        value: Number(promoForm().value),
        usageLimit: promoForm().usageLimit ? Number(promoForm().usageLimit) : undefined,
        minOrderAmount: promoForm().minOrderAmount ? Number(promoForm().minOrderAmount) : undefined,
        isActive: true,
      } as any);
      setPromoForm({ code: '', description: '', type: 'percent', value: 10, scope: 'global', locationId: '', usageLimit: '', minOrderAmount: '' });
      setShowModal(null);
      props.showToast('ok', '✅ Промокод создан');
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const submitBroadcast = async () => {
    try {
      await api.createBroadcast(broadcastForm() as any);
      setBroadcastForm({ title: '', message: '', scope: 'all', locationId: '', buttonText: '', buttonUrl: '' });
      setShowModal(null);
      props.showToast('ok', '✅ Рассылка создана');
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const togglePromocode = async (promo: Promocode) => {
    try {
      await api.updatePromocode(promo.id, { isActive: !promo.isActive });
      props.showToast('ok', `✅ Промокод ${promo.isActive ? 'деактивирован' : 'активирован'}`);
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
          <h1 style={styles.title}>📣 Маркетинг</h1>
          <p style={styles.subtitle}>Промокоды и рассылки</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab() === 'promocodes' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('promocodes')}
        >
          🎟️ Промокоды <Badge size="sm">{props.promocodes?.length || 0}</Badge>
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab() === 'broadcasts' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('broadcasts')}
        >
          📨 Рассылки <Badge size="sm">{props.broadcasts?.length || 0}</Badge>
        </button>
      </div>

      {/* Promocodes Tab */}
      <Show when={activeTab() === 'promocodes'}>
        <Card
          title="Промокоды"
          subtitle="Управление скидками"
          icon="🎟️"
          action={<Button icon="➕" onClick={() => setShowModal('promocode')}>Создать промокод</Button>}
          noPadding
        >
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Код</th>
                  <th style={styles.th}>Тип</th>
                  <th style={styles.th}>Скидка</th>
                  <th style={styles.th}>Использовано</th>
                  <th style={styles.th}>Область</th>
                  <th style={styles.th}>Срок</th>
                  <th style={styles.th}>Статус</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                <For each={props.promocodes || []}>
                  {(promo) => (
                    <tr style={styles.tr}>
                      <td style={styles.td}>
                        <code style={styles.promoCode}>{promo.code}</code>
                      </td>
                      <td style={styles.td}>
                        <Badge variant="default" size="sm">
                          {promo.type === 'percent' ? '📊 Процент' : '💰 Фикс'}
                        </Badge>
                      </td>
                      <td style={styles.td}>
                        <strong style={styles.discount}>
                          {promo.type === 'percent' ? `${promo.value}%` : currency(Number(promo.value))}
                        </strong>
                      </td>
                      <td style={styles.td}>
                        {promo.usedCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ''}
                      </td>
                      <td style={styles.td}>
                        <Badge variant={promo.scope === 'global' ? 'info' : 'warning'} size="sm">
                          {promo.scope === 'global' ? '🌍 Глобальный' : '📍 Локальный'}
                        </Badge>
                      </td>
                      <td style={styles.td}>
                        {promo.endsAt ? formatDate(promo.endsAt) : '∞'}
                      </td>
                      <td style={styles.td}>
                        <Badge variant={promo.isActive ? 'success' : 'default'} size="sm">
                          {promo.isActive ? '✅ Активен' : '⏸️ Выкл'}
                        </Badge>
                      </td>
                      <td style={styles.td}>
                        <button style={styles.actionBtn} onClick={() => togglePromocode(promo)}>
                          {promo.isActive ? '⏸️' : '▶️'}
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
            <Show when={!props.promocodes?.length}>
              <div style={styles.empty}>Нет промокодов</div>
            </Show>
          </div>
        </Card>
      </Show>

      {/* Broadcasts Tab */}
      <Show when={activeTab() === 'broadcasts'}>
        <Card
          title="Рассылки"
          subtitle="Массовые уведомления пользователям"
          icon="📨"
          action={<Button icon="➕" onClick={() => setShowModal('broadcast')}>Создать рассылку</Button>}
          noPadding
        >
          <div style={styles.broadcastList}>
            <For each={props.broadcasts || []}>
              {(broadcast) => (
                <div style={styles.broadcastCard}>
                  <div style={styles.broadcastHeader}>
                    <h4 style={styles.broadcastTitle}>{broadcast.title || 'Без названия'}</h4>
                    <Badge
                      variant={broadcast.status === 'sent' ? 'success' : broadcast.status === 'draft' ? 'default' : 'warning'}
                      size="sm"
                    >
                      {broadcastStatusLabels[broadcast.status] || broadcast.status}
                    </Badge>
                  </div>
                  <p style={styles.broadcastMessage}>{broadcast.message}</p>
                  <div style={styles.broadcastMeta}>
                    <span>👥 {broadcast.totalRecipients} получателей</span>
                    <span>✉️ {broadcast.sentCount} отправлено</span>
                    <span>✅ {broadcast.deliveredCount} доставлено</span>
                  </div>
                </div>
              )}
            </For>
            <Show when={!props.broadcasts?.length}>
              <div style={styles.empty}>Нет рассылок</div>
            </Show>
          </div>
        </Card>
      </Show>

      {/* Promocode Modal */}
      <Modal
        isOpen={showModal() === 'promocode'}
        onClose={() => setShowModal(null)}
        title="Новый промокод"
        size="lg"
        footer={
          <div style={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setShowModal(null)}>Отмена</Button>
            <Button onClick={submitPromocode} disabled={!promoForm().code || !promoForm().value}>Создать</Button>
          </div>
        }
      >
        <div style={styles.form}>
          <div style={styles.formRow}>
            <Input
              label="Код промокода"
              placeholder="SUMMER2024"
              value={promoForm().code}
              onInput={(v) => setPromoForm({ ...promoForm(), code: v.toUpperCase() })}
              required
            />
            <Select
              label="Тип скидки"
              value={promoForm().type}
              onChange={(v) => setPromoForm({ ...promoForm(), type: v })}
              options={[
                { value: 'percent', label: 'Процент (%)' },
                { value: 'fixed', label: 'Фиксированная сумма' },
              ]}
            />
          </div>
          <div style={styles.formRow}>
            <Input
              label={promoForm().type === 'percent' ? 'Процент скидки (%)' : 'Сумма скидки (₽)'}
              type="number"
              value={promoForm().value}
              onInput={(v) => setPromoForm({ ...promoForm(), value: Number(v) })}
              required
            />
            <Input
              label="Мин. сумма заказа (₽)"
              type="number"
              placeholder="0"
              value={promoForm().minOrderAmount}
              onInput={(v) => setPromoForm({ ...promoForm(), minOrderAmount: v })}
            />
          </div>
          <Input
            label="Описание"
            placeholder="Зимняя акция"
            value={promoForm().description}
            onInput={(v) => setPromoForm({ ...promoForm(), description: v })}
          />
          <div style={styles.formRow}>
            <Select
              label="Область действия"
              value={promoForm().scope}
              onChange={(v) => setPromoForm({ ...promoForm(), scope: v })}
              options={[
                { value: 'global', label: '🌍 Все точки' },
                { value: 'location', label: '📍 Конкретная точка' },
              ]}
            />
            <Input
              label="Лимит использований"
              type="number"
              placeholder="∞"
              value={promoForm().usageLimit}
              onInput={(v) => setPromoForm({ ...promoForm(), usageLimit: v })}
            />
          </div>
        </div>
      </Modal>

      {/* Broadcast Modal */}
      <Modal
        isOpen={showModal() === 'broadcast'}
        onClose={() => setShowModal(null)}
        title="Новая рассылка"
        size="lg"
        footer={
          <div style={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setShowModal(null)}>Отмена</Button>
            <Button onClick={submitBroadcast} disabled={!broadcastForm().message}>Создать</Button>
          </div>
        }
      >
        <div style={styles.form}>
          <Input
            label="Название (для себя)"
            placeholder="Новый сезонный латте"
            value={broadcastForm().title}
            onInput={(v) => setBroadcastForm({ ...broadcastForm(), title: v })}
          />
          <Textarea
            label="Сообщение"
            placeholder="☕ Новый сезонный латте!&#10;&#10;Тыквенный спайс уже в меню."
            value={broadcastForm().message}
            onInput={(v) => setBroadcastForm({ ...broadcastForm(), message: v })}
            rows={5}
            required
          />
          <Select
            label="Получатели"
            value={broadcastForm().scope}
            onChange={(v) => setBroadcastForm({ ...broadcastForm(), scope: v })}
            options={[
              { value: 'all', label: '👥 Все пользователи' },
              { value: 'location', label: '📍 Пользователи точки' },
            ]}
          />
          <div style={styles.formRow}>
            <Input
              label="Текст кнопки"
              placeholder="Открыть меню"
              value={broadcastForm().buttonText}
              onInput={(v) => setBroadcastForm({ ...broadcastForm(), buttonText: v })}
            />
            <Input
              label="URL кнопки"
              placeholder="https://t.me/..."
              value={broadcastForm().buttonUrl}
              onInput={(v) => setBroadcastForm({ ...broadcastForm(), buttonUrl: v })}
            />
          </div>
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
  tabs: {
    display: 'flex',
    gap: '8px',
    padding: '4px',
    background: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.bgHover}`,
    width: 'fit-content',
  },
  tab: {
    padding: '10px 20px',
    background: 'transparent',
    border: 'none',
    borderRadius: theme.radius.md,
    fontSize: '14px',
    fontWeight: 500,
    color: theme.colors.textSecondary,
    cursor: 'pointer',
    display: 'flex',
    'align-items': 'center',
    gap: '8px',
    transition: theme.transition.fast,
  },
  tabActive: {
    background: theme.colors.bgHover,
    color: theme.colors.primary,
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
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: theme.colors.textPrimary,
  },
  promoCode: {
    background: `${theme.colors.primary}15`,
    color: theme.colors.primary,
    padding: '6px 12px',
    borderRadius: theme.radius.md,
    fontSize: '13px',
    fontFamily: theme.fonts.mono,
    fontWeight: 600,
  },
  discount: {
    color: theme.colors.success,
    fontSize: '15px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
  },
  broadcastList: {
    display: 'flex',
    'flex-direction': 'column',
    gap: '16px',
    padding: '20px',
  },
  broadcastCard: {
    background: theme.colors.bgInput,
    borderRadius: theme.radius.md,
    padding: '16px',
    border: `1px solid ${theme.colors.bgHover}`,
  },
  broadcastHeader: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    'margin-bottom': '8px',
  },
  broadcastTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: theme.colors.textPrimary,
  },
  broadcastMessage: {
    margin: '0 0 12px',
    fontSize: '13px',
    color: theme.colors.textSecondary,
    lineHeight: 1.5,
    whiteSpace: 'pre-line',
  },
  broadcastMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: theme.colors.textMuted,
  },
  empty: {
    padding: '60px',
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: '14px',
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


