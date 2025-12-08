import { createSignal, For, Show } from 'solid-js';
import { theme } from '../styles/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input, { Select, Textarea } from '../components/Input';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { api } from '../hooks/useApi';
import { currency } from '../utils/format';
import type { Category, Product, ModifierGroup, ModifierOption, CatalogTab } from '../types';

interface CatalogProps {
  categories: Category[];
  products: Product[];
  modifierGroups: ModifierGroup[];
  onRefresh: () => void;
  showToast: (type: 'ok' | 'err', text: string) => void;
}

export default function Catalog(props: CatalogProps) {
  const [activeTab, setActiveTab] = createSignal<CatalogTab>('products');
  const [showModal, setShowModal] = createSignal<'category' | 'product' | 'modifier' | null>(null);
  
  // Forms
  const [catForm, setCatForm] = createSignal({ name: '', description: '', sortOrder: 0 });
  const [prodForm, setProdForm] = createSignal({ 
    name: '', description: '', price: 0, categoryId: '', status: 'active', isFeatured: false, isNew: false 
  });
  const [modForm, setModForm] = createSignal({ 
    name: '', type: 'single', required: false, minSelect: 0, maxSelect: 1 
  });

  const submitCategory = async () => {
    try {
      await api.createCategory(catForm());
      setCatForm({ name: '', description: '', sortOrder: 0 });
      setShowModal(null);
      props.showToast('ok', '✅ Категория создана');
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const submitProduct = async () => {
    try {
      await api.createProduct({ ...prodForm(), price: Number(prodForm().price) });
      setProdForm({ name: '', description: '', price: 0, categoryId: '', status: 'active', isFeatured: false, isNew: false });
      setShowModal(null);
      props.showToast('ok', '✅ Продукт создан');
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const submitModifier = async () => {
    try {
      await api.createModifierGroup(modForm() as any);
      setModForm({ name: '', type: 'single', required: false, minSelect: 0, maxSelect: 1 });
      setShowModal(null);
      props.showToast('ok', '✅ Группа модификаторов создана');
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      props.showToast('ok', '✅ Категория удалена');
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      props.showToast('ok', '✅ Продукт удалён');
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
          <h1 style={styles.title}>📦 Каталог</h1>
          <p style={styles.subtitle}>Управление категориями, товарами и модификаторами</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab() === 'products' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('products')}
        >
          🍰 Товары <Badge size="sm">{props.products?.length || 0}</Badge>
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab() === 'categories' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('categories')}
        >
          📁 Категории <Badge size="sm">{props.categories?.length || 0}</Badge>
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab() === 'modifiers' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('modifiers')}
        >
          ⚙️ Модификаторы <Badge size="sm">{props.modifierGroups?.length || 0}</Badge>
        </button>
      </div>

      {/* Products Tab */}
      <Show when={activeTab() === 'products'}>
        <Card
          title="Товары"
          subtitle={`${props.products?.length || 0} позиций в каталоге`}
          icon="🍰"
          action={<Button icon="➕" onClick={() => setShowModal('product')}>Добавить товар</Button>}
          noPadding
        >
          <div style={styles.list}>
            <For each={props.products || []}>
              {(product) => (
                <div style={styles.listItem}>
                  <div style={styles.itemImage}>☕</div>
                  <div style={styles.itemContent}>
                    <div style={styles.itemHeader}>
                      <span style={styles.itemTitle}>{product.name}</span>
                      <div style={styles.itemBadges}>
                        {product.isNew && <Badge variant="info" size="sm">NEW</Badge>}
                        {product.isFeatured && <Badge variant="warning" size="sm">⭐</Badge>}
                        <Badge variant={product.status === 'active' ? 'success' : 'default'} size="sm">
                          {product.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </div>
                    </div>
                    <div style={styles.itemMeta}>
                      {product.category?.name && <span>📁 {product.category.name}</span>}
                      <span style={styles.price}>{currency(Number(product.price))}</span>
                    </div>
                    {product.description && (
                      <p style={styles.itemDesc}>{product.description.slice(0, 100)}...</p>
                    )}
                  </div>
                  <div style={styles.itemActions}>
                    <button style={styles.actionBtn} title="Редактировать">✏️</button>
                    <button style={styles.actionBtn} title="Удалить" onClick={() => deleteProduct(product.id)}>🗑️</button>
                  </div>
                </div>
              )}
            </For>
            <Show when={!props.products?.length}>
              <div style={styles.empty}>Нет товаров. Создайте первый!</div>
            </Show>
          </div>
        </Card>
      </Show>

      {/* Categories Tab */}
      <Show when={activeTab() === 'categories'}>
        <Card
          title="Категории"
          subtitle={`${props.categories?.length || 0} категорий`}
          icon="📁"
          action={<Button icon="➕" onClick={() => setShowModal('category')}>Добавить категорию</Button>}
          noPadding
        >
          <div style={styles.list}>
            <For each={props.categories || []}>
              {(cat) => (
                <div style={styles.listItem}>
                  <div style={styles.itemImage}>{cat.imageUrl ? '🖼️' : '📁'}</div>
                  <div style={styles.itemContent}>
                    <div style={styles.itemHeader}>
                      <span style={styles.itemTitle}>{cat.name}</span>
                      <Badge variant={cat.isActive ? 'success' : 'default'} size="sm">
                        {cat.isActive ? 'Активна' : 'Неактивна'}
                      </Badge>
                    </div>
                    <div style={styles.itemMeta}>
                      {cat.slug && <span>🔗 /{cat.slug}</span>}
                      <span>{cat._count?.products || 0} товаров</span>
                    </div>
                  </div>
                  <div style={styles.itemActions}>
                    <button style={styles.actionBtn} title="Редактировать">✏️</button>
                    <button style={styles.actionBtn} title="Удалить" onClick={() => deleteCategory(cat.id)}>🗑️</button>
                  </div>
                </div>
              )}
            </For>
            <Show when={!props.categories?.length}>
              <div style={styles.empty}>Нет категорий. Создайте первую!</div>
            </Show>
          </div>
        </Card>
      </Show>

      {/* Modifiers Tab */}
      <Show when={activeTab() === 'modifiers'}>
        <Card
          title="Группы модификаторов"
          subtitle={`${props.modifierGroups?.length || 0} групп`}
          icon="⚙️"
          action={<Button icon="➕" onClick={() => setShowModal('modifier')}>Добавить группу</Button>}
          noPadding
        >
          <div style={styles.modifiersList}>
            <For each={props.modifierGroups || []}>
              {(group) => (
                <div style={styles.modifierCard}>
                  <div style={styles.modifierHeader}>
                    <span style={styles.modifierTitle}>{group.name}</span>
                    <div style={styles.modifierBadges}>
                      <Badge variant="default" size="sm">{group.type === 'single' ? 'Один' : 'Несколько'}</Badge>
                      {group.required && <Badge variant="warning" size="sm">Обязательный</Badge>}
                    </div>
                  </div>
                  <div style={styles.modifierOptions}>
                    <For each={group.options || []}>
                      {(opt) => (
                        <span style={styles.optionChip}>
                          {opt.name} {opt.price > 0 ? `+${currency(opt.price)}` : ''}
                          {opt.isDefault && ' ★'}
                        </span>
                      )}
                    </For>
                    <Show when={!group.options?.length}>
                      <span style={styles.noOptions}>Нет опций</span>
                    </Show>
                  </div>
                </div>
              )}
            </For>
            <Show when={!props.modifierGroups?.length}>
              <div style={styles.empty}>Нет модификаторов. Создайте первый!</div>
            </Show>
          </div>
        </Card>
      </Show>

      {/* Category Modal */}
      <Modal
        isOpen={showModal() === 'category'}
        onClose={() => setShowModal(null)}
        title="Новая категория"
        footer={
          <div style={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setShowModal(null)}>Отмена</Button>
            <Button onClick={submitCategory} disabled={!catForm().name}>Создать</Button>
          </div>
        }
      >
        <div style={styles.form}>
          <Input
            label="Название категории"
            placeholder="Например: Кофе, Выпечка"
            value={catForm().name}
            onInput={(v) => setCatForm({ ...catForm(), name: v })}
            required
          />
          <Textarea
            label="Описание"
            placeholder="Описание категории..."
            value={catForm().description}
            onInput={(v) => setCatForm({ ...catForm(), description: v })}
          />
          <Input
            label="Порядок сортировки"
            type="number"
            value={catForm().sortOrder}
            onInput={(v) => setCatForm({ ...catForm(), sortOrder: Number(v) })}
          />
        </div>
      </Modal>

      {/* Product Modal */}
      <Modal
        isOpen={showModal() === 'product'}
        onClose={() => setShowModal(null)}
        title="Новый продукт"
        size="lg"
        footer={
          <div style={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setShowModal(null)}>Отмена</Button>
            <Button onClick={submitProduct} disabled={!prodForm().name || !prodForm().price}>Создать</Button>
          </div>
        }
      >
        <div style={styles.form}>
          <Input
            label="Название"
            placeholder="Капучино, Латте, Круассан..."
            value={prodForm().name}
            onInput={(v) => setProdForm({ ...prodForm(), name: v })}
            required
          />
          <div style={styles.formRow}>
            <Input
              label="Цена (₽)"
              type="number"
              placeholder="250"
              value={prodForm().price}
              onInput={(v) => setProdForm({ ...prodForm(), price: Number(v) })}
              required
            />
            <Select
              label="Категория"
              value={prodForm().categoryId}
              onChange={(v) => setProdForm({ ...prodForm(), categoryId: v })}
              placeholder="Выберите категорию"
              options={(props.categories || []).map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
          <Textarea
            label="Описание"
            placeholder="Описание продукта..."
            value={prodForm().description}
            onInput={(v) => setProdForm({ ...prodForm(), description: v })}
          />
          <div style={styles.checkboxRow}>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={prodForm().isFeatured}
                onChange={(e) => setProdForm({ ...prodForm(), isFeatured: e.currentTarget.checked })}
              />
              ⭐ Рекомендуемый
            </label>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={prodForm().isNew}
                onChange={(e) => setProdForm({ ...prodForm(), isNew: e.currentTarget.checked })}
              />
              🆕 Новинка
            </label>
          </div>
        </div>
      </Modal>

      {/* Modifier Modal */}
      <Modal
        isOpen={showModal() === 'modifier'}
        onClose={() => setShowModal(null)}
        title="Новая группа модификаторов"
        footer={
          <div style={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setShowModal(null)}>Отмена</Button>
            <Button onClick={submitModifier} disabled={!modForm().name}>Создать</Button>
          </div>
        }
      >
        <div style={styles.form}>
          <Input
            label="Название группы"
            placeholder="Размер, Молоко, Сироп..."
            value={modForm().name}
            onInput={(v) => setModForm({ ...modForm(), name: v })}
            required
          />
          <Select
            label="Тип выбора"
            value={modForm().type}
            onChange={(v) => setModForm({ ...modForm(), type: v })}
            options={[
              { value: 'single', label: 'Один вариант' },
              { value: 'multiple', label: 'Несколько вариантов' },
            ]}
          />
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={modForm().required}
              onChange={(e) => setModForm({ ...modForm(), required: e.currentTarget.checked })}
            />
            Обязательный для заполнения
          </label>
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
  list: {
    display: 'flex',
    'flex-direction': 'column',
  },
  listItem: {
    display: 'flex',
    'align-items': 'center',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: `1px solid ${theme.colors.bgHover}`,
    transition: theme.transition.fast,
  },
  itemImage: {
    width: '56px',
    height: '56px',
    background: theme.colors.bgInput,
    borderRadius: theme.radius.md,
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    fontSize: '24px',
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemHeader: {
    display: 'flex',
    'align-items': 'center',
    gap: '10px',
    'margin-bottom': '4px',
  },
  itemTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: theme.colors.textPrimary,
  },
  itemBadges: {
    display: 'flex',
    gap: '6px',
  },
  itemMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
    color: theme.colors.textMuted,
  },
  itemDesc: {
    margin: '6px 0 0',
    fontSize: '13px',
    color: theme.colors.textSecondary,
  },
  price: {
    fontWeight: 600,
    color: theme.colors.success,
  },
  itemActions: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    width: '36px',
    height: '36px',
    background: theme.colors.bgInput,
    border: 'none',
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    transition: theme.transition.fast,
  },
  modifiersList: {
    display: 'grid',
    'grid-template-columns': 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
    padding: '20px',
  },
  modifierCard: {
    background: theme.colors.bgInput,
    borderRadius: theme.radius.md,
    padding: '16px',
    border: `1px solid ${theme.colors.bgHover}`,
  },
  modifierHeader: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    'margin-bottom': '12px',
  },
  modifierTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: theme.colors.textPrimary,
  },
  modifierBadges: {
    display: 'flex',
    gap: '6px',
  },
  modifierOptions: {
    display: 'flex',
    'flex-wrap': 'wrap',
    gap: '8px',
  },
  optionChip: {
    padding: '6px 12px',
    background: theme.colors.bgCard,
    borderRadius: theme.radius.full,
    fontSize: '12px',
    color: theme.colors.textSecondary,
  },
  noOptions: {
    fontSize: '13px',
    color: theme.colors.textMuted,
    fontStyle: 'italic',
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
  checkboxRow: {
    display: 'flex',
    gap: '24px',
  },
  checkbox: {
    display: 'flex',
    'align-items': 'center',
    gap: '8px',
    fontSize: '14px',
    color: theme.colors.textSecondary,
    cursor: 'pointer',
  },
  modalFooter: {
    display: 'flex',
    'justify-content': 'flex-end',
    gap: '12px',
  },
};


