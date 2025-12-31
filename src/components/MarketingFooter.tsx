"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { Mail, MapPin } from "lucide-react";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-white/60 bg-white/80">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#fff1e7] via-white to-[#e9f7f5] p-6 shadow-sm lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Faça parte da comunidade
              </p>
              <h3 className="text-2xl font-display font-semibold text-foreground">
                Instale o app e tenha gigs no bolso.
              </h3>
              <p className="text-sm text-foreground/60">
                Experiência completa com notificações, agenda e chats rápidos.
              </p>
            </div>
            <Button className="btn-gradient text-white" asChild>
              <Link href="/signup">Criar conta gratuita</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div className="space-y-3">
            <Logo size="md" />
            <p className="text-sm text-foreground/60">
              A plataforma que conecta músicos e contratantes com eficiência,
              transparência e velocidade.
            </p>
          </div>
          <div className="space-y-3 text-sm text-foreground/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Plataforma
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/como-funciona" className="hover:text-foreground">
                Como funciona
              </Link>
              <Link href="/sobre" className="hover:text-foreground">
                Sobre nós
              </Link>
              <Link href="/faq" className="hover:text-foreground">
                Ajuda e FAQ
              </Link>
              <Link href="/contato" className="hover:text-foreground">
                Fale com a gente
              </Link>
            </div>
          </div>
          <div className="space-y-3 text-sm text-foreground/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Contato
            </p>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#2aa6a1]" />
              <span>contato@chamaomusico.com.br</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#2aa6a1]" />
              <span>Brasil, atendimento online</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/60 pt-6 text-xs text-foreground/50 sm:flex-row">
          <span>© 2025 Chama o Músico. Todos os direitos reservados.</span>
          <div className="flex gap-4">
            <Link href="/privacidade" className="hover:text-foreground">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-foreground">
              Termos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
