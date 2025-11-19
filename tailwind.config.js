/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#ffffff',
        'bg-secondary': '#f8fafc',
        'bg-tertiary': '#f1f5f9',
        'accent-primary': '#3b82f6',
        'accent-secondary': '#2563eb',
        'text-primary': '#1e293b',
        'text-secondary': '#64748b',
        'text-tertiary': '#94a3b8',
        'border-color': '#e2e8f0',
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'input': '8px',
        'small': '6px',
      },
    },
  },
  plugins: [],
}
