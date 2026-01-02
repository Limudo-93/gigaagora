"use client";

import { Plus, Mail, CheckCircle2, Sparkles, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const actions = [
  {
    icon: <Plus className="h-5 w-5" />,
    title: "Nova Gig",
    description: "Publique uma oportunidade",
    href: "/dashboard/gigs/new",
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: "Convites",
    description: "Ver e responder",
    href: "/dashboard/gigs",
    gradient: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "Avaliar",
    description: "Gigs concluídas",
    href: "/dashboard",
    gradient: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Desafios",
    description: "Complete e ganhe pontos",
    href: "/dashboard/desafios",
    gradient: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    title: "Agenda",
    description: "Próximos shows",
    href: "/dashboard/agenda",
    gradient: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Estatísticas",
    description: "Seu desempenho",
    href: "/dashboard/financeiro",
    gradient: "from-teal-500 to-cyan-500",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
  },
];

export default function QuickActionsSection() {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 snap-start snap-always py-12">
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ações Rápidas
          </h2>
          <p className="text-muted-foreground">
            Acesso rápido às funcionalidades principais
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Link key={index} href={action.href as any}>
              <Card
                className={`h-full border-2 ${action.borderColor} ${action.bgColor} hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-md group-hover:scale-110 transition-transform`}
                    >
                      {action.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-bold text-lg text-foreground">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
