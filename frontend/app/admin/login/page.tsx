import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminLoginForm from "./AdminLoginForm";

export const metadata = {
  title: "Admin Login | IvomoHub",
};

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id && session.user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1220] px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold tracking-widest text-primary uppercase">
              Admin Portal
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              IvomoHub Administration
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Restricted access — only authorised administrators can sign in.
            </p>
          </div>
          <AdminLoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">
          Not an administrator?{" "}
          <a
            href="/login"
            className="underline hover:text-gray-200 transition-colors"
          >
            Sign in as a user
          </a>
        </p>
      </div>
    </div>
  );
}