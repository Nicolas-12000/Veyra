import type { Metadata } from "next";
import { signInWithPassword } from "@/src/modules/auth/actions";
import { Dumbbell } from "lucide-react";

export const metadata: Metadata = {
  title: "Entrar — Veyra",
  description: "Inicia sesión en Veyra para acceder a tu tracker de entrenamiento.",
};

type SearchParamsShape = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape | Promise<SearchParamsShape>;
}) {
  const sp: SearchParamsShape = searchParams ? await searchParams : {};
  const errorMsg = sp?.error ? decodeURIComponent(String(sp.error)) : null;
  const infoMsg = sp?.info ? String(sp.info) : null;
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-canvas-light)" }}
    >
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center"
          style={{ background: "var(--color-primary)", borderRadius: "var(--radius-lg)" }}
        >
          <Dumbbell className="h-8 w-8" style={{ color: "#FFFFFF" }} strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <h1
            style={{
              color: "var(--color-ink-on-light)",
              fontSize: "36px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            Veyra
          </h1>
          <p
            className="mt-1"
            style={{
              color: "#71717A",
              fontSize: "14px",
            }}
          >
            Tu tracker de entrenamiento personal
          </p>
        </div>
      </div>

      {/* Login card */}
      <div
        className="w-full p-8"
        style={{
          background: "var(--color-canvas-white)",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: "var(--radius-xl)",
          maxWidth: 360,
          minWidth: 320,
          width: "100%",
        }}
      >
        <h2
          className="mb-2 text-center"
          style={{
            color: "var(--color-ink-on-light)",
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Bienvenido de vuelta
        </h2>
        <p
          className="mb-8 text-center"
          style={{ color: "#71717A", fontSize: "14px" }}
        >
          Inicia sesión para continuar
        </p>

        {errorMsg && (
          <div
            className="mb-4 p-3 text-sm"
            style={{
              background: "var(--color-danger-subtle)",
              color: "var(--color-danger)",
              borderRadius: "var(--radius-md)",
            }}
          >
            Error: {errorMsg}
          </div>
        )}

        <form action={signInWithPassword} className="mb-4">
          <label
            className="mb-1 block text-sm font-medium"
            style={{ color: "var(--color-ink-on-light)" }}
          >
            Correo electrónico
          </label>
          <input
            name="email"
            type="email"
            required
            className="mb-3 w-full px-3 py-2 text-sm"
            placeholder="tu@correo.com"
            style={{
              width: "100%",
              minWidth: 240,
              height: 48,
              borderRadius: "var(--radius-md)",
              color: "var(--color-ink-on-light)",
              backgroundColor: "var(--color-canvas-white)",
              border: "1px solid #D1D5DB",
              outline: "none",
            }}
          />

          <label
            className="mb-1 block text-sm font-medium"
            style={{ color: "var(--color-ink-on-light)" }}
          >
            Contraseña
          </label>
          <input
            name="password"
            type="password"
            required
            className="mb-4 w-full px-3 py-2 text-sm"
            placeholder="••••••••"
            style={{
              width: "100%",
              minWidth: 240,
              height: 48,
              borderRadius: "var(--radius-md)",
              color: "var(--color-ink-on-light)",
              backgroundColor: "var(--color-canvas-white)",
              border: "1px solid #D1D5DB",
              outline: "none",
            }}
          />

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 text-sm font-semibold transition-all duration-100 hover:opacity-90 active:scale-95 whitespace-nowrap"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-ink-on-primary)",
              border: "none",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              height: 48,
              borderRadius: "var(--radius-pill)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Continuar
          </button>
        </form>

        {infoMsg === "check_email" && (
          <div
            className="mb-4 p-3 text-sm"
            style={{
              background: "var(--color-success-subtle)",
              color: "var(--color-success)",
              borderRadius: "var(--radius-md)",
            }}
          >
            Revisa tu correo para continuar.
          </div>
        )}

        <p
          className="mt-6 text-center text-xs"
          style={{ color: "#A1A1AA" }}
        >
          Al continuar, aceptas nuestros{" "}
          <span style={{ color: "var(--color-primary)" }}>Términos de servicio</span> y{" "}
          <span style={{ color: "var(--color-primary)" }}>Política de privacidad</span>.
        </p>
      </div>

      {/* Tagline */}
      <p
        className="mt-8 text-center text-xs"
        style={{ color: "#A1A1AA" }}
      >
        Registra series. Detecta mesetas. Progresa.
      </p>
    </div>
  );
}
