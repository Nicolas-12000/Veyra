"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";



export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("missing_credentials")}`);
  }

  const supabase = await createSupabaseServerClient();
  let redirectUrl = "";

  try {
    // Intentar iniciar sesión con correo y contraseña
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Si no existe el usuario o la contraseña es incorrecta, intentamos registrar al usuario automáticamente
      // para facilitar el flujo en desarrollo/pruebas.
      if (error.message.includes("Invalid login credentials") || error.status === 400) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          if (signUpError.message.toLowerCase().includes("already registered") || signUpError.message.toLowerCase().includes("already exists")) {
            redirectUrl = `/login?error=${encodeURIComponent("Contraseña incorrecta.")}`;
          } else {
            redirectUrl = `/login?error=${encodeURIComponent(signUpError.message || "signup_error")}`;
          }
        } else {
          // Si el registro fue exitoso, intentamos iniciar sesión de nuevo
          const { error: secondSignInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (secondSignInError) {
            redirectUrl = `/login?error=${encodeURIComponent(secondSignInError.message || "signin_after_signup_failed")}`;
          } else {
            redirectUrl = "/dashboard";
          }
        }
      } else {
        redirectUrl = `/login?error=${encodeURIComponent(error.message || "signin_error")}`;
      }
    } else {
      // Inicio de sesión exitoso, ir al dashboard
      redirectUrl = "/dashboard";
    }
  } catch (err: any) {
    redirectUrl = `/login?error=${encodeURIComponent(err?.message || "unexpected_error")}`;
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }
}
