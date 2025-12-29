"use client";

import Header from "./Header";
import Footer from "./Footer";
import ThemedBackground from "./ThemedBackground";

export default function DashboardLayout({
  children,
  sidebar,
  fullWidth = false,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background com tema dinâmico */}
      <ThemedBackground />
      
      <Header />
      <main className="flex-1 relative z-10">
        <div className={`mx-auto ${fullWidth ? 'max-w-full px-3 sm:px-4 md:px-6 lg:px-8' : 'max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8'} py-4 md:py-6 lg:py-8 xl:py-12`}>
          {fullWidth ? (
            <section className="space-y-4 md:space-y-6">{children}</section>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:gap-8 lg:grid-cols-[1fr_360px]">
              <section className="space-y-4 md:space-y-6">{children}</section>
              {sidebar && <aside className="hidden lg:block space-y-6">{sidebar}</aside>}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
