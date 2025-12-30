import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { NotificationProvider } from "@/components/ui/notification-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chama o Músico",
  description: "A plataforma que conecta músicos talentosos com oportunidades de trabalho",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
