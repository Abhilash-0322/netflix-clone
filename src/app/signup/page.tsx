import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { AuthForm } from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign Up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  return (
    <AuthShell>
      <AuthForm mode="signup" initialEmail={email} />
    </AuthShell>
  );
}
