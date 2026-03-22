"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { getDbUser } from "@/lib/actions";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/feed/actions";

const sb = () => createServerSupabase();

/* ═══════════════════════════════════════════ */
/*  SUBMIT DEV TAG REQUEST                     */
/* ═══════════════════════════════════════════ */
export async function submitDevRequest(reason: string, portfolioUrl: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "dev") return { error: "You're already a verified developer" };
  if (user.role === "admin") return { error: "Admins already have full access" };

  // Check for existing pending request
  const { data: existing } = await sb()
    .from("dev_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) return { error: "You already have a pending request" };

  const { error } = await sb()
    .from("dev_requests")
    .insert({
      user_id: user.id,
      reason,
      portfolio_url: portfolioUrl,
    });

  if (error) throw error;
  return { success: true };
}

/* ═══════════════════════════════════════════ */
/*  GET MY REQUEST STATUS                      */
/* ═══════════════════════════════════════════ */
export async function getMyDevRequest() {
  const user = await getDbUser();
  if (!user) return null;

  const { data } = await sb()
    .from("dev_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

/* ═══════════════════════════════════════════ */
/*  ADMIN: GET ALL DEV REQUESTS                */
/* ═══════════════════════════════════════════ */
export async function getDevRequests(status?: string) {
  const user = await getDbUser();
  if (!user || user.role !== "admin") throw new Error("Admin access required");

  let query = sb()
    .from("dev_requests")
    .select("*, users(id, display_name, username, avatar_url, created_at, role)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  return data || [];
}

/* ═══════════════════════════════════════════ */
/*  ADMIN: APPROVE DEV REQUEST                 */
/* ═══════════════════════════════════════════ */
export async function approveDevRequest(requestId: string) {
  const admin = await getDbUser();
  if (!admin || admin.role !== "admin") throw new Error("Admin access required");

  const supabase = sb();

  // Get the request
  const { data: request } = await supabase
    .from("dev_requests")
    .select("user_id")
    .eq("id", requestId)
    .single();

  if (!request) return { error: "Request not found" };

  // Update request status
  await supabase
    .from("dev_requests")
    .update({ status: "approved", resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  // Promote user to dev
  await supabase
    .from("users")
    .update({ role: "dev" })
    .eq("id", request.user_id);

  // Notify user
  await createNotification(request.user_id, "dev_approved", {
    message: "Congratulations! Your Dev tag request has been approved. You can now upload to the Store.",
  });

  revalidatePath("/admin");
  return { success: true };
}

/* ═══════════════════════════════════════════ */
/*  ADMIN: REJECT DEV REQUEST                  */
/* ═══════════════════════════════════════════ */
export async function rejectDevRequest(requestId: string, reason: string) {
  const admin = await getDbUser();
  if (!admin || admin.role !== "admin") throw new Error("Admin access required");

  const supabase = sb();

  const { data: request } = await supabase
    .from("dev_requests")
    .select("user_id")
    .eq("id", requestId)
    .single();

  if (!request) return { error: "Request not found" };

  await supabase
    .from("dev_requests")
    .update({ status: "rejected", admin_note: reason, resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  // Notify user
  await createNotification(request.user_id, "dev_rejected", {
    message: `Your Dev tag request was declined. Reason: ${reason}`,
    reason,
  });

  revalidatePath("/admin");
  return { success: true };
}

/* ═══════════════════════════════════════════ */
/*  ADMIN: USER MANAGEMENT                     */
/* ═══════════════════════════════════════════ */
export async function adminGetUsers(search?: string) {
  const admin = await getDbUser();
  if (!admin || admin.role !== "admin") throw new Error("Admin access required");

  let query = sb()
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (search) {
    query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data } = await query;
  return data || [];
}

export async function adminBanUser(userId: string) {
  const admin = await getDbUser();
  if (!admin || admin.role !== "admin") throw new Error("Admin access required");

  await sb().from("users").update({ is_banned: true }).eq("id", userId);
  await createNotification(userId, "ban", { message: "Your account has been suspended." });

  revalidatePath("/admin");
  return { success: true };
}

export async function adminUnbanUser(userId: string) {
  const admin = await getDbUser();
  if (!admin || admin.role !== "admin") throw new Error("Admin access required");

  await sb().from("users").update({ is_banned: false }).eq("id", userId);
  revalidatePath("/admin");
  return { success: true };
}

export async function adminSetRole(userId: string, role: string) {
  const admin = await getDbUser();
  if (!admin || admin.role !== "admin") throw new Error("Admin access required");

  if (!["member", "dev", "admin"].includes(role)) return { error: "Invalid role" };

  await sb().from("users").update({ role }).eq("id", userId);
  revalidatePath("/admin");
  return { success: true };
}

export async function adminWarnUser(userId: string, message: string) {
  const admin = await getDbUser();
  if (!admin || admin.role !== "admin") throw new Error("Admin access required");

  await createNotification(userId, "warn", {
    message: `⚠️ Warning from admin: ${message}`,
    admin_id: admin.id,
  });

  revalidatePath("/admin");
  return { success: true };
}

/* ═══════════════════════════════════════════ */
/*  ADMIN: REPORTS                             */
/* ═══════════════════════════════════════════ */
export async function adminGetReports(status?: string) {
  const admin = await getDbUser();
  if (!admin || admin.role !== "admin") throw new Error("Admin access required");

  let query = sb()
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  return data || [];
}

export async function adminDismissReport(reportId: string) {
  const admin = await getDbUser();
  if (!admin || admin.role !== "admin") throw new Error("Admin access required");

  await sb().from("reports").update({ status: "dismissed" }).eq("id", reportId);
  revalidatePath("/admin");
  return { success: true };
}

/* ═══════════════════════════════════════════ */
/*  ADMIN: PLATFORM STATS                     */
/* ═══════════════════════════════════════════ */
export async function getAdminStats() {
  const admin = await getDbUser();
  if (!admin || admin.role !== "admin") throw new Error("Admin access required");

  const supabase = sb();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: newToday },
    { count: newThisWeek },
    { count: totalPosts },
    { count: pendingDevRequests },
    { count: pendingListings },
    { count: pendingReports },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", weekStart),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("dev_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("store_listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return {
    totalUsers: totalUsers || 0,
    newToday: newToday || 0,
    newThisWeek: newThisWeek || 0,
    totalPosts: totalPosts || 0,
    pendingDevRequests: pendingDevRequests || 0,
    pendingListings: pendingListings || 0,
    pendingReports: pendingReports || 0,
  };
}

/* ═══════════════════════════════════════════ */
/*  REPORT CONTENT (for all users)             */
/* ═══════════════════════════════════════════ */
export async function reportContent(
  targetType: "post" | "listing" | "user",
  targetId: string,
  reason: string
) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  await sb().from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    status: "open",
  });

  return { success: true };
}
