import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { AuthCodeBackdrop } from "@/components/AuthCodeBackdrop";

export const metadata: Metadata = {
  title: "Nythia Consulting — Portal",
};

export default function LoginPage() {
  return (
    <div className="auth-card grid w-full max-w-4xl overflow-hidden rounded-xl md:grid-cols-2">
      <AuthCodeBackdrop />
      <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
        <LoginForm />
      </div>
    </div>
  );
}
