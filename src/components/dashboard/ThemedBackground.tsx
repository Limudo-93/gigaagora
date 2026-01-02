"use client";

import { useEffect, useState } from "react";
import { getTheme, type ThemeName } from "@/lib/theme-data";

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

  const themeData = getTheme(theme);

  // Mapear cores do tema para classes Tailwind
  const bgGradients: Record<ThemeName, string> = {
    default: "from-[#fff6ee] via-[#f8fbff] to-[#eef9f7]",
    ocean: "from-blue-50 via-cyan-50 to-teal-50",
    sunset: "from-orange-50 via-pink-50 to-rose-50",
    forest: "from-green-50 via-emerald-50 to-amber-50",
    royal: "from-purple-50 via-amber-50 to-yellow-50",
    dark: "from-gray-900 via-gray-800 to-gray-900",
  };

  const radialGradients: Record<
    ThemeName,
    { color1: string; color2: string; color3: string }
  > = {
    default: {
      color1: "rgba(255, 179, 71, 0.18)",
      color2: "rgba(42, 166, 161, 0.15)",
      color3: "rgba(255, 107, 74, 0.12)",
    },
    ocean: {
      color1: "rgba(59,130,246,0.1)",
      color2: "rgba(6,182,212,0.1)",
      color3: "rgba(20,184,166,0.1)",
    },
    sunset: {
      color1: "rgba(249,115,22,0.1)",
      color2: "rgba(236,72,153,0.1)",
      color3: "rgba(244,63,94,0.1)",
    },
    forest: {
      color1: "rgba(22,163,74,0.1)",
      color2: "rgba(16,185,129,0.1)",
      color3: "rgba(217,119,6,0.1)",
    },
    royal: {
      color1: "rgba(147,51,234,0.1)",
      color2: "rgba(245,158,11,0.1)",
      color3: "rgba(234,179,8,0.1)",
    },
    dark: {
      color1: "rgba(255, 107, 74, 0.2)",
      color2: "rgba(255, 179, 71, 0.18)",
      color3: "rgba(42, 166, 161, 0.18)",
    },
  };

  const gradients = radialGradients[theme];

  return (
    <>
      {/* Background gradient principal */}
      <div
        className={`fixed inset-0 bg-gradient-to-br ${bgGradients[theme]} -z-10`}
      />

      {/* Gradientes radiais decorativos */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, ${gradients.color1}, transparent 50%),
            radial-gradient(circle at 80% 20%, ${gradients.color2}, transparent 50%),
            radial-gradient(circle at 20% 80%, ${gradients.color3}, transparent 50%)
          `,
        }}
      />

      {/* Pauta de partitura */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.18]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              to bottom,
              rgba(0,0,0,0.05) 0px,
              rgba(0,0,0,0.05) 1px,
              transparent 1px,
              transparent 26px
            )
          `,
          backgroundSize: "100% 26px",
        }}
      />

      {/* Notas flutuantes */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div
          className="absolute left-[8%] top-[12%] text-[#ff6b4a]/25 text-3xl music-notes-pattern"
          style={{ animationDuration: "18s" }}
        >
          ♪
        </div>
        <div
          className="absolute left-[70%] top-[18%] text-[#2aa6a1]/25 text-4xl music-notes-pattern"
          style={{ animationDuration: "22s", animationDelay: "2s" }}
        >
          ♫
        </div>
        <div
          className="absolute left-[22%] top-[48%] text-[#ffb347]/25 text-4xl music-notes-pattern"
          style={{ animationDuration: "20s", animationDelay: "1s" }}
        >
          ♬
        </div>
        <div
          className="absolute left-[78%] top-[58%] text-[#ff6b4a]/20 text-3xl music-notes-pattern"
          style={{ animationDuration: "24s", animationDelay: "3s" }}
        >
          ♪
        </div>
        <div
          className="absolute left-[42%] top-[75%] text-[#2aa6a1]/20 text-4xl music-notes-pattern"
          style={{ animationDuration: "26s", animationDelay: "4s" }}
        >
          ♫
        </div>
      </div>

      {/* Elementos musicais decorativos adicionais */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Círculos decorativos com tema musical */}
        <div
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#ff6b4a]/15 to-transparent blur-2xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-32 right-16 w-40 h-40 rounded-full bg-gradient-to-br from-[#2aa6a1]/12 to-transparent blur-3xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-gradient-to-br from-[#ffb347]/18 to-transparent blur-xl animate-pulse"
          style={{ animationDuration: "3.5s", animationDelay: "2s" }}
        />

        {/* Formas geométricas musicais */}
        <div className="absolute top-40 right-1/4 w-20 h-20 rotate-45 rounded-lg bg-gradient-to-br from-[#ff6b4a]/10 to-transparent blur-lg" />
        <div className="absolute bottom-40 left-1/4 w-16 h-16 rotate-12 rounded-lg bg-gradient-to-br from-[#2aa6a1]/12 to-transparent blur-md" />
      </div>
    </>
  );
}
