"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CatalogoRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/productos"); }, [router]);
  return null;
}
