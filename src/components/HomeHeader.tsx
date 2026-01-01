"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { Menu, X } from "lucide-react";

export default function HomeHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/musicos" as any, label: "Músicos" },
    { href: "/como-funciona" as any, label: "Como Funciona" },
    { href: "/sobre" as any, label: "Sobre Nós" },
    { href: "/contato" as any, label: "Contato" },
    { href: "/faq" as any, label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/60 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href={"/" as any} className="flex items-center gap-2">
            <Logo size="md" />
            <span className="hidden lg:inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              novo
            </span>
          </Link>

          {/* Menu de navegação desktop - Links institucionais */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base font-medium text-foreground/90 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* Botão menu mobile */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-foreground/80 hover:bg-white/60 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Botões de ação - desktop */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-foreground hover:bg-white/60"
                asChild
              >
                <Link href={"/login" as any}>Entrar</Link>
              </Button>
              <Button
                className="btn-gradient text-white shadow-md transition-all duration-200"
                asChild
              >
                <Link href={"/signup" as any}>Começar missão</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/60">
            <nav className="flex flex-col gap-4 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base font-medium text-foreground/90 hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/60">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-foreground hover:bg-white/60"
                  asChild
                >
                  <Link
                    href={"/login" as any}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                </Button>
                <Button
                  className="w-full btn-gradient text-white shadow-md transition-all duration-200"
                  asChild
                >
                  <Link
                    href={"/signup" as any}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Começar missão
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
