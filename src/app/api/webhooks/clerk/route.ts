import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createServerSupabase } from "@/lib/supabase-server";

type ClerkWebhookEvent = {
  type: string;
  data: Record<string, any>;
};

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get Svix headers
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  // Body parsing for verify
  const body = await req.text();

  // Verify webhook signature (skip in development if needed, but better to use a secret)
  let evt: ClerkWebhookEvent;
  
  // For testing in development, we can allow skipping verification if a specific header is present or just check NODE_ENV
  const skipVerify = process.env.NODE_ENV === 'development' && req.headers.get("x-skip-clerk-verify") === "true";

  if (skipVerify) {
    evt = JSON.parse(body) as ClerkWebhookEvent;
  } else {
    try {
      const wh = new Webhook(WEBHOOK_SECRET);
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkWebhookEvent;
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  const sb = await createServerSupabase();

  console.log(`Clerk Webhook Event: ${evt.type}`);

  // Handle event types
  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, username, first_name, last_name, image_url } =
        evt.data;

      const email = email_addresses?.[0]?.email_address ?? null;
      const displayName = [first_name, last_name].filter(Boolean).join(" ") || username || "User";
      const uname = username || email?.split("@")[0] || id;

      console.log(`Upserting user: ${id} (${email})`);

      const { error } = await sb.from("users").upsert(
        {
          id,
          email,
          username: uname,
          display_name: displayName,
          avatar_url: image_url,
        },
        { onConflict: "id" }
      );

      if (error) {
        console.error("Error upserting user:", JSON.stringify(error));
        return NextResponse.json({ error: "Supabase error", details: error }, { status: 500 });
      } else {
        console.log(`Successfully upserted user: ${id}`);
      }

      break;
    }

    case "user.deleted": {
      const { id } = evt.data;
      if (id) {
        await sb.from("users").delete().eq("id", id);
      }
      break;
    }
  }

  return NextResponse.json({ success: true });
}
