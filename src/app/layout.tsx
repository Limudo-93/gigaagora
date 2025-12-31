import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { NotificationProvider } from "@/components/ui/notification-provider";
import { getTheme, type ThemeName } from "@/lib/theme-data";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Chama o Músico",
  description: "A plataforma que conecta músicos talentosos com oportunidades de trabalho",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  themeColor: "#f97316",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chama o Músico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("theme")?.value as ThemeName | undefined;
  const theme = getTheme(cookieTheme);
  const themeStyle = {
    "--background": theme.colors.background,
    "--foreground": theme.colors.foreground,
    "--card": theme.colors.card,
    "--card-foreground": theme.colors.cardForeground,
    "--popover": theme.colors.popover,
    "--popover-foreground": theme.colors.popoverForeground,
    "--primary": theme.colors.primary,
    "--primary-foreground": theme.colors.primaryForeground,
    "--secondary": theme.colors.secondary,
    "--secondary-foreground": theme.colors.secondaryForeground,
    "--muted": theme.colors.muted,
    "--muted-foreground": theme.colors.mutedForeground,
    "--accent": theme.colors.accent,
    "--accent-foreground": theme.colors.accentForeground,
    "--destructive": theme.colors.destructive,
    "--destructive-foreground": theme.colors.destructiveForeground,
    "--border": theme.colors.border,
    "--input": theme.colors.input,
    "--ring": theme.colors.ring,
    "--theme-gradient": theme.gradient,
  } as CSSProperties;
  const themeClass = `theme-${theme.name}${theme.isDark ? " dark" : ""}`;

  return (
    <html lang="pt-BR" className={themeClass} style={themeStyle}>
      <body className={`${bodyFont.variable} ${displayFont.variable} font-sans antialiased`}>
        <ThemeProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
