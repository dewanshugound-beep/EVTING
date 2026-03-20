"use server";

import { createServerSupabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/actions";
import { revalidatePath } from "next/cache";

const sb = () => createServerSupabase();

export async function getVaultProjects() {
  const { data } = await sb()
    .from("projects_vault")
    .select("*, users(id, display_name, avatar_url, username)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function uploadVaultProject(formData: FormData) {
  const user = await requireAuth();
  
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const fileUrl = formData.get("file_url") as string;

  if (!title || !fileUrl) {
    throw new Error("Missing title or file signal.");
  }

  const { data, error } = await sb()
    .from("projects_vault")
    .insert({
      user_id: user.id,
      title,
      description,
      category,
      file_url: fileUrl,
    })
    .select()
    .single();

  if (error) throw error;
  
  revalidatePath("/explore");
  return { success: true, project: data };
}

export async function reportVaultContent(contentId: string, contentType: "message" | "project", reason: string) {
  const user = await requireAuth();
  
  const { error } = await sb()
    .from("reports")
    .insert({
      reporter_id: user.id,
      content_id: contentId,
      content_type: contentType,
      reason,
      status: "pending"
    });

  if (error) throw error;
  return { success: true };
}
