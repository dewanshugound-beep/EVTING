"use server";

import { createServerSupabase } from "@/lib/supabase";
import { requireAuth, getDbUser, slugify } from "@/lib/actions";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/feed/actions";

const sb = () => createServerSupabase();

/* ─── Role Helpers ─── */
async function requireDev() {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");
  if (user.is_banned) throw new Error("Account suspended");
  if (user.role !== "dev" && user.role !== "admin") {
    throw new Error("Only verified developers can upload to the store");
  }
  return user;
}

async function requireAdmin() {
  const user = await getDbUser();
  if (!user || user.role !== "admin") throw new Error("Admin access required");
  return user;
}

/* ═══════════════════════════════════════════ */
/*  GET STORE LISTINGS (browse)                */
/* ═══════════════════════════════════════════ */
export async function getStoreListings(options?: {
  category?: string;
  search?: string;
  sort?: "trending" | "newest" | "top" | "editors";
  limit?: number;
  cursor?: string;
  status?: string;
}) {
  const supabase = sb();
  const limit = options?.limit || 20;

  let query = supabase
    .from("store_listings")
    .select("*, users(id, display_name, avatar_url, username, role)")
    .eq("status", options?.status || "approved")
    .limit(limit);

  // Category filter
  if (options?.category && options.category !== "all") {
    query = query.eq("category", options.category);
  }

  // Search
  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
  }

  // Sort
  switch (options?.sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "top":
      query = query.order("star_count", { ascending: false });
      break;
    case "editors":
      query = query.eq("is_editors_pick", true).order("star_count", { ascending: false });
      break;
    case "trending":
    default:
      query = query.order("download_count", { ascending: false });
      break;
  }

  // Pagination
  if (options?.cursor) {
    query = query.lt("created_at", options.cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/* ═══════════════════════════════════════════ */
/*  GET SINGLE LISTING                         */
/* ═══════════════════════════════════════════ */
export async function getStoreListing(slug: string) {
  const { data } = await sb()
    .from("store_listings")
    .select("*, users(id, display_name, avatar_url, username, role)")
    .eq("slug", slug)
    .single();
  return data;
}

/* ═══════════════════════════════════════════ */
/*  CREATE STORE LISTING (Dev only)            */
/* ═══════════════════════════════════════════ */
export async function createStoreListing(formData: FormData) {
  const user = await requireDev();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const slug = slugify(title) + "-" + Date.now().toString(36);
  const description = (formData.get("description") as string) || "";
  const readme_md = (formData.get("readme_md") as string) || "";
  const version = (formData.get("version") as string) || "1.0.0";
  const category = (formData.get("category") as string) || "scripts";
  const license = (formData.get("license") as string) || "MIT";
  const os_requirements = (formData.get("os_requirements") as string) || "";
  const install_command = (formData.get("install_command") as string) || "";
  const file_url = (formData.get("file_url") as string) || "";
  const tagsRaw = (formData.get("tags") as string) || "";
  const tags = tagsRaw.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);

  let screenshots: string[] = [];
  const screenshotsRaw = formData.get("screenshots") as string;
  if (screenshotsRaw) {
    try { screenshots = JSON.parse(screenshotsRaw); } catch {}
  }

  const { data, error } = await sb()
    .from("store_listings")
    .insert({
      user_id: user.id,
      title,
      slug,
      description,
      readme_md,
      version,
      category,
      license,
      os_requirements,
      install_command,
      tags,
      file_url,
      screenshots,
      status: user.role === "admin" ? "approved" : "pending", // Admins auto-approve
    })
    .select("slug")
    .single();

  if (error) throw error;

  revalidatePath("/store");
  return { success: true, slug: data.slug, status: user.role === "admin" ? "approved" : "pending" };
}

/* ═══════════════════════════════════════════ */
/*  TOGGLE STAR                                */
/* ═══════════════════════════════════════════ */
export async function toggleListingStar(listingId: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = sb();

  const { data: existing } = await supabase
    .from("store_stars")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    await supabase.from("store_stars").delete().eq("id", existing.id);
    await supabase.rpc("decrement_listing_stars", { listing_id_param: listingId });
    return { starred: false };
  } else {
    await supabase.from("store_stars").insert({ user_id: user.id, listing_id: listingId });
    await supabase.rpc("increment_listing_stars", { listing_id_param: listingId });

    // Notify listing author
    const { data: listing } = await supabase.from("store_listings").select("user_id").eq("id", listingId).single();
    if (listing && listing.user_id !== user.id) {
      await createNotification(listing.user_id, "star", {
        actor_id: user.id,
        actor_name: user.display_name || user.username,
        listing_id: listingId,
      });
    }

    return { starred: true };
  }
}

/* ═══════════════════════════════════════════ */
/*  CHECK IF USER STARRED                      */
/* ═══════════════════════════════════════════ */
export async function hasStarredListing(userId: string, listingId: string) {
  const { data } = await sb()
    .from("store_stars")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();
  return !!data;
}

/* ═══════════════════════════════════════════ */
/*  RECORD DOWNLOAD                            */
/* ═══════════════════════════════════════════ */
export async function recordDownload(listingId: string) {
  const user = await getDbUser();
  const supabase = sb();

  await supabase.from("store_downloads").insert({
    user_id: user?.id || null,
    listing_id: listingId,
  });
  await supabase.rpc("increment_listing_downloads", { listing_id_param: listingId });

  // Notify author
  const { data: listing } = await supabase.from("store_listings").select("user_id").eq("id", listingId).single();
  if (listing && user && listing.user_id !== user.id) {
    await supabase.rpc("increment_reputation", { user_id_param: listing.user_id, amount: 2 });
  }

  return { success: true };
}

/* ═══════════════════════════════════════════ */
/*  ADD REVIEW                                 */
/* ═══════════════════════════════════════════ */
export async function addStoreReview(listingId: string, body: string, rating: number) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");
  if (rating < 1 || rating > 5) return { error: "Rating must be 1-5" };

  const { data, error } = await sb()
    .from("store_reviews")
    .insert({ user_id: user.id, listing_id: listingId, body, rating })
    .select("*, users(display_name, avatar_url, username)")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "You already reviewed this listing" };
    throw error;
  }

  // Recalculate average rating
  await sb().rpc("recalc_listing_rating", { listing_id_param: listingId });

  return { success: true, review: data };
}

/* ═══════════════════════════════════════════ */
/*  GET REVIEWS                                */
/* ═══════════════════════════════════════════ */
export async function getStoreReviews(listingId: string) {
  const { data } = await sb()
    .from("store_reviews")
    .select("*, users(display_name, avatar_url, username)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  return data || [];
}

/* ═══════════════════════════════════════════ */
/*  REPORT LISTING                             */
/* ═══════════════════════════════════════════ */
export async function reportListing(listingId: string, reason: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  await sb().from("reports").insert({
    reporter_id: user.id,
    content_id: listingId,
    content_type: "listing",
    reason,
    status: "pending",
  });

  return { success: true };
}

/* ═══════════════════════════════════════════ */
/*  ADMIN: APPROVE / REJECT LISTING            */
/* ═══════════════════════════════════════════ */
export async function approveStoreListing(listingId: string) {
  const admin = await requireAdmin();

  await sb().from("store_listings").update({ status: "approved" }).eq("id", listingId);

  // Notify the author
  const { data: listing } = await sb().from("store_listings").select("user_id, title").eq("id", listingId).single();
  if (listing) {
    await createNotification(listing.user_id, "listing_approved", {
      listing_id: listingId,
      title: listing.title,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/store");
  return { success: true };
}

export async function rejectStoreListing(listingId: string, reason: string) {
  const admin = await requireAdmin();

  await sb().from("store_listings").update({ status: "rejected", admin_note: reason }).eq("id", listingId);

  const { data: listing } = await sb().from("store_listings").select("user_id, title").eq("id", listingId).single();
  if (listing) {
    await createNotification(listing.user_id, "listing_rejected", {
      listing_id: listingId,
      title: listing.title,
      reason,
    });
  }

  revalidatePath("/admin");
  return { success: true };
}

/* ═══════════════════════════════════════════ */
/*  ADMIN: GET PENDING LISTINGS                */
/* ═══════════════════════════════════════════ */
export async function getPendingListings() {
  const admin = await requireAdmin();

  const { data } = await sb()
    .from("store_listings")
    .select("*, users(id, display_name, username, avatar_url)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return data || [];
}

/* ═══════════════════════════════════════════ */
/*  GET USER'S LISTINGS (for profile)          */
/* ═══════════════════════════════════════════ */
export async function getUserListings(userId: string) {
  const { data } = await sb()
    .from("store_listings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}
