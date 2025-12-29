"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import LogoutButton from "@/app/dashboard/LogoutButton";

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navLinks = [
    { href: "/dashboard" as any, label: "Dashboard" },
    { href: "/dashboard/gigs" as any, label: "Gigs" },
    { href: "/dashboard/messages" as any, label: "Mensagens" },
    { href: "/dashboard/financeiro" as any, label: "Financeiro" },
    { href: "/dashboard/perfil" as any, label: "Perfil" },
  ];

  // Fechar menu quando a rota mudar
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevenir scroll do body quando menu estiver aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // Buscar contagem de mensagens não lidas
  useEffect(() => {
    let userId: string | null = null;

    const fetchUnreadCount = async () => {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
        if (!userId) return;
      }

      const { data, error } = await supabase
        .from("messages")
        .select("id", { count: "exact" })
        .eq("receiver_id", userId)
        .is("read_at", null);

      if (!error && data) {
        setUnreadCount(data.length || 0);
      }
    };

    fetchUnreadCount();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Escutar novas mensagens em tempo real
    let channel: any = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        userId = user.id;
        channel = supabase
          .channel("unread-messages")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "messages",
              filter: `receiver_id=eq.${user.id}`,
            },
            () => {
              fetchUnreadCount();
            }
          )
          .subscribe();
      }
    });

    return () => {
      clearInterval(interval);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border shadow-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 md:py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/dashboard" 
              className="group transition-transform hover:scale-105 shrink-0"
            >
              <Logo size="md" />
            </Link>

            <div className="flex items-center gap-4">
              {/* Menu Desktop */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || 
                    (link.href !== "/dashboard" && pathname?.startsWith(link.href));
                  const hasNotification = link.href === "/dashboard/messages" && unreadCount > 0;
                  
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "btn-gradient-active shadow-md hover:shadow-lg hover:[filter:brightness(0.85)_saturate(1.2)_contrast(1.1)] active:[filter:brightness(0.8)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                      style={isActive ? { 
                        background: "var(--theme-gradient, linear-gradient(135deg, #f97316 0%, #a855f7 50%, #3b82f6 100%))",
                        color: "white"
                      } : undefined}
                    >
                      <span className="relative z-10 flex items-center gap-2" style={isActive ? { color: "white" } : undefined}>
                        {link.label}
                        {hasNotification && (
                          <span className="h-2 w-2 rounded-full bg-destructive"></span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {/* Botão Menu Mobile */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              <div className="hidden md:block">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Flutuante Mobile */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-background/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden">
            <div className="flex flex-col h-full">
              {/* Header do Menu */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Logo size="sm" />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Links de Navegação */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || 
                    (link.href !== "/dashboard" && pathname?.startsWith(link.href));
                  const hasNotification = link.href === "/dashboard/messages" && unreadCount > 0;
                  
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                        isActive
                          ? "btn-gradient-active shadow-md hover:shadow-lg hover:[filter:brightness(0.85)_saturate(1.2)_contrast(1.1)] active:[filter:brightness(0.8)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                      style={isActive ? { 
                        background: "var(--theme-gradient, linear-gradient(135deg, #f97316 0%, #a855f7 50%, #3b82f6 100%))",
                        color: "white"
                      } : undefined}
                    >
                      <span className="flex items-center gap-2" style={isActive ? { color: "white" } : undefined}>
                        {link.label}
                        {hasNotification && (
                          <span className="h-2 w-2 rounded-full bg-destructive"></span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}

