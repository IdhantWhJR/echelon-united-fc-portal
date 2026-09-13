import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";
import { ClubMark } from "@/components/brand/club-mark";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm animate-rise-in">
        <div className="mb-10 flex justify-center">
          <ClubMark size="lg" />
        </div>
        <div className="card p-8">
          <p className="eyebrow mb-1">Account Recovery</p>
          <h1 className="mb-6 font-display text-2xl font-bold text-paper">Choose a new password</h1>
        </div>
      </div>
    </div>
  );
}
