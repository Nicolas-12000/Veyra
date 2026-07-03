import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cache } from "react";

import { headers } from "next/headers";

// Cache the fast local session parse per-request
const getCachedSessionUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.user) {
    return null;
  }
  return data.session.user;
});

export async function getCurrentUser(options?: { forceFresh?: boolean }) {
  let forceFresh = options?.forceFresh;

  if (!forceFresh) {
    try {
      const reqHeaders = await headers();
      if (reqHeaders.has("next-action")) {
        forceFresh = true;
      }
    } catch {
      // In static generation or other contexts where headers() is not available
    }
  }

  if (forceFresh) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return null;
    }
    return data.user;
  }
  return getCachedSessionUser();
}

export async function requireUserId(options?: { forceFresh?: boolean }) {
  const user = await getCurrentUser(options);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user.id;
}

export async function getUserId(options?: { forceFresh?: boolean }) {
  const user = await getCurrentUser(options);
  return user?.id || null;
}
