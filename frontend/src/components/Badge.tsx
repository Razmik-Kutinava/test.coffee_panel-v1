import type { JSX } from 'solid-js';
import { theme } from '../styles/theme';

interface BadgeProps {
  children: JSX.Element;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'sm' | 'md';
}

export default function Badge(props: BadgeProps) {
  const variant = props.variant || 'default';
  const size = props.size || 'md';

  const variantStyles: Record<string, any> = {
    default: {
      background: theme.colors.bgHover,
      color: theme.colors.textSecondary,
    },
    success: {
      background: `${theme.colors.success}20`,
      color: theme.colors.success,
    },
    warning: {
      background: `${theme.colors.warning}20`,
      color: theme.colors.warning,
    },
    error: {
      background: `${theme.colors.error}20`,
      color: theme.colors.error,
    },
    info: {
      background: `${theme.colors.info}20`,
      color: theme.colors.info,
    },
    primary: {
      background: `${theme.colors.primary}20`,
      color: theme.colors.primary,
    },
  };

  const sizeStyles: Record<string, any> = {
    sm: { padding: '4px 8px', fontSize: '11px' },
    md: { padding: '6px 12px', fontSize: '12px' },
  };

  return (
    <span
      style={{
        ...styles.base,
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
    >
      {props.children}
    </span>
  );
}

// Status Badge with icon
interface StatusBadgeProps {
  status: string;
  labels: Record<string, string>;
  colors: Record<string, string>;
  icons?: Record<string, string>;
}

export function StatusBadge(props: StatusBadgeProps) {
  const label = props.labels[props.status] || props.status;
  const color = props.colors[props.status] || theme.colors.textMuted;
  const icon = props.icons?.[props.status];

  return (
    <span
      style={{
        ...styles.base,
        background: `${color}15`,
        color: color,
        padding: '6px 12px',
        fontSize: '12px',
      }}
    >
      {icon && <span style={{ marginRight: '6px' }}>{icon}</span>}
      {label}
    </span>
  );
}

const styles: Record<string, any> = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
};

