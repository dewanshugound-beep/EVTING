"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user && mounted) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single();
        if (mounted) setUser(dbUser || data.user);
      }
      if (mounted) setIsLoaded(true);
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        if (mounted) setUser(null);
      } else {
        const { data: dbUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (mounted) setUser(dbUser || session.user);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, isLoaded, isSignedIn: !!user };
}

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  return { userId: user?.id ?? null, isLoaded, isSignedIn };
}

export function SignInButton({
  children,
  mode: _mode,
}: {
  children?: React.ReactNode;
  mode?: string;
}) {
  return (
    <Link href="/login">
      {children ?? (
        <button className="rounded-xl bg-[#58a6ff] px-4 py-2 text-xs font-bold text-white cursor-pointer">
          Sign In
        </button>
      )}
    </Link>
  );
}

export function UserButton({ appearance: _a }: { appearance?: any } = {}) {
  const { user } = useUser();
  if (!user) return null;
  return (
    <Link
      href={`/u/${user.username || ""}`}
      className="w-8 h-8 rounded-full overflow-hidden border border-white/20 inline-flex shrink-0 items-center justify-center"
    >
      {user.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-[#58a6ff]">
          {(user.username || user.email || "U").charAt(0).toUpperCase()}
        </span>
      )}
    </Link>
  );
}

export function SignIn() {
  return <div>Redirecting...</div>;
}

export function SignUp() {
  return <div>Redirecting...</div>;
}

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
