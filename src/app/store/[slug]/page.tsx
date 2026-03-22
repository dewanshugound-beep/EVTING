import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import StoreDetailClient from "./StoreDetailClient";

export default async function StoreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await createServerSupabase();

  const { data: listing } = await sb
    .from("store_listings")
    .select("*, users(id, display_name, avatar_url, username, role)")
    .eq("slug", slug)
    .single();

  if (!listing) notFound();

  const { data: reviews } = await sb
    .from("store_reviews")
    .select("*, users(display_name, avatar_url, username)")
    .eq("listing_id", listing.id)
    .order("created_at", { ascending: false });

  return <StoreDetailClient listing={listing} reviews={reviews || []} />;
}
