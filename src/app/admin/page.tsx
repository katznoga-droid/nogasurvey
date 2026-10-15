import { Logo } from "@/components/Logo";
import { getResponses, logout } from "./actions";
import { Dashboard } from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const responses = await getResponses();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between bg-navy px-4 py-3 sm:px-6">
        <Logo light />
        <form action={logout}>
          <button className="rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
            Log out
          </button>
        </form>
      </header>
      <Dashboard initial={responses} />
    </div>
  );
}
