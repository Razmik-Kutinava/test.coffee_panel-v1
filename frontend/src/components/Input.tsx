import { theme } from '../styles/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string | number;
  onInput: (value: string) => void;
  type?: 'text' | 'number' | 'email' | 'password' | 'tel';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  icon?: string;
  min?: number;
  max?: number;
  step?: number;
}

export default function Input(props: InputProps) {
  return (
    <div style={styles.wrapper}>
      {props.label && (
        <label style={styles.label}>
          {props.label}
          {props.required && <span style={styles.required}>*</span>}
        </label>
      )}
      <div style={styles.inputWrapper}>
        {props.icon && <span style={styles.icon}>{props.icon}</span>}
        <input
          type={props.type || 'text'}
          placeholder={props.placeholder}
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          required={props.required}
          disabled={props.disabled}
          min={props.min}
          max={props.max}
          step={props.step}
          style={{
            ...styles.input,
            ...(props.icon ? { paddingLeft: '44px' } : {}),
            ...(props.error ? styles.inputError : {}),
            ...(props.disabled ? styles.inputDisabled : {}),
          }}
        />
      </div>
      {props.error && <span style={styles.errorText}>{props.error}</span>}
      {props.hint && !props.error && <span style={styles.hint}>{props.hint}</span>}
    </div>
  );
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function Select(props: SelectProps) {
  return (
    <div style={styles.wrapper}>
      {props.label && (
        <label style={styles.label}>
          {props.label}
          {props.required && <span style={styles.required}>*</span>}
        </label>
      )}
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.currentTarget.value)}
        required={props.required}
        disabled={props.disabled}
        style={{
          ...styles.input,
          ...styles.select,
          ...(props.disabled ? styles.inputDisabled : {}),
        }}
      >
        {props.placeholder && <option value="">{props.placeholder}</option>}
        {props.options.map((opt) => (
          <option value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

interface TextareaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onInput: (value: string) => void;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
}

export function Textarea(props: TextareaProps) {
  return (
    <div style={styles.wrapper}>
      {props.label && (
        <label style={styles.label}>
          {props.label}
          {props.required && <span style={styles.required}>*</span>}
        </label>
      )}
      <textarea
        placeholder={props.placeholder}
        value={props.value}
        onInput={(e) => props.onInput(e.currentTarget.value)}
        rows={props.rows || 4}
        required={props.required}
        disabled={props.disabled}
        style={{
          ...styles.input,
          ...styles.textarea,
          ...(props.disabled ? styles.inputDisabled : {}),
        }}
      />
    </div>
  );
}

const styles: Record<string, any> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: theme.colors.textSecondary,
  },
  required: {
    color: theme.colors.error,
    marginLeft: '4px',
  },
  inputWrapper: {
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '16px',
    color: theme.colors.textMuted,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: theme.colors.bgInput,
    border: `2px solid ${theme.colors.bgHover}`,
    borderRadius: theme.radius.md,
    fontSize: '14px',
    color: theme.colors.textPrimary,
    outline: 'none',
    transition: theme.transition.fast,
    fontFamily: theme.fonts.primary,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  select: {
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px',
    paddingRight: '40px',
  },
  textarea: {
    resize: 'vertical',
    minHeight: '100px',
    fontFamily: theme.fonts.primary,
  },
  errorText: {
    fontSize: '12px',
    color: theme.colors.error,
  },
  hint: {
    fontSize: '12px',
    color: theme.colors.textMuted,
  },
};

