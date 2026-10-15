import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="bg-navy px-6 py-4">
        <Logo light />
      </header>
      <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <p className="mb-4 rounded-full bg-brand-soft px-4 py-1 text-sm font-medium text-brand-dark">
          Customer feedback, made friendly
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-navy sm:text-5xl">
          Hear what your customers <span className="text-brand">really</span> think.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate">
          Send a survey, collect NPS and feedback, and watch results land on your dashboard in real time.
        </p>
        <Link
          href="/admin/login"
          className="mt-8 rounded-md bg-brand px-6 py-3 font-medium text-white shadow-sm transition hover:bg-brand-dark"
        >
          Go to admin dashboard
        </Link>
      </section>
    </main>
  );
}
