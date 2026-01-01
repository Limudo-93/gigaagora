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
    default: "from-[#fff1e7] via-white to-[#e9f7f5]",
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

      {/* Padrão de notas musicais flutuantes */}
      <div
        className="fixed inset-0 opacity-[0.06] -z-10 music-notes-pattern"
        style={{
          backgroundImage: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ctext x='10' y='50' font-size='50' fill='%23ff6b4a'%3E♪%3C/text%3E%3C/svg%3E"),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ctext x='20' y='60' font-size='40' fill='%232aa6a1'%3E♫%3C/text%3E%3C/svg%3E"),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Ctext x='15' y='80' font-size='55' fill='%23ffb347'%3E♬%3C/text%3E%3C/svg%3E")
        `,
          backgroundSize: "180px 180px, 150px 150px, 200px 200px",
          backgroundPosition: "0 0, 80px 80px, 160px 160px",
        }}
      />

      {/* Padrão de ondas sonoras */}
      <div
        className="fixed inset-0 opacity-[0.04] -z-10"
        style={{
          backgroundImage: `
          url("data:image/svg+xml,%3Csvg width='200' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q25 30, 50 50 T100 50 T150 50 T200 50' stroke='%23ff6b4a' fill='none' stroke-width='2'/%3E%3Cpath d='M0 50 Q25 70, 50 50 T100 50 T150 50 T200 50' stroke='%232aa6a1' fill='none' stroke-width='1.5'/%3E%3C/svg%3E"),
          url("data:image/svg+xml,%3Csvg width='150' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40 Q20 20, 40 40 T80 40 T120 40 T150 40' stroke='%23ffb347' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")
        `,
          backgroundSize: "300px 150px, 250px 120px",
          backgroundPosition: "50px 100px, 200px 300px",
        }}
      />

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
