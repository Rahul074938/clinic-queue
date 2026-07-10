export const dynamic = "force-dynamic";

import { Suspense } from "react";
import LoginForm from "./login-form";
import { Stethoscope } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-900 text-slate-100 min-h-screen">
        <Stethoscope className="w-8 h-8 animate-pulse text-teal-400" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
