import { For, Show } from 'solid-js';
import type { Tab } from '../types';
import { theme } from '../styles/theme';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  stats?: {
    locations: number;
    products: number;
    orders: number;
    users: number;
  };
}

const menuItems: Array<{ id: Tab; icon: string; label: string; badge?: boolean }> = [
  { id: 'dashboard', icon: '📊', label: 'Дашборд' },
  { id: 'catalog', icon: '📦', label: 'Каталог' },
  { id: 'locations', icon: '🏪', label: 'Точки' },
  { id: 'orders', icon: '📋', label: 'Заказы', badge: true },
  { id: 'users', icon: '👥', label: 'Клиенты' },
  { id: 'marketing', icon: '📣', label: 'Маркетинг' },
  { id: 'staff', icon: '👨‍💼', label: 'Персонал' },
  { id: 'settings', icon: '⚙️', label: 'Настройки' },
];

export default function Sidebar(props: SidebarProps) {
  return (
    <aside style={{
      width: '240px',
      'min-width': '240px',
      height: '100vh',
      background: theme.colors.bgSidebar,
      'border-right': `1px solid ${theme.colors.bgHover}`,
      display: 'flex',
      'flex-direction': 'column',
      'flex-shrink': '0',
      position: 'sticky',
      top: '0',
      left: '0',
      'z-index': '50',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px',
        display: 'flex',
        'align-items': 'center',
        gap: '12px',
        'border-bottom': `1px solid ${theme.colors.bgHover}`,
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
          'border-radius': '10px',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'font-size': '20px',
          'flex-shrink': '0',
        }}>☕</div>
        <div>
          <div style={{
            'font-size': '16px',
            'font-weight': '700',
            color: theme.colors.textPrimary,
          }}>Coffee Hub</div>
          <div style={{
            'font-size': '11px',
            color: theme.colors.textMuted,
            'text-transform': 'uppercase',
            'letter-spacing': '0.5px',
          }}>Admin Panel</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: '1',
        padding: '16px 12px',
        'overflow-y': 'auto',
      }}>
        <div style={{
          padding: '0 8px 12px',
          'font-size': '10px',
          'font-weight': '600',
          color: theme.colors.textMuted,
          'letter-spacing': '1px',
          'text-transform': 'uppercase',
        }}>Меню</div>
        
        <For each={menuItems}>
          {(item) => (
            <button
              onClick={() => props.onTabChange(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                'align-items': 'center',
                gap: '10px',
                padding: '10px 12px',
                'margin-bottom': '2px',
                background: props.activeTab === item.id 
                  ? `${theme.colors.primary}15` 
                  : 'transparent',
                border: 'none',
                'border-radius': '8px',
                cursor: 'pointer',
                color: props.activeTab === item.id ? theme.colors.primary : theme.colors.textSecondary,
                'font-size': '14px',
                'font-weight': props.activeTab === item.id ? '600' : '500',
                'text-align': 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ 
                'font-size': '16px', 
                width: '24px', 
                'text-align': 'center',
                'flex-shrink': '0',
              }}>{item.icon}</span>
              <span style={{ 
                flex: '1',
              }}>{item.label}</span>
              <Show when={item.badge && props.stats?.orders}>
                <span style={{
                  background: theme.colors.error,
                  color: 'white',
                  'font-size': '10px',
                  'font-weight': '700',
                  padding: '2px 6px',
                  'border-radius': '10px',
                }}>{props.stats?.orders}</span>
              </Show>
            </button>
          )}
        </For>
      </nav>

      {/* Footer Stats */}
      <div style={{
        padding: '16px',
        'border-top': `1px solid ${theme.colors.bgHover}`,
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          'margin-bottom': '12px',
        }}>
          <div style={{ 
            flex: '1', 
            'text-align': 'center',
            padding: '8px',
            background: theme.colors.bgInput,
            'border-radius': '8px',
          }}>
            <div style={{
              'font-size': '18px',
              'font-weight': '700',
              color: theme.colors.primary,
            }}>{props.stats?.locations ?? 0}</div>
            <div style={{
              'font-size': '10px',
              color: theme.colors.textMuted,
              'text-transform': 'uppercase',
            }}>Точек</div>
          </div>
          <div style={{ 
            flex: '1', 
            'text-align': 'center',
            padding: '8px',
            background: theme.colors.bgInput,
            'border-radius': '8px',
          }}>
            <div style={{
              'font-size': '18px',
              'font-weight': '700',
              color: theme.colors.primary,
            }}>{props.stats?.products ?? 0}</div>
            <div style={{
              'font-size': '10px',
              color: theme.colors.textMuted,
              'text-transform': 'uppercase',
            }}>Товаров</div>
          </div>
        </div>
        <div style={{
          'font-size': '10px',
          color: theme.colors.textMuted,
          'text-align': 'center',
        }}>v1.0.0</div>
      </div>
    </aside>
  );
}
