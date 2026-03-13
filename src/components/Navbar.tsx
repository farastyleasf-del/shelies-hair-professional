"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useChat } from "@/lib/chat-context";

export default function Navbar() {
  const { count } = useCart();
  const { open } = useChat();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/tienda", label: "Tienda" },
    { href: "/servicios", label: "Servicios" },
    { href: "/resultados", label: "Resultados" },
    { href: "/promos", label: "Promos" },
    { href: "/contacto", label: "Contacto" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-crema/90 backdrop-blur-md border-b border-blush/30">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/shelies-logo-real.jpg"
            alt="Shelie's Hair Professional"
            width={56}
            height={56}
            priority
            className="object-contain rounded-full"
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-carbon/70 hover:text-vino transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {/* Ayuda — abre chat */}
          <button
            onClick={open}
            className="hidden md:inline-flex text-sm font-medium text-vino hover:underline"
          >
            Ayuda
          </button>

          {/* Carrito */}
          <Link href="/carrito" className="relative group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-carbon group-hover:text-vino transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-vino text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-blush/20 animate-slide-up">
          <div className="flex flex-col p-4 gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-carbon/70 hover:text-vino py-2"
              >
                {l.label}
              </Link>
            ))}
            <button onClick={() => { open(); setMobileOpen(false); }} className="text-sm font-medium text-vino text-left py-2">
              Ayuda (Chat IA)
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
