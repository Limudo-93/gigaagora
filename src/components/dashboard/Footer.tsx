import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="relative mt-16 border-t border-border backdrop-blur-xl bg-card/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e descrição */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Logo size="md" />
            </div>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Conectando músicos e contratantes para criar experiências musicais inesquecíveis.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Links Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={"/dashboard" as any}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href={"/dashboard/gigs" as any}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
                >
                  Gigs
                </Link>
              </li>
              <li>
                <Link
                  href={"/dashboard/messages" as any}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
                >
                  Mensagens
                </Link>
              </li>
              <li>
                <Link
                  href={"/notifications" as any}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
                >
                  Notificações
                </Link>
              </li>
              <li>
                <Link
                  href={"/dashboard/force-push-register" as any}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
                >
                  Forçar Push
                </Link>
              </li>
              <li>
                <Link
                  href={"/dashboard/perfil" as any}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
                >
                  Perfil
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Suporte</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={"/ajuda" as any}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
                >
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link
                  href={"/contato" as any}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
                >
                  Contato
                </Link>
              </li>
              <li>
                <Link
                  href={"/termos" as any}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
                >
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Chama o Músico. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

