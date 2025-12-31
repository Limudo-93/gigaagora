"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, MoreVertical, Share2, Smartphone, X } from "lucide-react";

const STORAGE_KEY = "pwa_install_dismissed_v1";

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
};

export default function PwaInstallGuideCard() {
  const [isHidden, setIsHidden] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY) === "1";
    if (dismissed || isStandalone()) {
      setIsHidden(true);
      return;
    }

    setIsHidden(false);
    const ua = navigator.userAgent || "";
    if (/iphone|ipad|ipod/i.test(ua)) {
      setPlatform("ios");
    } else if (/android/i.test(ua)) {
      setPlatform("android");
    }
  }, []);

  const dismissCard = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIsHidden(true);
    setIsOpen(false);
  };

  if (isHidden) return null;

  return (
    <>
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-white via-orange-50 to-purple-50 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground">
                Instale o Chama o Músico no seu celular
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Fica mais rápido de abrir e recebe notificações direto na tela.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={dismissCard}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-foreground/80">
            {platform === "ios" && "No iPhone: use o botão de compartilhar do Safari."}
            {platform === "android" && "No Android: instale pelo menu do Chrome."}
            {platform === "other" && "Funciona em iOS e Android. Leva menos de 1 minuto."}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={() => setIsOpen(true)}>
              Ver passo a passo
            </Button>
            <Button type="button" variant="outline" onClick={dismissCard}>
              Agora não
            </Button>
          </div>
        </CardContent>
      </Card>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Como instalar o app
                </h3>
                <p className="text-xs text-gray-500">
                  Siga os passos abaixo no seu celular
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-5 px-5 py-4 text-sm text-gray-700">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Share2 className="h-4 w-4 text-orange-500" />
                  iPhone (Safari)
                </div>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-600">
                  <li>Abra o site no Safari.</li>
                  <li>Toque em <strong>Compartilhar</strong> (quadrado com seta).</li>
                  <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
                  <li>Confirme em <strong>Adicionar</strong>.</li>
                  <li>Abra o app pela nova imagem na sua tela.</li>
                </ol>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <MoreVertical className="h-4 w-4 text-purple-500" />
                  Android (Chrome)
                </div>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-600">
                  <li>Abra o site no Chrome.</li>
                  <li>Toque no menu <strong>⋮</strong> (canto superior).</li>
                  <li>Selecione <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
                  <li>Confirme a instalação.</li>
                  <li>Abra pelo ícone criado no seu celular.</li>
                </ol>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">
                <div className="flex items-center gap-2 font-semibold">
                  <Download className="h-4 w-4" />
                  Dica rápida
                </div>
                <p className="mt-2">
                  Depois de instalar, o app abre mais rápido e fica separado do navegador.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Fechar
              </Button>
              <Button type="button" onClick={dismissCard}>
                Já instalei
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
