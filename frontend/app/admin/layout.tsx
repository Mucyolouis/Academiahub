import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminNav from "./_components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-white p-6">
        <p className="text-lg font-bold tracking-tight mb-8">AcademiaHub</p>
        <AdminNav />
        <p className="mt-auto text-xs text-gray-400 pt-6">
          Signed in as
          <br />
          <span className="font-medium text-gray-600">
            {session.user.email}
          </span>
        </p>
      </aside>
      <main className="flex-1 min-w-0 p-6 lg:p-10">
        <nav className="md:hidden mb-6 border-b bg-white -m-6 p-6">
          <p className="text-lg font-bold tracking-tight mb-4">AcademiaHub</p>
          <AdminNav />
        </nav>
        {children}
      </main>
    </div>
  );
}
