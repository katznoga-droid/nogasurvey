import { CenteredShell } from "@/components/Logo";

export default function ThankYouPage() {
  return (
    <CenteredShell>
      <div className="text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-3xl">
          🧡
        </div>
        <h1 className="text-3xl font-semibold text-navy">Thank you!</h1>
        <p className="mt-3 text-xl text-slate">We care about you!</p>
      </div>
    </CenteredShell>
  );
}
