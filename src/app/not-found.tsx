import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, Music } from "lucide-react";
import HomeHeader from "@/components/HomeHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeHeader />
      
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Background gradient */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: "var(--theme-gradient, linear-gradient(135deg, #f97316 0%, #a855f7 50%, #3b82f6 100%))",
          }}
        />
        
        <div className="relative z-10 max-w-2xl w-full text-center space-y-6 sm:space-y-8">
          {/* 404 Number */}
          <div className="space-y-2">
            <h1 className="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              404
            </h1>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Music className="h-8 w-8 sm:h-10 sm:w-10" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Página não encontrada
              </h2>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3 sm:space-y-4">
            <p className="text-base sm:text-lg text-muted-foreground">
              Ops! A página que você está procurando não existe ou foi movida.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground">
              Mas não se preocupe, ainda podemos te ajudar a encontrar o que você precisa!
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
            <Button 
              asChild
              className="w-full sm:w-auto"
              style={{
                background: "var(--theme-gradient, linear-gradient(135deg, #f97316 0%, #a855f7 50%, #3b82f6 100%))",
                color: "white"
              }}
            >
              <Link href={"/" as any}>
                <Home className="h-4 w-4 mr-2" />
                Voltar para Home
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              asChild
              className="w-full sm:w-auto"
            >
              <Link href={"/dashboard" as any}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir para Dashboard
              </Link>
            </Button>
          </div>

          {/* Quick Links */}
          <div className="pt-6 sm:pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Ou explore essas páginas:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link 
                href={"/como-funciona" as any}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Como Funciona
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link 
                href={"/sobre" as any}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Sobre Nós
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link 
                href={"/contato" as any}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Contato
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link 
                href={"/faq" as any}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

