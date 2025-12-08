import { For, Show, type JSX } from 'solid-js';
import { theme } from '../styles/theme';

interface Column<T> {
  key: string;
  title: string;
  render?: (item: T) => JSX.Element;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (item: T) => void;
}

export default function Table<T extends { id?: string }>(props: TableProps<T>) {
  return (
    <div style={styles.wrapper}>
      <Show when={props.loading}>
        <div style={styles.loading}>
          <span style={styles.spinner}>◌</span>
          Загрузка...
        </div>
      </Show>
      
      <Show when={!props.loading && props.data.length === 0}>
        <div style={styles.empty}>
          {props.emptyText || 'Нет данных'}
        </div>
      </Show>
      
      <Show when={!props.loading && props.data.length > 0}>
        <table style={styles.table}>
          <thead>
            <tr>
              <For each={props.columns}>
                {(col) => (
                  <th style={{ ...styles.th, width: col.width }}>
                    {col.title}
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={props.data}>
              {(item) => (
                <tr
                  style={styles.tr}
                  onClick={() => props.onRowClick?.(item)}
                >
                  <For each={props.columns}>
                    {(col) => (
                      <td style={styles.td}>
                        {col.render 
                          ? col.render(item) 
                          : (item as any)[col.key]
                        }
                      </td>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
}

const styles: Record<string, any> = {
  wrapper: {
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
    transition: theme.transition.fast,
    cursor: 'pointer',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: theme.colors.textPrimary,
  },
  loading: {
    padding: '60px',
    textAlign: 'center',
    color: theme.colors.textMuted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    fontSize: '20px',
  },
  empty: {
    padding: '60px',
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: '14px',
  },
};

