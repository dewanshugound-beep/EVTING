import { currentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase";
import VaultClient from "@/components/VaultClient";

export default async function VaultPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-zinc-500">Sign in to access the Vault.</p>
      </div>
    );
  }

  const sb = createServerSupabase();

  // Get user's projects
  const { data: projects } = await sb
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Get user role
  const { data: dbUser } = await sb
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return (
    <VaultClient
      projects={projects ?? []}
      isAdmin={dbUser?.role === "admin"}
      userId={user.id}
    />
  );
}
