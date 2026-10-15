import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { getResponses, logout } from "./actions";
import { Dashboard } from "./Dashboard";

async function DashboardData() {
  const responses = await getResponses();
  return <Dashboard initial={responses} />;
}

export default function AdminPage() {
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
      <Suspense fallback={<p className="p-10 text-center text-slate">Loading dashboard…</p>}>
        <DashboardData />
      </Suspense>
    </div>
  );
}
