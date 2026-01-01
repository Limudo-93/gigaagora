"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, MessageCircle, X } from "lucide-react";

type ShareGigButtonProps = {
  gigId: string;
  gigTitle?: string | null;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
};

export default function ShareGigButton({
  gigId,
  gigTitle = null,
  className = "",
  size = "sm",
  variant = "ghost",
}: ShareGigButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Gera o link compartilhável - usando a página de matches para músicos se inscreverem
  // Se o usuário não estiver logado, será redirecionado para login e depois para a gig
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/gigs/${gigId}/matches`
      : `https://chamaomusico.com/dashboard/gigs/${gigId}/matches`;

  // Texto para compartilhar
  const shareText = gigTitle
    ? `🎵 Oportunidade de trabalho: ${gigTitle}\n\nConfira os detalhes e se candidate: ${shareUrl}`
    : `🎵 Oportunidade de trabalho disponível!\n\nConfira os detalhes e se candidate: ${shareUrl}`;

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setShowMenu(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar link:", err);
      // Fallback para navegadores mais antigos
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setShowMenu(false);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error("Erro ao copiar:", e);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleShareWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank");
    setShowMenu(false);
  };

  const handleButtonClick = async () => {
    // Se o navegador suporta compartilhamento nativo, usa ele
    if (navigator.share) {
      try {
        await navigator.share({
          title: gigTitle || "Oportunidade de Trabalho",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // Usuário cancelou ou erro - mostra menu como fallback
        setShowMenu(!showMenu);
      }
    } else {
      // Se não suporta, mostra o menu
      setShowMenu(!showMenu);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant={variant}
        size={size}
        className={`${className} text-gray-600 hover:bg-orange-50 hover:text-orange-600`}
        onClick={handleButtonClick}
        title="Compartilhar gig"
      >
        <Share2 className="mr-2 h-4 w-4" />
        Compartilhar
      </Button>

      {/* Menu dropdown de compartilhamento */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 border border-gray-200">
          <div className="py-1">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">
                Compartilhar via
              </span>
              <button
                onClick={() => setShowMenu(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 transition-colors"
            >
              <MessageCircle className="mr-3 h-4 w-4 text-green-600" />
              WhatsApp
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="mr-3 h-4 w-4 text-green-600" />
                  <span className="text-green-600">Link copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="mr-3 h-4 w-4" />
                  Copiar link
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
