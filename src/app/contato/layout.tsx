import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato - Chama o Músico",
  description: "Entre em contato com a equipe do Chama o Músico",
};

export default function ContatoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

