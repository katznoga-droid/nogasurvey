import { CenteredShell } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <CenteredShell>
      <h1 className="text-center text-2xl font-semibold text-navy">Welcome to NogaSurvey Admin Login</h1>
      <p className="mt-2 text-center text-slate">Sign in to see what your customers are saying.</p>
      <LoginForm />
    </CenteredShell>
  );
}
