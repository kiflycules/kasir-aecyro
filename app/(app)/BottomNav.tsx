"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/profile", icon: "👤", label: "Profile" },
  { href: "/riwayat", icon: "↺", label: "Riwayat" },
  { href: "/dashboard", icon: "⌂", label: "Home" },
  { href: "/laporan", icon: "◎", label: "Laporan" },
  { href: "/kasir", icon: "🧾", label: "Kasir" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="bottom-nav">
      {ITEMS.map((item) => (
        <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>
          <span>{item.icon}</span>
          <small>{item.label}</small>
        </Link>
      ))}
    </div>
  );
}
