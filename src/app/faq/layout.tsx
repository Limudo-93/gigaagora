import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Chama o Músico",
  description: "Perguntas frequentes sobre a plataforma Chama o Músico",
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
