import { theme } from '../styles/theme';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  change?: number;
  color?: string;
}

export default function StatCard(props: StatCardProps) {
  const isPositive = (props.change ?? 0) >= 0;
  
  return (
    <div style={styles.card}>
      <div style={{ ...styles.iconWrapper, background: `${props.color || theme.colors.primary}15` }}>
        <span style={styles.icon}>{props.icon}</span>
      </div>
      <div style={styles.content}>
        <div style={styles.value}>{props.value}</div>
        <div style={styles.labelRow}>
          <span style={styles.label}>{props.label}</span>
          {props.change !== undefined && (
            <span style={{ 
              ...styles.change, 
              color: isPositive ? theme.colors.success : theme.colors.error 
            }}>
              {isPositive ? '↑' : '↓'} {Math.abs(props.change)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Mini Stat for dashboard
interface MiniStatProps {
  icon: string;
  value: number;
  label: string;
  color: string;
}

export function MiniStat(props: MiniStatProps) {
  return (
    <div style={miniStyles.card}>
      <div style={{ ...miniStyles.icon, background: `${props.color}15`, color: props.color }}>
        {props.icon}
      </div>
      <div style={miniStyles.value}>{props.value}</div>
      <div style={miniStyles.label}>{props.label}</div>
    </div>
  );
}

const styles: Record<string, any> = {
  card: {
    background: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.bgHover}`,
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: theme.transition.fast,
  },
  iconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: theme.radius.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '24px',
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: '28px',
    fontWeight: 700,
    color: theme.colors.textPrimary,
    lineHeight: 1.2,
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
  },
  label: {
    fontSize: '13px',
    color: theme.colors.textSecondary,
  },
  change: {
    fontSize: '12px',
    fontWeight: 600,
  },
};

const miniStyles: Record<string, any> = {
  card: {
    background: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: '16px',
    textAlign: 'center',
    border: `1px solid ${theme.colors.bgHover}`,
  },
  icon: {
    width: '40px',
    height: '40px',
    borderRadius: theme.radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    margin: '0 auto 10px',
  },
  value: {
    fontSize: '24px',
    fontWeight: 700,
    color: theme.colors.textPrimary,
  },
  label: {
    fontSize: '11px',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    marginTop: '4px',
  },
};

