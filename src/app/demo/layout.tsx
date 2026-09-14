import Link from "next/link";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-amber-400 px-6 py-2 text-center text-sm font-medium text-amber-950">
        Modo demonstração — dados fictícios, sem login e sem conexão com o banco real.{" "}
        <Link href="/login" className="underline">
          Ir para o login real
        </Link>
      </div>
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <Link href="/demo" className="section-title text-lg">
          Novva Videos <span className="text-muted-foreground">· demo</span>
        </Link>
        <span className="text-sm text-muted-foreground">demo@exemplo.com</span>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
