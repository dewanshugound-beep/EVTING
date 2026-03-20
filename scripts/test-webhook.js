
async function test() {
  const payload = {
    type: "user.created",
    data: {
      id: "user_test_123",
      email_addresses: [{ email_address: "test@example.com" }],
      username: "testuser",
      first_name: "Test",
      last_name: "User",
      image_url: "https://example.com/avatar.png"
    }
  };

  const res = await fetch("http://localhost:3000/api/webhooks/clerk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "svix-id": "test",
      "svix-timestamp": "test",
      "svix-signature": "test",
      "x-skip-clerk-verify": "true"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log("Response:", data);
}

test();
