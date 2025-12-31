"use client";

import { themes, type ThemeName } from "@/lib/theme-data";

export function applyTheme(themeName: ThemeName) {
  const theme = themes[themeName];
  if (!theme) {
    console.warn(`Theme "${themeName}" not found, using default`);
    return;
  }

  const root = document.documentElement;
  
  // Aplicar todas as variáveis CSS de cores
  root.style.setProperty('--background', theme.colors.background);
  root.style.setProperty('--foreground', theme.colors.foreground);
  root.style.setProperty('--card', theme.colors.card);
  root.style.setProperty('--card-foreground', theme.colors.cardForeground);
  root.style.setProperty('--popover', theme.colors.popover);
  root.style.setProperty('--popover-foreground', theme.colors.popoverForeground);
  root.style.setProperty('--primary', theme.colors.primary);
  root.style.setProperty('--primary-foreground', theme.colors.primaryForeground);
  root.style.setProperty('--secondary', theme.colors.secondary);
  root.style.setProperty('--secondary-foreground', theme.colors.secondaryForeground);
  root.style.setProperty('--muted', theme.colors.muted);
  root.style.setProperty('--muted-foreground', theme.colors.mutedForeground);
  root.style.setProperty('--accent', theme.colors.accent);
  root.style.setProperty('--accent-foreground', theme.colors.accentForeground);
  root.style.setProperty('--destructive', theme.colors.destructive);
  root.style.setProperty('--destructive-foreground', theme.colors.destructiveForeground);
  root.style.setProperty('--border', theme.colors.border);
  root.style.setProperty('--input', theme.colors.input);
  root.style.setProperty('--ring', theme.colors.ring);
  
  // Aplicar gradientes como CSS variables
  root.style.setProperty('--theme-gradient', theme.gradient);
  
  // Remover todas as classes de tema anteriores
  root.classList.remove('theme-default', 'theme-ocean', 'theme-sunset', 'theme-forest', 'theme-royal', 'theme-dark');
  
  // Adicionar classe de tema ao html
  root.classList.add(`theme-${themeName}`);
  
  // Adicionar/remover classe dark se for tema escuro
  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem('theme', themeName);
    document.cookie = `theme=${themeName}; path=/; max-age=31536000`;
  } catch {
    // ignore storage errors
  }
}

