"use client";

import { useEffect, useState } from "react";
import { getTheme, type ThemeName } from "@/lib/theme-data";

export default function ThemedBackground() {
  const [theme, setTheme] = useState<ThemeName>('default');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setTheme('default');
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("theme_preference")
          .eq("user_id", user.id)
          .single();

        setTheme((profile?.theme_preference as ThemeName) || 'default');
      } catch (error) {
        console.error("Error loading theme:", error);
        setTheme('default');
      }
    };

    loadTheme();

    // Escutar mudanças no tema
    const interval = setInterval(() => {
      const root = document.documentElement;
      const themeClass = Array.from(root.classList).find(cls => cls.startsWith('theme-'));
      if (themeClass) {
        const themeName = themeClass.replace('theme-', '') as ThemeName;
        if (themeName !== theme) {
          setTheme(themeName);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [theme]);

  const themeData = getTheme(theme);

  // Mapear cores do tema para classes Tailwind
  const bgGradients: Record<ThemeName, string> = {
    default: 'from-[#fff1e7] via-white to-[#e9f7f5]',
    ocean: 'from-blue-50 via-cyan-50 to-teal-50',
    sunset: 'from-orange-50 via-pink-50 to-rose-50',
    forest: 'from-green-50 via-emerald-50 to-amber-50',
    royal: 'from-purple-50 via-amber-50 to-yellow-50',
    dark: 'from-gray-900 via-gray-800 to-gray-900',
  };

  const radialGradients: Record<ThemeName, { color1: string; color2: string; color3: string }> = {
    default: { color1: 'rgba(255, 179, 71, 0.18)', color2: 'rgba(42, 166, 161, 0.15)', color3: 'rgba(255, 107, 74, 0.12)' },
    ocean: { color1: 'rgba(59,130,246,0.1)', color2: 'rgba(6,182,212,0.1)', color3: 'rgba(20,184,166,0.1)' },
    sunset: { color1: 'rgba(249,115,22,0.1)', color2: 'rgba(236,72,153,0.1)', color3: 'rgba(244,63,94,0.1)' },
    forest: { color1: 'rgba(22,163,74,0.1)', color2: 'rgba(16,185,129,0.1)', color3: 'rgba(217,119,6,0.1)' },
    royal: { color1: 'rgba(147,51,234,0.1)', color2: 'rgba(245,158,11,0.1)', color3: 'rgba(234,179,8,0.1)' },
    dark: { color1: 'rgba(255, 107, 74, 0.2)', color2: 'rgba(255, 179, 71, 0.18)', color3: 'rgba(42, 166, 161, 0.18)' },
  };

  const gradients = radialGradients[theme];

  return (
    <>
      {/* Background gradient principal */}
      <div className={`fixed inset-0 bg-gradient-to-br ${bgGradients[theme]} -z-10`} />
      
      {/* Gradientes radiais decorativos */}
      <div 
        className="fixed inset-0 -z-10" 
        style={{
          background: `
            radial-gradient(circle at 50% 50%, ${gradients.color1}, transparent 50%),
            radial-gradient(circle at 80% 20%, ${gradients.color2}, transparent 50%),
            radial-gradient(circle at 20% 80%, ${gradients.color3}, transparent 50%)
          `
        }}
      />
      
      {/* Padrão de ondas musicais sutil */}
      <div className="fixed inset-0 opacity-[0.03] -z-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q25 30, 50 50 T100 50' stroke='%23000' fill='none' stroke-width='2'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px'
      }} />
    </>
  );
}

