import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PesertaLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login?next=/dashboard");
  }
  if (session.role === "juri") {
    redirect("/reviewer");
  }
  if (session.role !== "peserta") {
    redirect("/login?next=/dashboard");
  }

  return (
    <DashboardShell variant="peserta" user={{ nama: session.nama, email: session.email, role: session.role }}>
      {children}
    </DashboardShell>
  );
}
