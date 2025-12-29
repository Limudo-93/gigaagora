"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Palette } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { themes, type ThemeName, applyTheme, getTheme } from "@/lib/theme";

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("theme_preference")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.warn("Error loading theme preference:", profileError);
      }

      const theme = (profile?.theme_preference as ThemeName) || 'default';
      
      // Validar se o tema existe
      const validTheme: ThemeName = ['default', 'ocean', 'sunset', 'forest', 'royal', 'dark'].includes(theme) 
        ? theme 
        : 'default';
      
      setCurrentTheme(validTheme);
      applyTheme(validTheme);
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (themeName: ThemeName) => {
    if (saving || themeName === currentTheme) return;

    setSaving(true);
    const previousTheme = currentTheme;
    
    try {
      // Aplicar tema imediatamente (antes de salvar)
      applyTheme(themeName);
      setCurrentTheme(themeName);

      // Tentar salvar no banco (mas não reverter se falhar)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({ theme_preference: themeName })
          .eq("user_id", user.id);

        if (error) {
          console.error("Error saving theme preference:", error);
          // Não revertemos o tema - mantém aplicado mesmo se não salvar
          // O usuário pode tentar novamente ou o tema será aplicado na próxima sessão
        }
      }
    } catch (error: any) {
      console.error("Error in handleThemeChange:", error);
      // Não revertemos - mantém o tema aplicado
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border backdrop-blur-xl bg-card/80">
        <CardContent className="p-12 text-center">
          <p className="text-sm text-muted-foreground">Carregando temas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border backdrop-blur-xl bg-card/80">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Personalizar Tema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(themes).map((theme) => {
            const isSelected = currentTheme === theme.name;
            const themeData = getTheme(theme.name);

            return (
              <button
                key={theme.name}
                onClick={() => handleThemeChange(theme.name)}
                disabled={saving}
                className={`relative p-4 rounded-xl border-2 transition-all bg-card ${
                  isSelected
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-border hover:border-primary/50 hover:shadow-md'
                } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg z-50">
                    <Check className="h-4 w-4" />
                  </div>
                )}

                <div className="space-y-3 relative z-10">
                  {/* Preview do tema */}
                  <div className={`h-20 rounded-lg ${themeData.preview.bg} relative overflow-hidden`}>
                    <div className="absolute inset-0 flex items-center justify-center gap-2 p-2">
                      <div className={`h-8 flex-1 rounded ${themeData.preview.primary}`} />
                      <div className={`h-8 flex-1 rounded ${themeData.preview.secondary}`} />
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">{theme.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {saving && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Salvando preferência...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

