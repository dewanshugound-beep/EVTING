import { currentUser } from "@/lib/auth";
import { createServerSupabase } from "./supabase";

/**
 * Get the currently authenticated Clerk user or throw.
 */
export async function requireAuth() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

/**
 * Ensure the current user exists in Supabase and return their DB record.
 */
export async function getDbUser() {
  const user = await requireAuth();
  const sb = createServerSupabase();
  const { data } = await sb
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}

/**
 * Generate a slug from a title string.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
