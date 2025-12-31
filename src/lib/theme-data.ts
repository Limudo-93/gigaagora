export type ThemeName = "default" | "ocean" | "sunset" | "forest" | "royal" | "dark";

export interface Theme {
  name: ThemeName;
  label: string;
  description: string;
  isDark?: boolean;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
  gradient: string;
  preview: {
    bg: string;
    primary: string;
    secondary: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  default: {
    name: "default",
    label: "Festival",
    description: "Coral, Mel e Verde Agua",
    colors: {
      background: "28 100% 98%",
      foreground: "220 25% 14%",
      card: "0 0% 100%",
      cardForeground: "220 25% 14%",
      popover: "0 0% 100%",
      popoverForeground: "220 25% 14%",
      primary: "16 88% 56%",
      primaryForeground: "0 0% 100%",
      secondary: "34 100% 94%",
      secondaryForeground: "24 20% 20%",
      muted: "30 40% 94%",
      mutedForeground: "24 12% 38%",
      accent: "176 55% 38%",
      accentForeground: "0 0% 100%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 100%",
      border: "28 30% 86%",
      input: "28 30% 86%",
      ring: "16 88% 56%",
    },
    gradient: "linear-gradient(135deg, #ff6b4a 0%, #ffb347 45%, #2aa6a1 100%)",
    preview: {
      bg: "bg-gradient-to-br from-orange-50 via-amber-50 to-teal-50",
      primary: "bg-gradient-to-r from-orange-500 to-amber-400",
      secondary: "bg-gradient-to-r from-amber-400 to-teal-500",
    },
  },
  ocean: {
    name: "ocean",
    label: "Oceano",
    description: "Azul e Verde Agua",
    colors: {
      background: "0 0% 100%",
      foreground: "222.2 84% 4.9%",
      card: "0 0% 100%",
      cardForeground: "222.2 84% 4.9%",
      popover: "0 0% 100%",
      popoverForeground: "222.2 84% 4.9%",
      primary: "217.2 91.2% 59.8%",
      primaryForeground: "0 0% 100%",
      secondary: "188.7 85.7% 53.3%",
      secondaryForeground: "0 0% 100%",
      muted: "186.2 93.1% 95.1%",
      mutedForeground: "215.4 16.3% 46.9%",
      accent: "173.4 80.4% 40%",
      accentForeground: "0 0% 100%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 100%",
      border: "214.3 31.8% 91.4%",
      input: "214.3 31.8% 91.4%",
      ring: "217.2 91.2% 59.8%",
    },
    gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #14b8a6 100%)",
    preview: {
      bg: "bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50",
      primary: "bg-gradient-to-r from-blue-500 to-cyan-500",
      secondary: "bg-gradient-to-r from-cyan-500 to-teal-500",
    },
  },
  sunset: {
    name: "sunset",
    label: "Por do Sol",
    description: "Laranja e Rosa",
    colors: {
      background: "0 0% 100%",
      foreground: "222.2 84% 4.9%",
      card: "0 0% 100%",
      cardForeground: "222.2 84% 4.9%",
      popover: "0 0% 100%",
      popoverForeground: "222.2 84% 4.9%",
      primary: "24.6 95% 53.1%",
      primaryForeground: "0 0% 100%",
      secondary: "330.4 81.2% 60.4%",
      secondaryForeground: "0 0% 100%",
      muted: "340.5 82.1% 95.1%",
      mutedForeground: "215.4 16.3% 46.9%",
      accent: "346.8 77.2% 49.8%",
      accentForeground: "0 0% 100%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 100%",
      border: "214.3 31.8% 91.4%",
      input: "214.3 31.8% 91.4%",
      ring: "24.6 95% 53.1%",
    },
    gradient: "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #f43f5e 100%)",
    preview: {
      bg: "bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50",
      primary: "bg-gradient-to-r from-orange-500 to-pink-500",
      secondary: "bg-gradient-to-r from-pink-500 to-rose-500",
    },
  },
  forest: {
    name: "forest",
    label: "Floresta",
    description: "Verde e Marrom",
    colors: {
      background: "0 0% 100%",
      foreground: "222.2 84% 4.9%",
      card: "0 0% 100%",
      cardForeground: "222.2 84% 4.9%",
      popover: "0 0% 100%",
      popoverForeground: "222.2 84% 4.9%",
      primary: "142.1 76.2% 36.3%",
      primaryForeground: "0 0% 100%",
      secondary: "158.1 64.4% 51.6%",
      secondaryForeground: "0 0% 100%",
      muted: "141.5 84.2% 92.5%",
      mutedForeground: "215.4 16.3% 46.9%",
      accent: "43.3 96.4% 56.3%",
      accentForeground: "0 0% 100%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 100%",
      border: "214.3 31.8% 91.4%",
      input: "214.3 31.8% 91.4%",
      ring: "142.1 76.2% 36.3%",
    },
    gradient: "linear-gradient(135deg, #16a34a 0%, #10b981 50%, #d97706 100%)",
    preview: {
      bg: "bg-gradient-to-br from-green-50 via-emerald-50 to-amber-50",
      primary: "bg-gradient-to-r from-green-600 to-emerald-600",
      secondary: "bg-gradient-to-r from-emerald-600 to-amber-600",
    },
  },
  royal: {
    name: "royal",
    label: "Real",
    description: "Roxo e Dourado",
    colors: {
      background: "0 0% 100%",
      foreground: "222.2 84% 4.9%",
      card: "0 0% 100%",
      cardForeground: "222.2 84% 4.9%",
      popover: "0 0% 100%",
      popoverForeground: "222.2 84% 4.9%",
      primary: "258.3 89.5% 66.3%",
      primaryForeground: "0 0% 100%",
      secondary: "43.3 96.4% 56.3%",
      secondaryForeground: "0 0% 100%",
      muted: "48.3 96.6% 95.1%",
      mutedForeground: "215.4 16.3% 46.9%",
      accent: "45.4 93.4% 47.5%",
      accentForeground: "0 0% 100%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 100%",
      border: "214.3 31.8% 91.4%",
      input: "214.3 31.8% 91.4%",
      ring: "258.3 89.5% 66.3%",
    },
    gradient: "linear-gradient(135deg, #9333ea 0%, #f59e0b 50%, #eab308 100%)",
    preview: {
      bg: "bg-gradient-to-br from-purple-50 via-amber-50 to-yellow-50",
      primary: "bg-gradient-to-r from-purple-600 to-amber-500",
      secondary: "bg-gradient-to-r from-amber-500 to-yellow-500",
    },
  },
  dark: {
    name: "dark",
    label: "Escuro",
    description: "Tema Escuro Moderno",
    isDark: true,
    colors: {
      background: "222.2 84% 4.9%",
      foreground: "210 40% 98%",
      card: "222.2 84% 4.9%",
      cardForeground: "210 40% 98%",
      popover: "222.2 84% 4.9%",
      popoverForeground: "210 40% 98%",
      primary: "24.6 95% 53.1%",
      primaryForeground: "0 0% 100%",
      secondary: "217.2 32.6% 17.5%",
      secondaryForeground: "210 40% 98%",
      muted: "217.2 32.6% 17.5%",
      mutedForeground: "215 20.2% 65.1%",
      accent: "262.1 83.3% 57.8%",
      accentForeground: "0 0% 100%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "0 0% 100%",
      border: "217.2 32.6% 17.5%",
      input: "217.2 32.6% 17.5%",
      ring: "24.6 95% 53.1%",
    },
    gradient: "linear-gradient(135deg, #ff6b4a 0%, #ffb347 45%, #2aa6a1 100%)",
    preview: {
      bg: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
      primary: "bg-gradient-to-r from-orange-500 to-amber-400",
      secondary: "bg-gradient-to-r from-amber-400 to-teal-500",
    },
  },
};

export function getTheme(themeName: ThemeName | null | undefined): Theme {
  if (!themeName || !themes[themeName]) {
    return themes.default;
  }
  return themes[themeName];
}
