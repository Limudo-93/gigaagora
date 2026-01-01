"use client";

import { useLayoutEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { applyTheme } from "@/lib/theme";
import type { ThemeName } from "@/lib/theme-data";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    const loadUserTheme = async () => {
      try {
        const cachedTheme = localStorage.getItem("theme") as ThemeName | null;
        if (cachedTheme) {
          applyTheme(cachedTheme);
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Se não estiver logado, usar tema padrão
          applyTheme("default");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("theme_preference")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.warn("Error loading theme preference:", profileError);
        }

        const theme = (profile?.theme_preference as ThemeName) || "default";

        // Validar se o tema existe
        const validTheme: ThemeName = [
          "default",
          "ocean",
          "sunset",
          "forest",
          "royal",
          "dark",
        ].includes(theme)
          ? theme
          : "default";

        applyTheme(validTheme);
      } catch (error) {
        console.error("Error loading theme:", error);
        applyTheme("default");
      }
    };

    loadUserTheme();
  }, []);

  return <>{children}</>;
}
