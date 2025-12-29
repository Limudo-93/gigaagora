import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/Logo";
import {
  Music,
  Search,
  Handshake,
  CheckCircle2,
  Star,
  MessageSquare,
  Calendar,
  DollarSign,
  Shield,
  Users,
  Briefcase,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Como Funciona - Chama o Músico",
  description: "Entenda como a plataforma Chama o Músico conecta músicos e contratantes",
};

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo size="md" />
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white" asChild>
                <Link href="/signup">Criar Conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500 text-white py-20">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Como Funciona
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Conectando músicos talentosos com oportunidades de trabalho de forma simples e eficiente
          </p>
        </div>
      </section>

      {/* Para Contratantes */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-purple-500 mb-6">
              <Briefcase className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Para Contratantes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Encontre os músicos perfeitos para seu evento em poucos passos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Crie sua Conta
                </h3>
                <p className="text-gray-600">
                  Cadastre-se gratuitamente e complete seu perfil de contratante
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Publique seu Trabalho
                </h3>
                <p className="text-gray-600">
                  Descreva o evento, defina os instrumentos necessários e o cachê oferecido
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Receba Propostas
                </h3>
                <p className="text-gray-600">
                  Músicos qualificados serão automaticamente sugeridos ou você pode convidar diretamente
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Confirme e Contrate
                </h3>
                <p className="text-gray-600">
                  Avalie os perfis, converse com os músicos e confirme os selecionados
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Para Músicos */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-6">
              <Music className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Para Músicos
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Encontre oportunidades de trabalho e mostre seu talento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Complete seu Perfil
                </h3>
                <p className="text-gray-600">
                  Adicione seus instrumentos, gêneros musicais, experiência e fotos
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Receba Convites
                </h3>
                <p className="text-gray-600">
                  Seja encontrado por contratantes ou receba convites diretos para trabalhos
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Avalie Oportunidades
                </h3>
                <p className="text-gray-600">
                  Veja detalhes do trabalho, data, local e cachê antes de aceitar
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Aceite e Trabalhe
                </h3>
                <p className="text-gray-600">
                  Confirme sua participação, receba os detalhes e faça seu show!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recursos Principais */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Recursos da Plataforma
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Funcionalidades que tornam o processo mais fácil e eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sistema de Match Inteligente
                </h3>
                <p className="text-gray-600">
                  Nossa plataforma conecta automaticamente músicos com trabalhos compatíveis baseado em instrumento, gênero e localização
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sistema de Avaliações
                </h3>
                <p className="text-gray-600">
                  Músicos e contratantes podem avaliar uns aos outros após cada trabalho, construindo reputação e confiança
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Mensagens Integradas
                </h3>
                <p className="text-gray-600">
                  Comunique-se diretamente com músicos ou contratantes através da plataforma
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Agenda Integrada
                </h3>
                <p className="text-gray-600">
                  Gerencie todos os seus trabalhos confirmados em uma agenda centralizada
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Transparência Financeira
                </h3>
                <p className="text-gray-600">
                  Cachê definido claramente desde o início, sem surpresas ou negociações complicadas
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Segurança e Confiança
                </h3>
                <p className="text-gray-600">
                  Perfis verificados, histórico de trabalhos e sistema de avaliações garantem transparência
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Junte-se à comunidade de músicos e contratantes que já estão usando o Chama o Músico
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-6 shadow-xl"
              asChild
            >
              <Link href="/signup">
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 backdrop-blur-sm"
              asChild
            >
              <Link href="/contato" as any>Falar com Suporte</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500 flex items-center justify-center">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">Chama o Músico</span>
              </div>
              <p className="text-gray-400 text-sm">
                Conectando talentos musicais com oportunidades de trabalho
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Plataforma</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/dashboard/gigs" className="hover:text-white">Trabalhos</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/dashboard/perfil" className="hover:text-white">Perfil</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Sobre</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/como-funciona" as any className="hover:text-white">Como Funciona</Link></li>
                <li><Link href="/sobre" as any className="hover:text-white">Sobre Nós</Link></li>
                <li><Link href="/contato" as any className="hover:text-white">Contato</Link></li>
                <li><Link href="/faq" as any className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/termos" as any className="hover:text-white">Termos de Uso</Link></li>
                <li><Link href="/privacidade" as any className="hover:text-white">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Chama o Músico. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

