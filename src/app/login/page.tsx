import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <AuthShell>
      <AuthForm mode="login" />
    </AuthShell>
  );
}
