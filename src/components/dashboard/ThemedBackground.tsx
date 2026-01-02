"use client";

import { useEffect, useState } from "react";
import { type ThemeName } from "@/lib/theme-data";

export default function ThemedBackground() {
  const [theme, setTheme] = useState<ThemeName>("default");

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setTheme("default");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("theme_preference")
          .eq("user_id", user.id)
          .single();

        setTheme((profile?.theme_preference as ThemeName) || "default");
      } catch (error) {
        console.error("Error loading theme:", error);
        setTheme("default");
      }
    };

    loadTheme();

    // Escutar mudanças no tema
    const interval = setInterval(() => {
      const root = document.documentElement;
      const themeClass = Array.from(root.classList).find((cls) =>
        cls.startsWith("theme-"),
      );
      if (themeClass) {
        const themeName = themeClass.replace("theme-", "") as ThemeName;
        if (themeName !== theme) {
          setTheme(themeName);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [theme]);

  // Mapear cores do tema para classes Tailwind - apenas um gradiente simples
  const bgGradients: Record<ThemeName, string> = {
    default: "from-[#fff6ee] via-[#f8fbff] to-[#eef9f7]",
    ocean: "from-blue-50 via-cyan-50 to-teal-50",
    sunset: "from-orange-50 via-pink-50 to-rose-50",
    forest: "from-green-50 via-emerald-50 to-amber-50",
    royal: "from-purple-50 via-amber-50 to-yellow-50",
    dark: "from-gray-900 via-gray-800 to-gray-900",
  };

  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br ${bgGradients[theme]} -z-10`}
    />
  );
}
