import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/login");

  const sb = createServerSupabase();

  // Verify admin role in DB
  const { data: dbUser } = await sb
    .from("users")
    .select("role")
    .eq("id", clerkUser.id)
    .single();

  if (!dbUser || dbUser.role !== "admin") {
    redirect("/");
  }

  // Load initial data for client
  const [{ data: users }, { data: reports }] = await Promise.all([
    sb.from("users").select("*").order("created_at", { ascending: false }).limit(50),
    sb.from("reports").select("*").eq("status", "pending").order("created_at", { ascending: false }),
  ]);

  return (
    <AdminClient
      initialUsers={users || []}
      initialReports={reports || []}
      visitorCount={0}
    />
  );
}
