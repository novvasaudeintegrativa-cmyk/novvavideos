import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3">
        <Link href="/dashboard" className="font-semibold">
          Novva Videos
        </Link>
        <div className="flex items-center gap-4 text-sm text-neutral-600">
          <span>{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="underline hover:text-neutral-900">
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
