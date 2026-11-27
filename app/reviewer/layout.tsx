import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session || session.role !== "juri") {
    redirect("/login?next=/reviewer");
  }

  return (
    <DashboardShell variant="juri" user={{ nama: session.nama, email: session.email, role: session.role }}>
      {children}
    </DashboardShell>
  );
}
