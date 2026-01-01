"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import HomeHeader from "@/components/HomeHeader";
import MarketingFooter from "@/components/MarketingFooter";
import {
  Music,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Search,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: "geral" | "musico" | "contratante";
}

const faqs: FAQItem[] = [
  {
    category: "geral",
    question: "O que é o Chama o Músico?",
    answer:
      "O Chama o Músico é uma plataforma online que conecta músicos talentosos com contratantes que buscam profissionais para seus eventos. Facilitamos o processo de encontrar e contratar músicos, oferecendo ferramentas de match inteligente, sistema de avaliações e comunicação integrada.",
  },
  {
    category: "geral",
    question: "Como posso criar uma conta?",
    answer:
      "Criar uma conta é simples e gratuito! Basta clicar em 'Criar Conta' no canto superior direito, preencher seus dados básicos e escolher se você é um músico ou contratante. Depois, complete seu perfil com as informações relevantes.",
  },
  {
    category: "geral",
    question: "A plataforma é gratuita?",
    answer:
      "Sim! Criar uma conta e usar a plataforma é totalmente gratuito. Você pode publicar trabalhos, receber convites, e usar todas as funcionalidades básicas sem custo.",
  },
  {
    category: "musico",
    question: "Como recebo convites para trabalhos?",
    answer:
      "Após completar seu perfil com seus instrumentos, gêneros musicais e experiência, você pode receber convites de duas formas: automaticamente através do nosso sistema de match (quando um trabalho corresponde ao seu perfil) ou diretamente quando um contratante te convida.",
  },
  {
    category: "musico",
    question: "Como funciona o sistema de avaliações?",
    answer:
      "Após cada trabalho confirmado, tanto o músico quanto o contratante podem avaliar um ao outro. As avaliações incluem uma nota (de 1 a 5 estrelas) e comentários opcionais. Isso ajuda a construir reputação e confiança na plataforma.",
  },
  {
    category: "musico",
    question: "Posso recusar um convite?",
    answer:
      "Sim! Você tem total liberdade para aceitar ou recusar qualquer convite. Se recusar, o contratante será notificado e poderá convidar outro músico.",
  },
  {
    category: "musico",
    question: "Como recebo o pagamento?",
    answer:
      "O Chama o Músico não processa pagamentos. O cachê é combinado diretamente entre você e o contratante. Recomendamos sempre definir o valor do cachê antes de confirmar o trabalho e ter um acordo claro sobre a forma de pagamento.",
  },
  {
    category: "contratante",
    question: "Como publico um trabalho?",
    answer:
      "Após fazer login, vá até 'Trabalhos' no menu e clique em 'Novo Trabalho'. Preencha as informações do evento (título, data, local, descrição), defina os instrumentos necessários e o cachê oferecido para cada um. Depois, publique o trabalho.",
  },
  {
    category: "contratante",
    question: "Como o sistema de match funciona?",
    answer:
      "Nosso sistema analisa automaticamente os perfis dos músicos cadastrados e sugere aqueles que melhor se encaixam no seu trabalho, baseado em instrumento, gênero musical, localização e histórico de avaliações. Você também pode buscar e convidar músicos manualmente.",
  },
  {
    category: "contratante",
    question: "Posso convidar músicos específicos?",
    answer:
      "Sim! Você pode buscar músicos na plataforma e enviar convites diretos para aqueles que desejar, independentemente das sugestões automáticas do sistema.",
  },
  {
    category: "contratante",
    question: "O que acontece se um músico cancelar?",
    answer:
      "Se um músico cancelar um trabalho confirmado, você será notificado imediatamente. Você pode então convidar outro músico para preencher a vaga. Recomendamos sempre ter músicos reserva para garantir seu evento.",
  },
  {
    category: "contratante",
    question: "Como avalio um músico após o trabalho?",
    answer:
      "Após a data do evento, você receberá uma notificação para avaliar o músico. Acesse a seção de 'Avaliações' no seu dashboard e deixe sua avaliação com nota e comentários. Isso ajuda outros contratantes a conhecerem melhor o profissional.",
  },
  {
    category: "geral",
    question: "Como funciona a comunicação na plataforma?",
    answer:
      "A plataforma possui um sistema de mensagens integrado que permite comunicação direta entre músicos e contratantes. Você pode trocar mensagens sobre detalhes do trabalho, combinar valores e esclarecer dúvidas, tudo dentro da plataforma.",
  },
  {
    category: "geral",
    question: "Meus dados estão seguros?",
    answer:
      "Sim! Levamos a segurança dos seus dados muito a sério. Utilizamos criptografia e seguimos as melhores práticas de segurança. Para mais detalhes, consulte nossa Política de Privacidade.",
  },
  {
    category: "geral",
    question: "Como posso excluir minha conta?",
    answer:
      "Para excluir sua conta, entre em contato conosco através da página de Contato ou envie um email para suporte@chamaomusico.com.br. Processaremos sua solicitação o mais rápido possível.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "todos" | "geral" | "musico" | "contratante"
  >("todos");

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "todos" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen">
      <HomeHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-music text-white py-20">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        ></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6">
            <HelpCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Perguntas Frequentes
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre a plataforma
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar perguntas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === "todos" ? "default" : "outline"}
                onClick={() => setSelectedCategory("todos")}
                className={
                  selectedCategory === "todos"
                    ? "bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1] text-white"
                    : ""
                }
              >
                Todos
              </Button>
              <Button
                variant={selectedCategory === "geral" ? "default" : "outline"}
                onClick={() => setSelectedCategory("geral")}
                className={
                  selectedCategory === "geral"
                    ? "bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1] text-white"
                    : ""
                }
              >
                Geral
              </Button>
              <Button
                variant={selectedCategory === "musico" ? "default" : "outline"}
                onClick={() => setSelectedCategory("musico")}
                className={
                  selectedCategory === "musico"
                    ? "bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1] text-white"
                    : ""
                }
              >
                Músico
              </Button>
              <Button
                variant={
                  selectedCategory === "contratante" ? "default" : "outline"
                }
                onClick={() => setSelectedCategory("contratante")}
                className={
                  selectedCategory === "contratante"
                    ? "bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1] text-white"
                    : ""
                }
              >
                Contratante
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {filteredFaqs.length > 0 ? (
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <Card
                  key={index}
                  className="border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            faq.category === "geral"
                              ? "bg-orange-100 text-orange-700"
                              : faq.category === "musico"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <HelpCircle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {faq.question}
                          </h3>
                        </div>
                      </div>
                      {openIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                      )}
                    </button>
                    {openIndex === index && (
                      <div className="px-6 pb-5 pt-0">
                        <div className="pl-12 border-l-2 border-gray-200">
                          <p className="text-gray-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                Nenhuma pergunta encontrada com os filtros selecionados.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("todos");
                }}
                className="mt-4"
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ainda tem dúvidas?
          </h2>
          <p className="text-gray-600 mb-6">
            Não encontrou a resposta que procurava? Entre em contato conosco!
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1] text-white"
            asChild
          >
            <Link href={"/contato" as any}>Falar com Suporte</Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
