import { createSignal, createMemo, onMount, Show } from 'solid-js';
import { injectThemeCSS, theme } from './styles/theme';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

// Pages
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import Locations from './pages/Locations';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Marketing from './pages/Marketing';
import Staff from './pages/Staff';
import Barista from './pages/Barista';
import TVBoard from './pages/TVBoard';

// Hooks
import { 
  useLocations, useProducts, useOrders, usePromocodes, 
  useCategories, useModifierGroups, useUsers, useBroadcasts, useToast 
} from './hooks/useApi';

import type { Tab } from './types';

export default function App() {
  // Inject theme CSS
  onMount(() => {
    const style = document.createElement('style');
    style.textContent = injectThemeCSS();
    document.head.appendChild(style);
  });

  // State
  const [activeTab, setActiveTab] = createSignal<Tab>('dashboard');
  const { toast, showToast } = useToast();

  // Data
  const { locations, refetch: refetchLocations } = useLocations();
  const { products, refetch: refetchProducts } = useProducts();
  const { orders, refetch: refetchOrders } = useOrders();
  const { promocodes, refetch: refetchPromocodes } = usePromocodes();
  const { categories, refetch: refetchCategories } = useCategories();
  const { groups: modifierGroups, refetch: refetchModifiers } = useModifierGroups();
  const { users, refetch: refetchUsers } = useUsers();
  const { broadcasts, refetch: refetchBroadcasts } = useBroadcasts();

  // Combined refetch
  const refetchAll = () => {
    refetchLocations();
    refetchProducts();
    refetchOrders();
    refetchPromocodes();
    refetchCategories();
    refetchModifiers();
    refetchUsers();
    refetchBroadcasts();
  };

  // Stats for sidebar
  const sidebarStats = createMemo(() => ({
    locations: Array.isArray(locations()) ? locations()!.length : 0,
    products: Array.isArray(products()) ? products()!.length : 0,
    orders: Array.isArray(orders()) ? orders()!.filter((o: any) => 
      ['paid', 'accepted', 'preparing', 'ready'].includes(o.status)
    ).length : 0,
    users: Array.isArray(users()) ? users()!.length : 0,
  }));

  // Ensure arrays
  const locationsArr = () => Array.isArray(locations()) ? locations()! : [];
  const productsArr = () => Array.isArray(products()) ? products()! : [];
  const ordersArr = () => Array.isArray(orders()) ? orders()! : [];
  const promocodesArr = () => Array.isArray(promocodes()) ? promocodes()! : [];
  const categoriesArr = () => Array.isArray(categories()) ? categories()! : [];
  const modifiersArr = () => Array.isArray(modifierGroups()) ? modifierGroups()! : [];
  const usersArr = () => Array.isArray(users()) ? users()! : [];
  const broadcastsArr = () => Array.isArray(broadcasts()) ? broadcasts()! : [];

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      'min-height': '100vh',
      background: theme.colors.bgDark,
    }}>
      {/* Toast */}
      <Toast toast={toast()} />

      {/* Sidebar - Fixed */}
      <Sidebar 
        activeTab={activeTab()} 
        onTabChange={setActiveTab}
        stats={sidebarStats()}
      />

      {/* Main Content - Scrollable */}
      <main style={{
        flex: '1',
        'min-width': '0',
        'min-height': '100vh',
        'max-height': '100vh',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
        background: theme.colors.bgDark,
      }}>
        <Show when={activeTab() === 'dashboard'}>
          <Dashboard
            locations={locationsArr()}
            products={productsArr()}
            orders={ordersArr()}
            users={usersArr()}
          />
        </Show>

        <Show when={activeTab() === 'catalog'}>
          <Catalog
            categories={categoriesArr()}
            products={productsArr()}
            modifierGroups={modifiersArr()}
            onRefresh={() => {
              refetchCategories();
              refetchProducts();
              refetchModifiers();
            }}
            showToast={showToast}
          />
        </Show>

        <Show when={activeTab() === 'locations'}>
          <Locations
            locations={locationsArr()}
            onRefresh={refetchLocations}
            showToast={showToast}
          />
        </Show>

        <Show when={activeTab() === 'orders'}>
          <Orders
            orders={ordersArr()}
            locations={locationsArr()}
            onRefresh={refetchOrders}
            showToast={showToast}
          />
        </Show>

        <Show when={activeTab() === 'users'}>
          <Users
            users={usersArr()}
            onRefresh={refetchUsers}
            showToast={showToast}
          />
        </Show>

        <Show when={activeTab() === 'marketing'}>
          <Marketing
            promocodes={promocodesArr()}
            broadcasts={broadcastsArr()}
            locations={locationsArr()}
            onRefresh={() => {
              refetchPromocodes();
              refetchBroadcasts();
            }}
            showToast={showToast}
          />
        </Show>

        <Show when={activeTab() === 'staff'}>
          <Staff
            users={usersArr()}
            locations={locationsArr()}
            onRefresh={refetchUsers}
            showToast={showToast}
          />
        </Show>

        <Show when={activeTab() === 'barista'}>
          <Barista
            locations={locationsArr()}
            showToast={showToast}
          />
        </Show>

        <Show when={activeTab() === 'tvboard'}>
          <TVBoard
            locations={locationsArr()}
          />
        </Show>

        <Show when={activeTab() === 'settings'}>
          <div style={{
            padding: '32px',
          }}>
            <h1 style={{
              margin: '0 0 8px 0',
              'font-size': '24px',
              'font-weight': '700',
              color: theme.colors.textPrimary,
            }}>⚙️ Настройки</h1>
            <p style={{
              margin: '0 0 32px 0',
              'font-size': '14px',
              color: theme.colors.textSecondary,
            }}>Раздел находится в разработке</p>
            <div style={{
              display: 'grid',
              'grid-template-columns': 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px',
            }}>
              {[
                { icon: '🤖', title: 'Telegram Bot', desc: 'Настройки бота' },
                { icon: '💳', title: 'Оплата', desc: 'Провайдеры платежей' },
                { icon: '📄', title: 'Документы', desc: 'Юридические документы' },
                { icon: '🎨', title: 'Дизайн', desc: 'Кастомизация' },
              ].map(item => (
                <div style={{
                  background: theme.colors.bgCard,
                  'border-radius': '12px',
                  border: `1px solid ${theme.colors.bgHover}`,
                  padding: '20px',
                  cursor: 'pointer',
                }}>
                  <span style={{ 'font-size': '28px', display: 'block', 'margin-bottom': '10px' }}>{item.icon}</span>
                  <h3 style={{ margin: '0 0 4px 0', 'font-size': '15px', 'font-weight': '600', color: theme.colors.textPrimary }}>{item.title}</h3>
                  <p style={{ margin: '0', 'font-size': '12px', color: theme.colors.textMuted }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Show>
      </main>
    </div>
  );
}
