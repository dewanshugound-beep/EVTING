"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { requireAuth, getDbUser } from "@/lib/actions";
import { revalidatePath } from "next/cache";

const sb = () => createServerSupabase();

export async function getReports() {
  const user = await getDbUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized access.");

  const { data } = await sb()
    .from("reports")
    .select("*, users!reporter_id(display_name, username)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function dismissReport(reportId: string) {
  const user = await getDbUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized access.");

  const { error } = await sb()
    .from("reports")
    .update({ status: "dismissed" })
    .eq("id", reportId);

  if (error) throw error;
  revalidatePath("/admin");
  return { success: true };
}

export async function resolveReport(reportId: string, contentId: string, contentType: "message" | "project") {
  const user = await getDbUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized access.");

  const supabase = sb();

  // 1. Delete the content
  const table = contentType === "message" ? "messages" : "projects_vault";
  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq("id", contentId);

  if (deleteError) throw deleteError;

  // 2. Mark report as resolved
  const { error: reportError } = await supabase
    .from("reports")
    .update({ status: "resolved" })
    .eq("id", reportId);

  if (reportError) throw reportError;

  revalidatePath("/admin");
  revalidatePath("/chat");
  revalidatePath("/explore");
  return { success: true };
}
