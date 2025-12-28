import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-white p-8 shadow-sm">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="text-sm text-muted-foreground">Acesse sua conta para continuar.</p>
        </header>
        <form className="space-y-4" method="post">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none transition hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring"
              id="email"
              name="email"
              type="email"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Senha
            </label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none transition hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring"
              id="password"
              name="password"
              type="password"
              required
            />
          </div>
          <Button className="w-full" type="submit">
            Entrar
          </Button>
        </form>
      </div>
    </main>
  );
}
