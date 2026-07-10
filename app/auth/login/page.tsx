import dynamic from "next/dynamic";
import { Stethoscope } from "lucide-react";

// Disable SSR for the login form to completely bypass Next.js Vercel prerender errors
const LoginForm = dynamic(() => import("./login-form"), { 
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-900 text-slate-100 min-h-screen">
      <Stethoscope className="w-8 h-8 animate-pulse text-teal-400" />
    </div>
  )
});

export default function LoginPage() {
  return <LoginForm />;
}
