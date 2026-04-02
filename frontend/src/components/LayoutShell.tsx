"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin        = pathname.startsWith("/admin");
  const isAgente       = pathname.startsWith("/agente");
  const isEstilista    = pathname.startsWith("/estilista");
  const isDomiciliario = pathname.startsWith("/domiciliario");

  if (isAdmin || isAgente || isEstilista || isDomiciliario) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </>
  );
}
