"use server";

import { createServerSupabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/actions";

const sb = () => createServerSupabase();

/* ─── Get Channels ─── */
export async function getChannels() {
  const { data } = await sb()
    .from("channels")
    .select("*")
    .order("created_at", { ascending: true });
  return data ?? [];
}

/* ─── Get Channel Messages ─── */
export async function getMessages(channelId: string) {
  const { data } = await sb()
    .from("messages")
    .select("*, users(id, display_name, avatar_url, username)")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(100);
  return data ?? [];
}

/* ─── Send Message ─── */
export async function sendMessage(channelId: string, body: string) {
  const user = await requireAuth();
  if (!body?.trim()) return { error: "Empty message" };

  const { data, error } = await sb()
    .from("messages")
    .insert({ channel_id: channelId, user_id: user.id, body: body.trim() })
    .select("*, users(id, display_name, avatar_url, username)")
    .single();

  if (error) throw error;
  return { success: true, message: data };
}

/* ─── Create DM Channel ─── */
export async function createDM(targetUserId: string) {
  const user = await requireAuth();
  const supabase = sb();

  // Check if DM already exists
  const { data: existing } = await supabase
    .from("channel_members")
    .select("channel_id, channels!inner(type)")
    .eq("user_id", user.id);

  for (const cm of existing ?? []) {
    if ((cm as any).channels?.type === "dm") {
      const { data: otherMember } = await supabase
        .from("channel_members")
        .select("user_id")
        .eq("channel_id", cm.channel_id)
        .eq("user_id", targetUserId)
        .maybeSingle();
      if (otherMember) return { channelId: cm.channel_id };
    }
  }

  // Create new DM
  const { data: targetUser } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", targetUserId)
    .single();

  const { data: channel } = await supabase
    .from("channels")
    .insert({
      name: `DM`,
      type: "dm",
    })
    .select("id")
    .single();

  if (!channel) throw new Error("Failed to create DM");

  await supabase.from("channel_members").insert([
    { channel_id: channel.id, user_id: user.id },
    { channel_id: channel.id, user_id: targetUserId },
  ]);

  return { channelId: channel.id };
}

/* ─── Add Reaction ─── */
export async function addReaction(messageId: string, emoji: string) {
  const user = await requireAuth();
  const { error } = await sb()
    .from("message_reactions")
    .insert({ message_id: messageId, user_id: user.id, emoji });
  if (error?.code === "23505") return { error: "Already reacted" };
  if (error) throw error;
  return { success: true };
}
/* ─── Remove Reaction ─── */
export async function removeReaction(messageId: string, emoji: string) {
  const user = await requireAuth();
  await sb()
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji);
  return { success: true };
}

/* ─── Mark as Read ─── */
export async function markAsRead(channelId: string) {
  const user = await requireAuth();
  await sb()
    .from("channel_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);
  return { success: true };
}

/* ─── Get Reactions for a Message ─── */
export async function getReactions(messageId: string) {
  const { data } = await sb()
    .from("message_reactions")
    .select("emoji, user_id, users(display_name)")
    .eq("message_id", messageId);
  return data ?? [];
}

/* ─── Delete Message ─── */
export async function deleteMessage(messageId: string) {
  const user = await requireAuth();
  
  const { error } = await sb()
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("user_id", user.id);

  if (error) throw error;
  return { success: true };
}

