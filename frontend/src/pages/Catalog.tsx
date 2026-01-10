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
  const [editingProduct, setEditingProduct] = createSignal<Product | null>(null);
  const [editingCategory, setEditingCategory] = createSignal<Category | null>(null);
  const [editingModifier, setEditingModifier] = createSignal<ModifierGroup | null>(null);
  
  // Forms
  const [catForm, setCatForm] = createSignal({ name: '', description: '', sortOrder: 0 });
  const [prodForm, setProdForm] = createSignal({ 
    name: '', description: '', price: 0, categoryId: '', status: 'active', isFeatured: false, isNew: false, imageUrl: '' 
  });
  const [modForm, setModForm] = createSignal({ 
    name: '', type: 'single', required: false, minSelect: 0, maxSelect: 1 
  });
  const [modifierOptions, setModifierOptions] = createSignal<Array<{ id?: string; name: string; price: number; isDefault: boolean }>>([]);
  const [selectedProducts, setSelectedProducts] = createSignal<string[]>([]);
  const [productSelectValue, setProductSelectValue] = createSignal<string>('');
  
  // Состояния для работы с изображениями
  const [selectedImage, setSelectedImage] = createSignal<File | null>(null);
  const [imagePreview, setImagePreview] = createSignal<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = createSignal(false);

  const submitCategory = async () => {
    try {
      const editing = editingCategory();
      if (editing) {
        await api.updateCategory(editing.id, catForm());
        props.showToast('ok', '✅ Категория обновлена');
      } else {
        await api.createCategory(catForm());
        props.showToast('ok', '✅ Категория создана');
      }
      setCatForm({ name: '', description: '', sortOrder: 0 });
      setEditingCategory(null);
      setShowModal(null);
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const [isSubmittingProduct, setIsSubmittingProduct] = createSignal(false);
  
  // Обработчик выбора файла изображения
  const handleImageSelect = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      // Валидация типа файла
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        props.showToast('err', '❌ Неподдерживаемый тип файла. Используйте: JPEG, PNG, WebP или GIF');
        return;
      }
      
      // Валидация размера (макс 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        props.showToast('err', `❌ Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(2)}MB. Максимум: 5MB`);
        return;
      }
      
      setSelectedImage(file);
      
      // Создаем превью
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Загрузка изображения на сервер
  const uploadImage = async (file: File): Promise<string> => {
    setIsUploadingImage(true);
    try {
      const response = await api.uploadProductImage(file);
      return response.imageUrl;
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  const submitProduct = async () => {
    if (isSubmittingProduct()) return; // Защита от двойного клика
    
    try {
      setIsSubmittingProduct(true);
      const editing = editingProduct();
      
      // Нормализуем данные перед отправкой
      const formData = { ...prodForm() };
      
      // Валидация названия
      if (!formData.name || formData.name.trim().length < 2) {
        props.showToast('err', '❌ Название должно быть минимум 2 символа');
        setIsSubmittingProduct(false);
        return;
      }
      
      // Валидация цены
      formData.price = Number(formData.price) || 0;
      if (formData.price <= 0) {
        props.showToast('err', '❌ Цена должна быть больше 0');
        setIsSubmittingProduct(false);
        return;
      }
      
      // Нормализуем название (убираем лишние пробелы)
      formData.name = formData.name.trim();
      
      // Загружаем изображение, если оно выбрано
      if (selectedImage()) {
        try {
          const imageUrl = await uploadImage(selectedImage()!);
          formData.imageUrl = imageUrl;
        } catch (error: any) {
          props.showToast('err', `❌ Ошибка загрузки изображения: ${error.message}`);
          setIsSubmittingProduct(false);
          return;
        }
      } else if (editing && editing.imageUrl && formData.imageUrl !== '') {
        // Сохраняем существующее изображение, если новое не выбрано и изображение не было удалено
        formData.imageUrl = editing.imageUrl;
      }
      // Если formData.imageUrl === '', это означает, что пользователь удалил изображение
      
      // Проверяем, что categoryId - это UUID, а не название категории
      // Если это название, находим ID по названию
      if (formData.categoryId && formData.categoryId.trim() !== '') {
        // Проверяем, является ли это UUID (формат: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(formData.categoryId)) {
          // Это не UUID, ищем категорию по названию
          const category = props.categories?.find(c => c.name === formData.categoryId);
          if (category) {
            formData.categoryId = category.id;
          } else {
            // Если категория не найдена, очищаем categoryId
            formData.categoryId = '';
          }
        }
      } else {
        formData.categoryId = '';
      }
      
      if (editing) {
        await api.updateProduct(editing.id, formData);
        props.showToast('ok', '✅ Продукт обновлён');
      } else {
        await api.createProduct(formData);
        props.showToast('ok', '✅ Продукт создан');
      }
      
      // Очищаем форму
      setProdForm({ name: '', description: '', price: 0, categoryId: '', status: 'active', isFeatured: false, isNew: false, imageUrl: '' });
      setSelectedImage(null);
      setImagePreview(null);
      setEditingProduct(null);
      setShowModal(null);
      props.onRefresh();
    } catch (e: any) {
      // Парсим сообщение об ошибке
      let errorMessage = 'Ошибка при создании товара';
      if (e?.message) {
        if (typeof e.message === 'string') {
          errorMessage = e.message;
        } else if (typeof e.message === 'object' && e.message.message) {
          if (Array.isArray(e.message.message)) {
            errorMessage = e.message.message.join(', ');
          } else {
            errorMessage = e.message.message;
          }
        }
      }
      props.showToast('err', `❌ ${errorMessage}`);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const submitModifier = async () => {
    try {
      const editing = editingModifier();
      let groupId: string;
      
      if (editing) {
        // Обновление модификатора
        await api.updateModifierGroup(editing.id, modForm() as any);
        groupId = editing.id;
        
        // Получаем текущие опции для сравнения
        const currentOptions = editing.options || [];
        const currentOptionIds = new Set(currentOptions.map(opt => opt.id));
        const newOptionIds = new Set(modifierOptions().filter(opt => opt.id).map(opt => opt.id!));
        
        // Удаляем опции, которых больше нет
        const optionsToDelete = currentOptions.filter(opt => !newOptionIds.has(opt.id));
        for (const opt of optionsToDelete) {
          try {
            await api.deleteModifierOption(opt.id);
          } catch (e) {
            console.error('Error deleting option:', e);
          }
        }
        
        // Обновляем или создаем опции
        for (const option of modifierOptions()) {
          if (!option.name.trim()) continue; // Пропускаем пустые опции
          
          if (option.id) {
            // Обновляем существующую опцию
            await api.updateModifierOption(option.id, {
              name: option.name,
              price: option.price || 0,
              isDefault: option.isDefault || false,
            });
          } else {
            // Создаем новую опцию
            await api.createModifierOption(groupId, {
              name: option.name,
              price: option.price || 0,
              isDefault: option.isDefault || false,
            });
          }
        }
        
        // Обновляем связи с товарами
        const currentProducts = editing.products || [];
        const currentProductIds = new Set(
          currentProducts
            .map((p: any) => {
              if (p.productId) return p.productId;
              if (p.product && p.product.id) return p.product.id;
              return null;
            })
            .filter((id: string | null): id is string => Boolean(id))
        );
        const newProductIds = new Set(selectedProducts());
        
        // Удаляем связи, которые больше не нужны
        const productsToUnlink = Array.from(currentProductIds).filter(id => !newProductIds.has(id));
        for (const productId of productsToUnlink) {
          try {
            await api.unlinkModifierFromProduct(groupId, productId);
          } catch (e) {
            console.error('Error unlinking modifier from product:', e);
          }
        }
        
        // Добавляем новые связи
        const productsToLink = Array.from(newProductIds).filter(id => !currentProductIds.has(id));
        for (const productId of productsToLink) {
          try {
            await api.linkModifierToProduct(groupId, productId);
          } catch (e) {
            console.error('Error linking modifier to product:', e);
          }
        }
        
        props.showToast('ok', '✅ Группа модификаторов обновлена');
      } else {
        // Создание модификатора с опциями
        const group = await api.createModifierGroup(modForm() as any);
        groupId = group.id;
        
        // Создаем все опции для новой группы параллельно
        const optionsToCreate = modifierOptions().filter(opt => opt.name.trim());
        if (optionsToCreate.length > 0) {
          await Promise.all(
            optionsToCreate.map(option =>
              api.createModifierOption(groupId, {
                name: option.name,
                price: option.price || 0,
                isDefault: option.isDefault || false,
              })
            )
          );
        }
        
        // Связываем с выбранными товарами, если они выбраны
        if (selectedProducts().length > 0) {
          await Promise.all(
            selectedProducts().map(productId =>
              api.linkModifierToProduct(groupId, productId).catch((e: any) => {
                console.error('Error linking modifier to product:', e);
                // Продолжаем связывать остальные товары даже если один не удался
              })
            )
          );
        }
        
        props.showToast('ok', '✅ Группа модификаторов создана');
      }
      
      setModForm({ name: '', type: 'single', required: false, minSelect: 0, maxSelect: 1 });
      setModifierOptions([]);
      setSelectedProducts([]);
      setProductSelectValue('');
      setEditingModifier(null);
      setShowModal(null);
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const deleteModifier = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту группу модификаторов?')) return;
    try {
      await api.deleteModifierGroup(id);
      props.showToast('ok', '✅ Группа модификаторов удалена');
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const editModifier = (group: ModifierGroup) => {
    setEditingModifier(group);
    setModForm({
      name: group.name || '',
      type: group.type || 'single',
      required: group.required || false,
      minSelect: group.minSelect || 0,
      maxSelect: group.maxSelect || 1,
    });
    setModifierOptions(
      (group.options || []).map(opt => ({
        id: opt.id,
        name: opt.name,
        price: Number(opt.price) || 0,
        isDefault: opt.isDefault || false,
      }))
    );
    // Загружаем связанные товары
    if (group.products && Array.isArray(group.products) && group.products.length > 0) {
      const productIds = group.products
        .map((p: any) => {
          // Может быть либо прямой productId, либо вложенный объект product
          if (p.productId) return p.productId;
          if (p.product && p.product.id) return p.product.id;
          return null;
        })
        .filter((id: string | null): id is string => Boolean(id));
      setSelectedProducts(productIds);
    } else {
      setSelectedProducts([]);
    }
    setProductSelectValue('');
    setShowModal('modifier');
  };

  const addModifierOption = () => {
    setModifierOptions([...modifierOptions(), { name: '', price: 0, isDefault: false }]);
  };

  const removeModifierOption = (index: number) => {
    setModifierOptions(modifierOptions().filter((_, i) => i !== index));
  };

  const updateModifierOption = (index: number, field: string, value: any) => {
    const options = [...modifierOptions()];
    options[index] = { ...options[index], [field]: value };
    setModifierOptions(options);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;
    try {
      await api.deleteCategory(id);
      props.showToast('ok', '✅ Категория удалена');
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот продукт?')) return;
    try {
      await api.deleteProduct(id);
      props.showToast('ok', '✅ Продукт удалён');
      props.onRefresh();
    } catch (e: any) {
      props.showToast('err', `❌ ${e?.message || 'Ошибка'}`);
    }
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setProdForm({
      name: product.name || '',
      description: product.description || '',
      price: Number(product.price) || 0,
      categoryId: product.categoryId || '',
      status: product.status || 'active',
      isFeatured: product.isFeatured || false,
      isNew: product.isNew || false,
      imageUrl: product.imageUrl || '',
    });
    // Устанавливаем превью текущего изображения, если оно есть
    if (product.imageUrl) {
      setImagePreview(product.imageUrl);
    } else {
      setImagePreview(null);
    }
    setSelectedImage(null); // Сбрасываем выбранный файл
    setShowModal('product');
  };

  const editCategory = (category: Category) => {
    setEditingCategory(category);
    setCatForm({
      name: category.name || '',
      description: category.description || '',
      sortOrder: category.sortOrder || 0,
    });
    setShowModal('category');
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
                  <div style={styles.itemImage}>
                    <Show when={product.imageUrl} fallback={<span>☕</span>}>
                      <img
                        src={product.imageUrl!}
                        alt={product.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: theme.radius.md,
                        }}
                        onError={(e) => {
                          // Если изображение не загрузилось, показываем иконку
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('span')) {
                            parent.innerHTML = '<span>☕</span>';
                          }
                        }}
                      />
                    </Show>
                  </div>
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
                    <button style={styles.actionBtn} title="Редактировать" onClick={() => editProduct(product)}>✏️</button>
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
                    <button style={styles.actionBtn} title="Редактировать" onClick={() => editCategory(cat)}>✏️</button>
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
                    <div style={styles.itemActions}>
                      <button style={styles.actionBtn} title="Редактировать" onClick={() => editModifier(group)}>✏️</button>
                      <button style={styles.actionBtn} title="Удалить" onClick={() => deleteModifier(group.id)}>🗑️</button>
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
                  {/* Отображение связанных товаров */}
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
                      Связанные товары:
                    </div>
                    <Show when={group.products && group.products.length > 0}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <For each={group.products}>
                          {(link) => {
                            const productName = link.product?.name || 'Неизвестный товар';
                            return (
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 500
                              }}>
                                📦 {productName}
                              </span>
                            );
                          }}
                        </For>
                      </div>
                    </Show>
                    <Show when={!group.products || group.products.length === 0}>
                      <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                        Доступен для всех товаров
                      </span>
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
        onClose={() => {
          setShowModal(null);
          setEditingCategory(null);
          setCatForm({ name: '', description: '', sortOrder: 0 });
        }}
        title={editingCategory() ? 'Редактировать категорию' : 'Новая категория'}
        footer={
          <div style={styles.modalFooter}>
            <Button variant="ghost" onClick={() => {
              setShowModal(null);
              setEditingCategory(null);
              setCatForm({ name: '', description: '', sortOrder: 0 });
            }}>Отмена</Button>
            <Button onClick={submitCategory} disabled={!catForm().name}>
              {editingCategory() ? 'Сохранить' : 'Создать'}
            </Button>
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
        onClose={() => {
          setShowModal(null);
          setEditingProduct(null);
          setProdForm({ name: '', description: '', price: 0, categoryId: '', status: 'active', isFeatured: false, isNew: false, imageUrl: '' });
          setSelectedImage(null);
          setImagePreview(null);
        }}
        title={editingProduct() ? 'Редактировать продукт' : 'Новый продукт'}
        size="md"
        footer={
          <div style={styles.modalFooter}>
            <Button variant="ghost" onClick={() => {
              setShowModal(null);
              setEditingProduct(null);
              setProdForm({ name: '', description: '', price: 0, categoryId: '', status: 'active', isFeatured: false, isNew: false, imageUrl: '' });
              setSelectedImage(null);
              setImagePreview(null);
            }}>Отмена</Button>
            <Button onClick={submitProduct} disabled={!prodForm().name || !prodForm().price || Number(prodForm().price) <= 0 || isSubmittingProduct() || isUploadingImage()}>
              {isSubmittingProduct() || isUploadingImage() ? (isUploadingImage() ? 'Загрузка изображения...' : 'Создание...') : editingProduct() ? 'Сохранить' : 'Создать'}
            </Button>
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
          
          {/* Поле для загрузки изображения */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: theme.colors.textPrimary }}>
              Изображение товара
            </label>
            <input
              id="product-image-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleImageSelect}
              disabled={isUploadingImage()}
              style={{ display: 'none' }}
            />
            <label
              for="product-image-upload"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px 16px',
                border: `2px dashed ${theme.colors.border}`,
                borderRadius: theme.radius.md,
                background: theme.colors.bgInput,
                color: theme.colors.textSecondary,
                fontSize: '14px',
                fontWeight: 500,
                cursor: isUploadingImage() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                ':hover': {
                  borderColor: theme.colors.primary,
                  background: theme.colors.bgHover,
                },
              }}
              onMouseEnter={(e) => {
                if (!isUploadingImage()) {
                  e.currentTarget.style.borderColor = theme.colors.primary;
                  e.currentTarget.style.background = theme.colors.bgHover;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.background = theme.colors.bgInput;
              }}
            >
              <span style={{ fontSize: '20px' }}>📸</span>
              <span>{selectedImage() ? 'Изменить изображение' : 'Выбрать изображение'}</span>
              <span style={{ fontSize: '12px', color: theme.colors.textMuted }}>
                (JPEG, PNG, WebP, GIF, до 5MB)
              </span>
            </label>
            <Show when={imagePreview() || (editingProduct() && editingProduct()!.imageUrl && prodForm().imageUrl !== '')}>
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: theme.colors.bgHover,
                borderRadius: theme.radius.md,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={imagePreview() || (editingProduct()?.imageUrl && prodForm().imageUrl !== '' ? editingProduct()!.imageUrl : '') || ''}
                    alt="Preview"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: theme.radius.md,
                      objectFit: 'cover',
                      border: `2px solid ${theme.colors.border}`,
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Show when={selectedImage()}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: theme.colors.textPrimary, marginBottom: '4px' }}>
                      {selectedImage()?.name}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.colors.textMuted }}>
                      {(selectedImage()!.size / 1024).toFixed(1)} KB
                    </div>
                  </Show>
                  <Show when={!selectedImage() && editingProduct() && editingProduct()!.imageUrl}>
                    <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>
                      Текущее изображение
                    </div>
                  </Show>
                </div>
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    setProdForm({ ...prodForm(), imageUrl: '' });
                  }}
                  style={{
                    flexShrink: 0,
                    background: theme.colors.error,
                    color: 'white',
                    border: 'none',
                    borderRadius: theme.radius.sm,
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  title="Удалить изображение"
                >
                  🗑️
                </button>
              </div>
            </Show>
            <Show when={isUploadingImage()}>
              <div style={{ marginTop: '8px', fontSize: '12px', color: theme.colors.primary }}>
                ⏳ Загрузка изображения...
              </div>
            </Show>
          </div>
          
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
        onClose={() => {
          setShowModal(null);
          setEditingModifier(null);
          setModForm({ name: '', type: 'single', required: false, minSelect: 0, maxSelect: 1 });
          setModifierOptions([]);
          setSelectedProducts([]);
          setProductSelectValue('');
        }}
        title={editingModifier() ? 'Редактировать группу модификаторов' : 'Новая группа модификаторов'}
        size="lg"
        maxHeight="85vh"
        footer={
          <div style={styles.modalFooter}>
            <Button variant="ghost" onClick={() => {
              setShowModal(null);
              setEditingModifier(null);
              setModForm({ name: '', type: 'single', required: false, minSelect: 0, maxSelect: 1 });
              setModifierOptions([]);
              setSelectedProducts([]);
              setProductSelectValue('');
            }}>Отмена</Button>
            <Button onClick={submitModifier} disabled={!modForm().name}>
              {editingModifier() ? 'Сохранить' : 'Создать'}
            </Button>
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

          {/* Опции модификатора */}
          <div style={{ marginTop: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <label style={{ fontWeight: 600, fontSize: '14px' }}>Опции модификатора</label>
              <Button icon="➕" onClick={addModifierOption} variant="ghost" size="sm">Добавить опцию</Button>
            </div>
            <For each={modifierOptions()}>
              {(option, index) => (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                  <Input
                    placeholder="Название опции"
                    value={option.name}
                    onInput={(v) => updateModifierOption(index(), 'name', v)}
                    style={{ flex: 1 }}
                  />
                  <Input
                    type="number"
                    placeholder="Цена"
                    value={option.price}
                    onInput={(v) => updateModifierOption(index(), 'price', Number(v) || 0)}
                    style={{ width: '100px' }}
                  />
                  <label style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={option.isDefault}
                      onChange={(e) => updateModifierOption(index(), 'isDefault', e.currentTarget.checked)}
                    />
                    По умолчанию
                  </label>
                  <button
                    style={{ ...styles.actionBtn, padding: '5px 10px' }}
                    onClick={() => removeModifierOption(index())}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </For>
            <Show when={modifierOptions().length === 0}>
              <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                Нет опций. Добавьте хотя бы одну опцию.
              </div>
            </Show>
          </div>

          {/* Выбор товаров */}
          <div style={{ marginTop: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
            <label style={{ fontWeight: 600, fontSize: '14px', display: 'block', marginBottom: '10px' }}>
              Привязка к товарам (опционально)
            </label>
            <p style={{ color: '#666', fontSize: '12px', marginBottom: '12px' }}>
              Выберите товары, для которых доступен этот модификатор. Если ничего не выбрано, модификатор будет доступен для всех товаров.
            </p>
            
            <Select
              label=""
              value={productSelectValue()}
              onChange={(productId) => {
                if (productId && !selectedProducts().includes(productId)) {
                  setSelectedProducts([...selectedProducts(), productId]);
                  setProductSelectValue(''); // Сбрасываем выбор после добавления
                }
              }}
              placeholder="Выберите товар для привязки..."
              options={(props.products || [])
                .filter(p => !selectedProducts().includes(p.id))
                .map(p => ({
                  value: p.id,
                  label: `${p.name}${p.category ? ` (${p.category.name})` : ''} - ${currency(Number(p.price))}`
                }))
              }
            />
            
            <Show when={selectedProducts().length > 0}>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginTop: '12px'
              }}>
                <For each={selectedProducts()}>
                  {(productId) => {
                    const product = props.products?.find(p => p.id === productId);
                    if (!product) return null;
                    return (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 500, fontSize: '14px' }}>{product.name}</span>
                          {product.category && (
                            <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
                              • {product.category.name}
                            </span>
                          )}
                          <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px', fontWeight: 500 }}>
                            {currency(Number(product.price))}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedProducts(selectedProducts().filter(id => id !== productId));
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: '16px',
                            color: '#d32f2f'
                          }}
                          title="Удалить"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Show>
            
            <Show when={!props.products || props.products.length === 0}>
              <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px', marginTop: '12px' }}>
                Нет товаров. Создайте товары сначала.
              </div>
            </Show>
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


