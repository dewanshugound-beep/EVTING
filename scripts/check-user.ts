
import { createServerSupabase } from "../src/lib/supabase";

async function checkUser() {
  const sb = createServerSupabase();
  const { data, error } = await sb
    .from("users")
    .select("*")
    .eq("id", "user_test_123")
    .single();

  if (error) {
    console.error("Error fetching user:", error);
  } else {
    console.log("User in DB:", data);
  }
}

checkUser();
