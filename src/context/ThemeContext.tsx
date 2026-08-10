import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeConfig, ThemePreset, AccentColor, BorderRadiusPreset, CardStylePreset, FontFamilyPreset, AmbientEffectPreset } from '../types.js';

const DEFAULT_THEME: ThemeConfig = {
  preset: 'dark',
  accentColor: 'blue',
  borderRadius: '2xl',
  cardStyle: 'glass',
  fontFamily: 'sans',
  ambientEffect: 'blobs',
  enableAnimations: true,
  floatingCards: true,
  parallax3DTilt: true,
  spotlightFollow: true,
  glowBorders: true
};

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
  accentClasses: {
    bg: string;
    bgHover: string;
    text: string;
    border: string;
    glow: string;
    ring: string;
    gradient: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem('saas_portfolio_theme_config');
      if (saved) {
        return { ...DEFAULT_THEME, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse theme config', e);
    }
    return DEFAULT_THEME;
  });

  useEffect(() => {
    try {
      localStorage.setItem('saas_portfolio_theme_config', JSON.stringify(theme));
    } catch (e) {
      console.error('Failed to save theme config', e);
    }

    const root = document.documentElement;

    // Remove old preset classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-glassmorphism', 'theme-neon', 'theme-amoled');
    root.classList.add(`theme-${theme.preset}`);

    // Set dataset attributes for target CSS if needed
    root.dataset.preset = theme.preset;
    root.dataset.accent = theme.accentColor;
    root.dataset.cardStyle = theme.cardStyle;
    root.dataset.font = theme.fontFamily;

    // Sync body background according to theme preset
    if (theme.preset === 'light') {
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    } else if (theme.preset === 'amoled') {
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#f8fafc';
    } else if (theme.preset === 'neon') {
      document.body.style.backgroundColor = '#05050e';
      document.body.style.color = '#f8fafc';
    } else if (theme.preset === 'glassmorphism') {
      document.body.style.backgroundColor = '#030712';
      document.body.style.color = '#f9fafb';
    } else {
      document.body.style.backgroundColor = '#020617';
      document.body.style.color = '#f1f5f9';
    }
  }, [theme]);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  const resetTheme = () => {
    setTheme(DEFAULT_THEME);
  };

  // Dynamic Tailwind accent color classes
  const getAccentClasses = (accent: AccentColor) => {
    switch (accent) {
      case 'indigo':
        return {
          bg: 'bg-indigo-600',
          bgHover: 'hover:bg-indigo-500',
          text: 'text-indigo-400',
          border: 'border-indigo-500/40',
          glow: 'shadow-indigo-500/20',
          ring: 'focus:ring-indigo-500',
          gradient: 'from-indigo-600 to-purple-600'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-600',
          bgHover: 'hover:bg-emerald-500',
          text: 'text-emerald-400',
          border: 'border-emerald-500/40',
          glow: 'shadow-emerald-500/20',
          ring: 'focus:ring-emerald-500',
          gradient: 'from-emerald-600 to-teal-600'
        };
      case 'amber':
        return {
          bg: 'bg-amber-600',
          bgHover: 'hover:bg-amber-500',
          text: 'text-amber-400',
          border: 'border-amber-500/40',
          glow: 'shadow-amber-500/20',
          ring: 'focus:ring-amber-500',
          gradient: 'from-amber-500 to-orange-600'
        };
      case 'rose':
        return {
          bg: 'bg-rose-600',
          bgHover: 'hover:bg-rose-500',
          text: 'text-rose-400',
          border: 'border-rose-500/40',
          glow: 'shadow-rose-500/20',
          ring: 'focus:ring-rose-500',
          gradient: 'from-rose-600 to-pink-600'
        };
      case 'violet':
        return {
          bg: 'bg-violet-600',
          bgHover: 'hover:bg-violet-500',
          text: 'text-violet-400',
          border: 'border-violet-500/40',
          glow: 'shadow-violet-500/20',
          ring: 'focus:ring-violet-500',
          gradient: 'from-violet-600 to-fuchsia-600'
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-600',
          bgHover: 'hover:bg-cyan-500',
          text: 'text-cyan-400',
          border: 'border-cyan-500/40',
          glow: 'shadow-cyan-500/20',
          ring: 'focus:ring-cyan-500',
          gradient: 'from-cyan-500 to-blue-600'
        };
      case 'blue':
      default:
        return {
          bg: 'bg-blue-600',
          bgHover: 'hover:bg-blue-500',
          text: 'text-blue-400',
          border: 'border-blue-500/40',
          glow: 'shadow-blue-500/20',
          ring: 'focus:ring-blue-500',
          gradient: 'from-blue-600 to-cyan-600'
        };
    }
  };

  const accentClasses = getAccentClasses(theme.accentColor);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme, accentClasses }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
