import { Show } from 'solid-js';
import { theme } from '../styles/theme';

interface ToastProps {
  toast: { type: 'ok' | 'err'; text: string } | null;
}

export default function Toast(props: ToastProps) {
  return (
    <Show when={props.toast}>
      <div
        style={{
          ...styles.toast,
          ...(props.toast!.type === 'ok' ? styles.toastSuccess : styles.toastError),
        }}
      >
        <span style={styles.icon}>
          {props.toast!.type === 'ok' ? '✓' : '✕'}
        </span>
        <span>{props.toast!.text}</span>
      </div>
    </Show>
  );
}

const styles: Record<string, any> = {
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    padding: '16px 24px',
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadows.lg,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    fontWeight: 500,
    zIndex: 10000,
    animation: 'slideIn 0.3s ease-out',
    maxWidth: '400px',
    backdropFilter: 'blur(10px)',
  },
  toastSuccess: {
    background: `${theme.colors.success}15`,
    color: theme.colors.success,
    border: `1px solid ${theme.colors.success}40`,
  },
  toastError: {
    background: `${theme.colors.error}15`,
    color: theme.colors.error,
    border: `1px solid ${theme.colors.error}40`,
  },
  icon: {
    fontSize: '18px',
    fontWeight: 700,
  },
};

