import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/Logo";
import {
  Music,
  Target,
  Heart,
  Users,
  Award,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Sobre Nós - Chama o Músico",
  description: "Conheça a história e missão do Chama o Músico",
};

export default function SobrePage() {
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
            Sobre o Chama o Músico
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Conectando talentos musicais com oportunidades de trabalho desde 2024
          </p>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Nossa História
            </h2>
          </div>
          <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
            <p>
              O <strong>Chama o Músico</strong> nasceu da necessidade de criar uma ponte mais eficiente e transparente 
              entre músicos talentosos e contratantes que buscam profissionais qualificados para seus eventos.
            </p>
            <p>
              Observamos que muitos músicos enfrentavam dificuldades para encontrar oportunidades de trabalho, 
              enquanto contratantes tinham dificuldade em localizar músicos com o perfil adequado para seus eventos. 
              A solução foi criar uma plataforma que simplifica esse processo, oferecendo ferramentas inteligentes 
              de match e um sistema transparente de avaliações.
            </p>
            <p>
              Hoje, somos uma comunidade crescente de músicos e contratantes que acreditam na importância de 
              valorizar o trabalho musical e facilitar conexões de qualidade no mercado da música.
            </p>
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Missão</h3>
                <p className="text-gray-600">
                  Facilitar a conexão entre músicos e contratantes, criando oportunidades de trabalho 
                  de forma transparente, eficiente e valorizando o talento musical.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Visão</h3>
                <p className="text-gray-600">
                  Ser a principal plataforma de conexão entre músicos e contratantes no Brasil, 
                  reconhecida pela qualidade, transparência e inovação.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Valores</h3>
                <p className="text-gray-600">
                  Transparência, respeito, valorização do trabalho artístico, inovação constante 
                  e compromisso com a satisfação de músicos e contratantes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Por que escolher */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Por que escolher o Chama o Músico?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Diferenciais que fazem a diferença
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Comunidade Crescente
                    </h3>
                    <p className="text-gray-600">
                      Centenas de músicos e contratantes já confiam na nossa plataforma para 
                      encontrar oportunidades e talentos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Qualidade Garantida
                    </h3>
                    <p className="text-gray-600">
                      Sistema de avaliações e perfis verificados garantem que você trabalhe 
                      com profissionais confiáveis.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Todos os Gêneros
                    </h3>
                    <p className="text-gray-600">
                      Do sertanejo ao jazz, do pagode ao rock. Encontre músicos para qualquer 
                      estilo musical que você precise.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Tecnologia Avançada
                    </h3>
                    <p className="text-gray-600">
                      Sistema inteligente de match que conecta automaticamente músicos com 
                      as oportunidades ideais.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Faça parte da nossa comunidade
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Junte-se a centenas de músicos e contratantes que já estão usando o Chama o Músico
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
              <Link href="/como-funciona">Saiba Mais</Link>
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
                <li><Link href="/como-funciona" className="hover:text-white">Como Funciona</Link></li>
                <li><Link href="/sobre" className="hover:text-white">Sobre Nós</Link></li>
                <li><Link href="/contato" className="hover:text-white">Contato</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/termos" className="hover:text-white">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-white">Privacidade</Link></li>
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

