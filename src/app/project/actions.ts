"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { requireAuth, slugify } from "@/lib/actions";
import { getRank, XP_REWARDS } from "@/lib/rank";

// Using await createServerSupabase() directly in functions for async safety

const FREE_PROJECT_LIMIT = 2;

/* ─── Create Project ─── */
export async function createProject(formData: FormData) {
  const user = await requireAuth();
  const supabase = (await createServerSupabase());

  // Check user role + project count
  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (dbUser?.role !== "admin") {
    const { count } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= FREE_PROJECT_LIMIT) {
      return { error: "PROJECT_LIMIT_REACHED" };
    }
  }

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const slug = slugify(title) + "-" + Date.now().toString(36);
  const description = (formData.get("description") as string) || "";
  const readme_md = (formData.get("readme_md") as string) || "";
  const install_command = (formData.get("install_command") as string) || "";
  const tagsRaw = (formData.get("tags") as string) || "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const linksRaw = (formData.get("external_links") as string) || "[]";
  let external_links;
  try {
    external_links = JSON.parse(linksRaw);
  } catch {
    external_links = [];
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title,
      slug,
      description,
      readme_md,
      install_command,
      tags,
      external_links,
    })
    .select("slug")
    .single();

  if (error) throw error;

  // Award XP
  await supabase.rpc("increment_xp", {
    user_id_param: user.id,
    amount: XP_REWARDS.PROJECT_UPLOAD,
  });

  return { success: true, slug: data.slug };
}

/* ─── Update Project ─── */
export async function updateProject(projectId: string, formData: FormData) {
  const user = await requireAuth();
  const supabase = (await createServerSupabase());

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  const title = formData.get("title") as string;
  if (title) updates.title = title.trim();
  const description = formData.get("description") as string;
  if (description !== null) updates.description = description;
  const readme_md = formData.get("readme_md") as string;
  if (readme_md !== null) updates.readme_md = readme_md;
  const install_command = formData.get("install_command") as string;
  if (install_command !== null) updates.install_command = install_command;
  const tagsRaw = formData.get("tags") as string;
  if (tagsRaw !== null) {
    updates.tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }
  const linksRaw = formData.get("external_links") as string;
  if (linksRaw) {
    try {
      updates.external_links = JSON.parse(linksRaw);
    } catch { /* ignore */ }
  }

  await supabase.from("projects").update(updates).eq("id", projectId);
  return { success: true };
}

/* ─── Delete Project ─── */
export async function deleteProject(projectId: string) {
  const user = await requireAuth();
  const supabase = sb();
  const { data } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();
  if (!data || data.user_id !== user.id) return { error: "Unauthorized" };
  await supabase.from("projects").delete().eq("id", projectId);
  return { success: true };
}

/* ─── Toggle Star ─── */
export async function toggleStar(projectId: string) {
  const user = await requireAuth();
  const supabase = sb();

  const { data: existing } = await supabase
    .from("stars")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("stars")
      .delete()
      .eq("user_id", user.id)
      .eq("project_id", projectId);
    await supabase.rpc("decrement_star_count", { project_id_param: projectId });
    return { starred: false };
  } else {
    await supabase
      .from("stars")
      .insert({ user_id: user.id, project_id: projectId });
    await supabase.rpc("increment_star_count", { project_id_param: projectId });

    // XP to project owner
    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single();
    if (project) {
      await supabase.rpc("increment_xp", {
        user_id_param: project.user_id,
        amount: XP_REWARDS.STAR_RECEIVED,
      });
    }

    return { starred: true };
  }
}

/* ─── Add Comment ─── */
export async function addComment(projectId: string, body: string) {
  const user = await requireAuth();
  if (!body?.trim()) return { error: "Comment cannot be empty" };

  const supabase = sb();
  const { data, error } = await supabase
    .from("comments")
    .insert({ project_id: projectId, user_id: user.id, body: body.trim() })
    .select("*, users(display_name, avatar_url, username)")
    .single();

  if (error) throw error;

  // Increment comment count
  await supabase.rpc("increment_comment_count", { project_id_param: projectId });

  // XP
  await supabase.rpc("increment_xp", {
    user_id_param: user.id,
    amount: XP_REWARDS.COMMENT_POSTED,
  });

  return { success: true, comment: data };
}

/* ─── Delete Comment ─── */
export async function deleteComment(commentId: string, projectId: string) {
  const user = await requireAuth();
  const supabase = sb();
  const { data } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", commentId)
    .single();
  if (!data || data.user_id !== user.id) return { error: "Unauthorized" };
  await supabase.from("comments").delete().eq("id", commentId);
  await supabase.rpc("decrement_comment_count", { project_id_param: projectId });
  return { success: true };
}

/* ─── Get Project ─── */
export async function getProject(slug: string) {
  const supabase = sb();
  const { data } = await supabase
    .from("projects")
    .select("*, users(id, display_name, avatar_url, username, rank)")
    .eq("slug", slug)
    .single();
  return data;
}

/* ─── Get Comments ─── */
export async function getComments(projectId: string) {
  const { data } = await sb()
    .from("comments")
    .select("*, users(display_name, avatar_url, username)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/* ─── Record View ─── */
export async function recordView(projectId: string) {
  const supabase = sb();
  await supabase.from("project_views").insert({ project_id: projectId });
  await supabase.rpc("increment_view_count", { project_id_param: projectId });
}

/* ─── Get Official Projects ─── */
export async function getOfficialProjects() {
  const { data } = await sb()
    .from("projects")
    .select("*, users(display_name, avatar_url, username)")
    .eq("is_official", true)
    .eq("is_published", true)
    .order("star_count", { ascending: false })
    .limit(10);
  return data ?? [];
}

/* ─── Get Top Users (Leaderboard) ─── */
export async function getTopUsers() {
  const { data } = await sb()
    .from("users")
    .select("id, display_name, avatar_url, username, xp, rank")
    .order("xp", { ascending: false })
    .limit(10);
  return data ?? [];
}

/* ─── Check if User Starred ─── */
export async function hasStarred(userId: string, projectId: string) {
  const { data } = await sb()
    .from("stars")
    .select("user_id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();
  return !!data;
}
