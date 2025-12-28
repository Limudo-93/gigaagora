import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-md space-y-4 rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Bem-vindo ao Giga Agora</h1>
        <p className="text-sm text-muted-foreground">
          Projeto Next.js com Tailwind CSS, shadcn/ui e Supabase pré-configurados.
        </p>
        <div className="flex gap-3">
          <Link
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            href="/login"
          >
            Ir para Login
          </Link>
          <Link
            className="rounded-md border px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            href="/dashboard"
          >
            Ir para Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
