import Link from "next/link";
import HomeHeader from "@/components/HomeHeader";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata = {
  title: "Termos de Uso - Chama o Músico",
  description: "Termos e condições de uso da plataforma Chama o Músico",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen">
      <HomeHeader />

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Termos de Uso
            </h1>
            <p className="text-gray-600">
              Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar a plataforma Chama o Músico, você concorda em cumprir e estar vinculado a estes 
                Termos de Uso. Se você não concorda com alguma parte destes termos, não deve usar nossa plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descrição do Serviço</h2>
              <p>
                O Chama o Músico é uma plataforma online que conecta músicos com contratantes que buscam profissionais 
                para eventos. A plataforma oferece ferramentas para publicação de trabalhos, busca de músicos, sistema 
                de match, comunicação e avaliações.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cadastro e Conta</h2>
              <p>
                Para usar a plataforma, você deve criar uma conta fornecendo informações precisas e atualizadas. 
                Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as 
                atividades que ocorrem em sua conta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Uso da Plataforma</h2>
              <p>Você concorda em usar a plataforma apenas para fins legais e de acordo com estes termos. É proibido:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Fornecer informações falsas ou enganosas</li>
                <li>Usar a plataforma para atividades ilegais ou não autorizadas</li>
                <li>Interferir ou interromper o funcionamento da plataforma</li>
                <li>Tentar acessar áreas restritas da plataforma</li>
                <li>Usar bots, scripts ou outros meios automatizados</li>
                <li>Violar direitos de propriedade intelectual</li>
                <li>Assediar, ameaçar ou prejudicar outros usuários</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Responsabilidades dos Usuários</h2>
              <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">5.1. Músicos</h3>
              <p>
                Músicos são responsáveis por fornecer informações precisas sobre suas habilidades, experiência e 
                disponibilidade. Ao aceitar um convite, você se compromete a cumprir o trabalho conforme combinado.
              </p>
              <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">5.2. Contratantes</h3>
              <p>
                Contratantes são responsáveis por fornecer informações precisas sobre os trabalhos, incluindo data, 
                local, horário e cachê. Ao confirmar um músico, você se compromete a cumprir os termos acordados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Pagamentos e Transações</h2>
              <p>
                O Chama o Músico não processa pagamentos entre usuários. Todas as transações financeiras são 
                realizadas diretamente entre músicos e contratantes. A plataforma não se responsabiliza por 
                disputas relacionadas a pagamentos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cancelamentos</h2>
              <p>
                Cancelamentos devem ser comunicados o quanto antes através da plataforma. Cancelamentos de última 
                hora podem afetar a reputação do usuário. Recomendamos sempre ter planos de contingência.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Avaliações</h2>
              <p>
                As avaliações devem ser honestas e baseadas em experiências reais. Avaliações falsas, difamatórias 
                ou que violem os direitos de outros usuários podem ser removidas e podem resultar em suspensão da conta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo da plataforma, incluindo design, textos, gráficos, logos e software, é propriedade 
                do Chama o Músico ou de seus licenciadores e está protegido por leis de propriedade intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Privacidade</h2>
              <p>
                O uso da plataforma também está sujeito à nossa Política de Privacidade. Ao usar a plataforma, 
                você concorda com a coleta e uso de informações conforme descrito na política de privacidade.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modificações do Serviço</h2>
              <p>
                Reservamos o direito de modificar, suspender ou descontinuar qualquer aspecto da plataforma a 
                qualquer momento, com ou sem aviso prévio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Limitação de Responsabilidade</h2>
              <p>
                O Chama o Músico atua como intermediário entre músicos e contratantes. Não somos responsáveis por:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Disputas entre usuários</li>
                <li>Qualidade do trabalho realizado pelos músicos</li>
                <li>Cancelamentos ou não comparecimento</li>
                <li>Problemas de pagamento entre usuários</li>
                <li>Danos ou perdas resultantes do uso da plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Suspensão e Encerramento</h2>
              <p>
                Reservamos o direito de suspender ou encerrar contas que violem estes termos ou que sejam usadas 
                de forma inadequada, sem aviso prévio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Alterações nos Termos</h2>
              <p>
                Podemos modificar estes termos a qualquer momento. Alterações significativas serão comunicadas 
                aos usuários. O uso continuado da plataforma após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Lei Aplicável</h2>
              <p>
                Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida nos tribunais 
                competentes do Brasil.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Contato</h2>
              <p>
                Para questões sobre estes termos, entre em contato conosco através da página de{" "}
                <Link href={"/contato" as any} className="text-orange-600 hover:underline">Contato</Link> ou pelo email 
                legal@chamaomusico.com.br.
              </p>
            </section>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

