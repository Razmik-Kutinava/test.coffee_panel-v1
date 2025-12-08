import type { JSX } from 'solid-js';
import { theme } from '../styles/theme';

interface ButtonProps {
  children: JSX.Element;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: string;
  type?: 'button' | 'submit';
}

export default function Button(props: ButtonProps) {
  const variant = props.variant || 'primary';
  const size = props.size || 'md';

  const variantStyles: Record<string, any> = {
    primary: {
      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
      color: '#0D0D0D',
      border: 'none',
      boxShadow: theme.shadows.glow,
    },
    secondary: {
      background: theme.colors.bgHover,
      color: theme.colors.textPrimary,
      border: `1px solid ${theme.colors.bgHover}`,
    },
    success: {
      background: theme.colors.success,
      color: 'white',
      border: 'none',
    },
    danger: {
      background: `${theme.colors.error}20`,
      color: theme.colors.error,
      border: `1px solid ${theme.colors.error}40`,
    },
    ghost: {
      background: 'transparent',
      color: theme.colors.textSecondary,
      border: '1px solid transparent',
    },
  };

  const sizeStyles: Record<string, any> = {
    sm: { padding: '8px 14px', fontSize: '13px', gap: '6px' },
    md: { padding: '12px 20px', fontSize: '14px', gap: '8px' },
    lg: { padding: '16px 28px', fontSize: '15px', gap: '10px' },
  };

  return (
    <button
      type={props.type || 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        ...styles.base,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...(props.fullWidth ? { width: '100%' } : {}),
        ...(props.disabled ? styles.disabled : {}),
      }}
    >
      {props.icon && <span>{props.icon}</span>}
      {props.children}
    </button>
  );
}

const styles: Record<string, any> = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    fontWeight: 600,
    cursor: 'pointer',
    transition: theme.transition.fast,
    fontFamily: theme.fonts.primary,
    outline: 'none',
    flexShrink: 0,
    height: 'fit-content',
    whiteSpace: 'nowrap',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
};

