"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/inventario", label: "Inventario" },
  { href: "/oggetti", label: "Oggetti" },
  { href: "/movimenti", label: "Movimenti" },
  { href: "/status", label: "Status" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
            I
          </div>
          <span className="hidden text-sm font-semibold text-zinc-200 sm:inline">Inventario</span>
        </div>

        <div className="flex flex-1 flex-wrap justify-center gap-1 sm:flex-none">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-zinc-800 text-blue-400"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          Esci
        </button>
      </div>
    </nav>
  );
}
