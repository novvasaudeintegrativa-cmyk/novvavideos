import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="section-title text-2xl">Criar conta</h1>
        <p className="text-sm text-muted-foreground">Comece a usar a plataforma.</p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={signup} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="full_name" className="text-sm font-medium">
            Nome
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover"
        >
          Criar conta
        </button>
      </form>

      <p className="text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-foreground underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
