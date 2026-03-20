
const { createClient } = require("@supabase/supabase-js");

async function checkUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing env vars", { url: !!url, key: !!key });
    return;
  }

  const sb = createClient(url, key);
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
