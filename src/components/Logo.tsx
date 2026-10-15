export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xl font-semibold tracking-tight ${light ? "text-white" : "text-navy"}`}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white text-sm font-bold">N</span>
      NogaSurvey
    </span>
  );
}

export function CenteredShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-xl rounded-lg border border-line bg-white p-6 shadow-[0_2px_8px_rgba(33,51,67,0.08)] sm:p-10">
        {children}
      </div>
    </main>
  );
}
