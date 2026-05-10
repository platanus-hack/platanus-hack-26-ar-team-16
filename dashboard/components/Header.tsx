"use client";

import { Search, Bell, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/operacion": "Operación",
  "/miembros": "Miembros",
  "/monetizacion": "Monetización",
};

export function Header() {
  const pathname = usePathname();
  const baseTitle = Object.keys(TITLES).find((k) => pathname.startsWith(k));
  const title = baseTitle ? TITLES[baseTitle] : "Dashboard";
  return (
    <header className="bg-white border-b border-ink-200/70 px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
      <div>
        <div className="text-xs text-ink-500">SmartFit · Sucursal Palermo</div>
        <h1 className="text-xl font-bold text-ink-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-ink-100 rounded-lg w-72">
          <Search className="w-4 h-4 text-ink-500" />
          <input
            type="text"
            placeholder="Buscar miembro, plan, persona..."
            className="bg-transparent text-sm outline-none flex-1"
          />
        </div>
        <button className="p-2 rounded-lg hover:bg-ink-100 relative">
          <Bell className="w-5 h-5 text-ink-700" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
        </button>
        <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-ink-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
            T
          </div>
          <div className="hidden md:block text-sm text-ink-800 font-medium">
            Tomi
          </div>
          <ChevronDown className="w-4 h-4 text-ink-500" />
        </button>
      </div>
    </header>
  );
}
