import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/adminS">) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/login?next=/adminS");
  }

  return (
    <DashboardShell variant="admin" user={{ nama: session.nama, email: session.email, role: session.role }}>
      {children}
    </DashboardShell>
  );
}
