import { createServerSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";
import { getReports } from "./actions";

export default async function AdminPage() {
  const supabase = createServerSupabase();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!dbUser || dbUser.role !== "admin") {
    redirect("/");
  }

  const { data: users } = await supabase
    .from("users")
    .select("id, email, display_name, username, role, avatar_url, is_banned, created_at, message_count")
    .order("created_at", { ascending: false });

  const { data: stats } = await supabase
    .from("site_stats")
    .select("visitor_count")
    .eq("id", 1)
    .single();

  const reports = await getReports();

  return (
    <AdminClient 
      initialUsers={users || []} 
      initialReports={reports || []} 
      visitorCount={stats?.visitor_count || 0}
    />
  );
}
