"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Users, DollarSign, Sparkles } from "lucide-react";
import clsx from "clsx";

const NAV = [
  {
    href: "/operacion",
    label: "Operación",
    sub: "KPIs del gym",
    icon: Activity,
  },
  {
    href: "/miembros",
    label: "Miembros",
    sub: "Vista 360 + personas",
    icon: Users,
  },
  {
    href: "/monetizacion",
    label: "Monetización",
    sub: "Oportunidades de revenue",
    icon: DollarSign,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col bg-white border-r border-ink-200/70">
      <div className="px-6 py-6 border-b border-ink-200/70">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-ink-900 leading-tight">Gohan AI</div>
            <div className="text-xs text-ink-500 leading-tight">Dashboard del gym</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-700 hover:bg-ink-100"
              )}
            >
              <Icon className={clsx("w-5 h-5 mt-0.5 shrink-0", active ? "text-brand-600" : "text-ink-500")} />
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-ink-500">{item.sub}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 p-4 rounded-lg bg-gradient-to-br from-ink-900 to-ink-800 text-white">
        <div className="text-xs uppercase tracking-wider text-ink-400 font-semibold mb-1">
          Powered by
        </div>
        <div className="font-bold">Gohan AI · MCP</div>
        <div className="text-xs text-ink-400 mt-1">
          Datos en vivo desde el agente conversacional
        </div>
      </div>
    </aside>
  );
}
