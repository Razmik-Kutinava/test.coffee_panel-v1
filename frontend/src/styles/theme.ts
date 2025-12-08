// ============================================
// COFFEE HUB - Premium Dark Theme
// Inspired by: Craft coffee aesthetics + Modern dashboard design
// ============================================

export const theme = {
  // Primary colors - Rich espresso tones
  colors: {
    primary: '#C19A6B',      // Warm caramel/coffee
    primaryLight: '#D4AF7A',
    primaryDark: '#8B6914',
    secondary: '#2D1810',    // Deep espresso
    accent: '#E8D5B7',       // Cream
    
    // Backgrounds
    bgDark: '#0D0D0D',       // Near black
    bgCard: '#1A1A1A',       // Dark card
    bgHover: '#252525',      // Hover state
    bgSidebar: '#141414',    // Sidebar
    bgInput: '#1F1F1F',      // Input background
    
    // Text
    textPrimary: '#FAFAFA',
    textSecondary: '#A3A3A3',
    textMuted: '#666666',
    
    // Status colors
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Order status specific
    statusPaid: '#3B82F6',
    statusAccepted: '#22C55E',
    statusPreparing: '#F59E0B',
    statusReady: '#8B5CF6',
    statusCompleted: '#10B981',
    statusCancelled: '#EF4444',
  },
  
  // Typography - Using Manrope for modern feel
  fonts: {
    primary: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  
  // Spacing scale
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  // Border radius
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
    glow: '0 0 20px rgba(193, 154, 107, 0.2)',
  },
  
  // Transitions
  transition: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.4s ease',
  },
};

// CSS Variables injection
export const injectThemeCSS = () => `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --color-primary: ${theme.colors.primary};
  --color-primary-light: ${theme.colors.primaryLight};
  --color-primary-dark: ${theme.colors.primaryDark};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-bg-dark: ${theme.colors.bgDark};
  --color-bg-card: ${theme.colors.bgCard};
  --color-bg-hover: ${theme.colors.bgHover};
  --color-bg-sidebar: ${theme.colors.bgSidebar};
  --color-bg-input: ${theme.colors.bgInput};
  --color-text-primary: ${theme.colors.textPrimary};
  --color-text-secondary: ${theme.colors.textSecondary};
  --color-text-muted: ${theme.colors.textMuted};
  --color-success: ${theme.colors.success};
  --color-warning: ${theme.colors.warning};
  --color-error: ${theme.colors.error};
  --color-info: ${theme.colors.info};
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: ${theme.fonts.primary};
  background: ${theme.colors.bgDark};
  color: ${theme.colors.textPrimary};
  line-height: 1.5;
  min-height: 100vh;
  overflow-x: hidden;
}

#root {
  min-height: 100vh;
  display: flex;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: ${theme.colors.bgCard};
}

::-webkit-scrollbar-thumb {
  background: ${theme.colors.textMuted};
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: ${theme.colors.textSecondary};
}

input, select, textarea, button {
  font-family: inherit;
}

select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px !important;
}

button {
  cursor: pointer;
  border: none;
  background: none;
}

button:focus {
  outline: none;
}

table {
  width: 100%;
  border-collapse: collapse;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-fadeIn { animation: fadeIn 0.3s ease-out; }
.animate-slideIn { animation: slideIn 0.3s ease-out; }
.animate-pulse { animation: pulse 2s infinite; }
.animate-spin { animation: spin 1s linear infinite; }

/* Responsive grid fix */
@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .two-column-grid { grid-template-columns: 1fr !important; }
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr !important; }
  .active-orders-grid { grid-template-columns: repeat(2, 1fr) !important; }
}
`;

