import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // If there was an error exchanging the code, redirect with message
    const msg = encodeURIComponent(error?.message || "exchange_failed");
    return NextResponse.redirect(`${origin}/login?error=${msg}`);
  }

  // Algo salió mal — redirigir al login con error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
