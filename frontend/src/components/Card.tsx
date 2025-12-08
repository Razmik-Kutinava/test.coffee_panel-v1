import type { JSX } from 'solid-js';
import { theme } from '../styles/theme';

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  action?: JSX.Element;
  children: JSX.Element;
  padding?: string;
  noPadding?: boolean;
}

export default function Card(props: CardProps) {
  return (
    <div style={styles.card}>
      {(props.title || props.action) && (
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            {props.icon && <span style={styles.icon}>{props.icon}</span>}
            <div>
              {props.title && <h3 style={styles.title}>{props.title}</h3>}
              {props.subtitle && <p style={styles.subtitle}>{props.subtitle}</p>}
            </div>
          </div>
          {props.action && <div style={styles.action}>{props.action}</div>}
        </div>
      )}
      <div style={{ padding: props.noPadding ? '0' : (props.padding || '20px') }}>
        {props.children}
      </div>
    </div>
  );
}

const styles: Record<string, any> = {
  card: {
    background: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.bgHover}`,
    overflow: 'hidden',
  },
  header: {
    padding: '20px',
    borderBottom: `1px solid ${theme.colors.bgHover}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  icon: {
    fontSize: '24px',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: theme.colors.textSecondary,
  },
  action: {},
};

