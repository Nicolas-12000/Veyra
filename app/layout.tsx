import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Veyra — Tu tracker de entrenamiento",
    template: "%s | Veyra",
  },
  description:
    "Tracker de entrenamiento personal de largo plazo. Registra series, analiza progresión de 1RM y detecta mesetas antes de que afecten tus resultados.",
  keywords: ["gym", "entrenamiento", "tracker", "1RM", "fuerza", "musculación"],
  authors: [{ name: "Veyra" }],
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Veyra — Tu tracker de entrenamiento",
    description: "Data-app de entrenamiento para lifters serios.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Veyra",
  },
};

export const viewport: Viewport = {
  themeColor: "#6B7BFF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={inter.variable}
    >
      <head>
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className="min-h-dvh flex flex-col antialiased">
        {children}
        <Script
          id="service-worker-register"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

