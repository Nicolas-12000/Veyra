import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const isProtectedPath = [
    "/dashboard",
    "/session",
    "/analytics",
    "/profile",
    "/body-weight",
    "/routines",
  ].some((path) => req.nextUrl.pathname.startsWith(path));

  const isLoginPath = req.nextUrl.pathname === "/login";

  // Evitar la consulta a Supabase si no estamos en una ruta protegida o de login
  if (!isProtectedPath && !isLoginPath) {
    return res;
  }

  // Si es un prefetch de Next.js, no necesitamos verificar la sesión en el middleware.
  // La navegación real (no prefetch) pasará por aquí para verificar el estado de la sesión.
  if (req.headers.has("x-middleware-prefetch")) {
    return res;
  }

  // Usamos getSession() en lugar de getUser() en el middleware para evitar 
  // peticiones de red redundantes. La seguridad real y getUser() se ejecuta 
  // en los Server Components (requireUserId). Aquí getSession() sólo sirve
  // para refrescar el JWT de forma pasiva si ha expirado.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rutas estrictamente protegidas: redirigir al login si no hay sesión
  if (isProtectedPath && !session) {
    const redirectRes = NextResponse.redirect(new URL("/login", req.url));
    // Conservar cookies que se hayan actualizado
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        redirectRes.headers.append('set-cookie', value);
      }
    });
    return redirectRes;
  }

  // Si ya está logueado y va al login, redirigir al dashboard
  if (isLoginPath && session) {
    const redirectRes = NextResponse.redirect(new URL("/dashboard", req.url));
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        redirectRes.headers.append('set-cookie', value);
      }
    });
    return redirectRes;
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/callback).*)",
  ],
};
