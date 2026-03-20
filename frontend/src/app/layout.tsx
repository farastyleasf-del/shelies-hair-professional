import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { ChatProvider } from "@/lib/chat-context";
import LayoutShell from "@/components/LayoutShell";

export const metadata: Metadata = {
  title: {
    default: "Shelie's Hair Professional — Tienda Capilar Premium",
    template: "%s — Shelie's Hair Professional",
  },
  description:
    "Alisados orgánicos, botox capilar y rutinas profesionales para cabello. Control de frizz, brillo y reparación. Bogotá, Colombia.",
  keywords: ["alisado orgánico bogotá", "botox capilar", "control frizz", "shelie siempre bellas", "productos capilares colombia", "tratamiento capilar"],
  metadataBase: new URL("https://shelies.com"),
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Shelie's Hair Professional",
    title: "Shelie's Hair Professional — Tienda Capilar Premium",
    description: "Alisados orgánicos, botox capilar y rutinas profesionales. Control de frizz, brillo y reparación. Bogotá, Colombia.",
    images: [{ url: "/images/shelies-logo-real.jpg", width: 512, height: 512, alt: "Shelie's Hair Professional" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shelie's Hair Professional",
    description: "Alisados orgánicos y rutinas capilares premium. Bogotá.",
    images: ["/images/shelies-logo-real.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <CartProvider>
          <ChatProvider>
            <LayoutShell>{children}</LayoutShell>
          </ChatProvider>
        </CartProvider>
      </body>
    </html>
  );
}
