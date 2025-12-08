import { Show, type JSX } from 'solid-js';
import { theme } from '../styles/theme';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
  footer?: JSX.Element;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal(props: ModalProps) {
  const size = props.size || 'md';
  
  const sizeWidths: Record<string, string> = {
    sm: '400px',
    md: '560px',
    lg: '720px',
  };

  return (
    <Show when={props.isOpen}>
      <div style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'rgba(0, 0, 0, 0.75)',
        'backdrop-filter': 'blur(4px)',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        padding: '24px',
        'z-index': '99999',
      }} onClick={props.onClose}>
        <div
          style={{
            width: '100%',
            'max-width': sizeWidths[size],
            background: theme.colors.bgCard,
            'border-radius': '20px',
            border: `1px solid ${theme.colors.bgHover}`,
            'box-shadow': '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            padding: '20px 24px',
            'border-bottom': `1px solid ${theme.colors.bgHover}`,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
          }}>
            <h2 style={{
              margin: '0',
              'font-size': '18px',
              'font-weight': '600',
              color: theme.colors.textPrimary,
            }}>{props.title}</h2>
            <button 
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.textMuted,
                'font-size': '20px',
                cursor: 'pointer',
                padding: '4px 8px',
                'line-height': '1',
                'border-radius': '6px',
              }}
              onClick={props.onClose}
            >
              ✕
            </button>
          </div>
          <div style={{
            padding: '24px',
            'max-height': '60vh',
            'overflow-y': 'auto',
          }}>
            {props.children}
          </div>
          <Show when={props.footer}>
            <div style={{
              padding: '16px 24px',
              'border-top': `1px solid ${theme.colors.bgHover}`,
            }}>
              {props.footer}
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}

// Confirm Dialog
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.title}
      size="sm"
      footer={
        <div style={{
          display: 'flex',
          'justify-content': 'flex-end',
          gap: '12px',
        }}>
          <Button variant="ghost" onClick={props.onClose}>
            {props.cancelText || 'Отмена'}
          </Button>
          <Button
            variant={props.variant || 'danger'}
            onClick={() => {
              props.onConfirm();
              props.onClose();
            }}
          >
            {props.confirmText || 'Подтвердить'}
          </Button>
        </div>
      }
    >
      <p style={{
        margin: '0',
        'font-size': '14px',
        color: theme.colors.textSecondary,
        'line-height': '1.6',
      }}>{props.message}</p>
    </Modal>
  );
}
