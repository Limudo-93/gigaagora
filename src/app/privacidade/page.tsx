import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { Music } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade - Chama o Músico",
  description: "Política de privacidade e proteção de dados da plataforma Chama o Músico",
};

export default function PrivacidadePage() {
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
                <Link href={"/login" as any}>Entrar</Link>
              </Button>
              <Button className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white" asChild>
                <Link href={"/signup" as any}>Criar Conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Política de Privacidade
            </h1>
            <p className="text-gray-600">
              Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
              <p>
                O Chama o Músico ("nós", "nosso" ou "plataforma") está comprometido em proteger a privacidade e 
                segurança dos dados pessoais de nossos usuários. Esta Política de Privacidade descreve como coletamos, 
                usamos, armazenamos e protegemos suas informações pessoais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informações que Coletamos</h2>
              <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">2.1. Informações Fornecidas por Você</h3>
              <p>Coletamos informações que você nos fornece diretamente, incluindo:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Nome completo e informações de contato (email, telefone)</li>
                <li>Informações do perfil (foto, cidade, estado, biografia)</li>
                <li>Para músicos: instrumentos, gêneros musicais, experiência</li>
                <li>Para contratantes: informações sobre trabalhos publicados</li>
                <li>Mensagens trocadas através da plataforma</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">2.2. Informações Coletadas Automaticamente</h3>
              <p>Quando você usa nossa plataforma, coletamos automaticamente:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Informações de dispositivo e navegador</li>
                <li>Endereço IP e localização aproximada</li>
                <li>Logs de acesso e atividade na plataforma</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Como Usamos suas Informações</h2>
              <p>Usamos suas informações para:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Facilitar conexões entre músicos e contratantes</li>
                <li>Processar e gerenciar trabalhos e convites</li>
                <li>Enviar notificações e comunicações importantes</li>
                <li>Personalizar sua experiência na plataforma</li>
                <li>Garantir segurança e prevenir fraudes</li>
                <li>Cumprir obrigações legais</li>
                <li>Enviar atualizações e novidades (com seu consentimento)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Compartilhamento de Informações</h2>
              <p>Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas nas seguintes situações:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Com outros usuários:</strong> Informações do seu perfil são visíveis para outros usuários da plataforma conforme necessário para o funcionamento do serviço</li>
                <li><strong>Prestadores de serviços:</strong> Podemos compartilhar com provedores de serviços que nos ajudam a operar a plataforma (hospedagem, análise, etc.)</li>
                <li><strong>Obrigações legais:</strong> Quando exigido por lei ou para proteger nossos direitos</li>
                <li><strong>Com seu consentimento:</strong> Em outras situações com seu consentimento explícito</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Segurança dos Dados</h2>
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações pessoais, 
                incluindo criptografia, controles de acesso e monitoramento regular. No entanto, nenhum sistema é 
                100% seguro, e não podemos garantir segurança absoluta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Retenção de Dados</h2>
              <p>
                Mantemos suas informações pessoais enquanto sua conta estiver ativa ou conforme necessário para 
                fornecer nossos serviços. Podemos reter certas informações mesmo após o encerramento da conta para 
                cumprir obrigações legais ou resolver disputas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Seus Direitos (LGPD)</h2>
              <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Acesso:</strong> Solicitar acesso às suas informações pessoais</li>
                <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou desatualizados</li>
                <li><strong>Exclusão:</strong> Solicitar exclusão de suas informações pessoais</li>
                <li><strong>Portabilidade:</strong> Solicitar portabilidade dos seus dados</li>
                <li><strong>Revogação de consentimento:</strong> Revogar consentimento quando aplicável</li>
                <li><strong>Oposição:</strong> Opor-se ao processamento de seus dados em certas circunstâncias</li>
              </ul>
              <p className="mt-4">
                Para exercer esses direitos, entre em contato conosco através da página de{" "}
                <Link href="/contato" as any className="text-orange-600 hover:underline">Contato</Link> ou pelo email 
                privacidade@chamaomusico.com.br.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies e Tecnologias Similares</h2>
              <p>
                Usamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso da plataforma 
                e personalizar conteúdo. Você pode gerenciar preferências de cookies através das configurações do 
                seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Privacidade de Menores</h2>
              <p>
                Nossa plataforma é destinada a usuários com 18 anos ou mais. Não coletamos intencionalmente informações 
                de menores de 18 anos. Se descobrirmos que coletamos informações de um menor, tomaremos medidas para 
                excluir essas informações.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Links para Sites de Terceiros</h2>
              <p>
                Nossa plataforma pode conter links para sites de terceiros. Não somos responsáveis pelas práticas 
                de privacidade desses sites. Recomendamos que você leia as políticas de privacidade de qualquer site 
                que visite.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre alterações 
                significativas através da plataforma ou por email. Recomendamos que você revise esta política 
                regularmente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Encarregado de Proteção de Dados</h2>
              <p>
                Para questões relacionadas à proteção de dados pessoais, entre em contato com nosso Encarregado de 
                Proteção de Dados (DPO) através do email dpo@chamaomusico.com.br.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Consentimento</h2>
              <p>
                Ao usar nossa plataforma, você consente com a coleta e uso de informações conforme descrito nesta 
                Política de Privacidade.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contato</h2>
              <p>
                Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade ou sobre como tratamos 
                suas informações pessoais, entre em contato conosco através da página de{" "}
                <Link href="/contato" as any className="text-orange-600 hover:underline">Contato</Link> ou pelo email 
                privacidade@chamaomusico.com.br.
              </p>
            </section>
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

