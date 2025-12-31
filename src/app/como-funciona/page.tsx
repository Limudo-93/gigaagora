import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import HomeHeader from "@/components/HomeHeader";
import MarketingFooter from "@/components/MarketingFooter";
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
    <div className="min-h-screen">
      <HomeHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-music text-white py-20">
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#ff6b4a] to-[#2aa6a1] mb-6">
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
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#ff6b4a] to-[#ffb347] flex items-center justify-center mx-auto mb-4">
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
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#2aa6a1] to-[#1d7f79] flex items-center justify-center mx-auto mb-4">
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
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#2aa6a1] to-[#1d7f79] flex items-center justify-center mx-auto mb-4">
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
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#2aa6a1] to-[#1d7f79] flex items-center justify-center mx-auto mb-4">
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#ffb347] to-[#2aa6a1] mb-6">
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
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#ff6b4a] to-[#ffb347] flex items-center justify-center mx-auto mb-4">
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
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#2aa6a1] to-[#1d7f79] flex items-center justify-center mx-auto mb-4">
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
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#2aa6a1] to-[#1d7f79] flex items-center justify-center mx-auto mb-4">
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
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#2aa6a1] to-[#1d7f79] flex items-center justify-center mx-auto mb-4">
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
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#ff6b4a] to-[#ffb347] flex items-center justify-center mb-4">
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
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#2aa6a1] to-[#1d7f79] flex items-center justify-center mb-4">
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
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#2aa6a1] to-[#1d7f79] flex items-center justify-center mb-4">
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
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#2aa6a1] to-[#1d7f79] flex items-center justify-center mb-4">
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
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#ff6b4a] to-[#ffb347] flex items-center justify-center mb-4">
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
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#2aa6a1] to-[#1d7f79] flex items-center justify-center mb-4">
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
      <section className="py-20 bg-gradient-to-br from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1] text-white">
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
              <Link href={"/contato" as any}>Falar com Suporte</Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}


