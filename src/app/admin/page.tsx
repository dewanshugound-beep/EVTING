import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const sb = createServerSupabase();

  // Verify admin role in DB
  const { data: dbUser } = await sb
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!dbUser || dbUser.role !== "admin") {
    redirect("/");
  }

  // Load initial data for client
  const [{ data: users }, { data: reports }] = await Promise.all([
    sb.from("users").select("*").order("created_at", { ascending: false }).limit(50),
    sb.from("reports").select("*").eq("status", "open").order("created_at", { ascending: false }),
  ]);

  return (
    <AdminClient
      initialUsers={users || []}
      initialReports={reports || []}
      visitorCount={0}
    />
  );
}
