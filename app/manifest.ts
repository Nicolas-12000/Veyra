import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Veyra — Tracker de Entrenamiento",
    short_name: "Veyra",
    description:
      "Tracker de entrenamiento personal de largo plazo. Registra series, analiza progresión de 1RM y detecta mesetas.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0D0D10",
    theme_color: "#C8F135",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["health", "fitness", "sports"],
    lang: "es",
    dir: "ltr",
    prefer_related_applications: false,
    shortcuts: [
      {
        name: "Iniciar Sesión",
        short_name: "Sesión",
        description: "Comenzar un nuevo entrenamiento",
        url: "/routines",
        icons: [{ src: "/favicon.ico", sizes: "any" }],
      },
      {
        name: "Analítica",
        short_name: "Stats",
        description: "Ver progresión y estadísticas",
        url: "/analytics",
        icons: [{ src: "/favicon.ico", sizes: "any" }],
      },
    ],
  };
}
