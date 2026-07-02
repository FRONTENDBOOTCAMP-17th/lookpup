"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`h-7 flex items-start text-base font-medium leading-6 transition-colors border-b-2 ${
        isActive
          ? "text-orange-500 border-orange-500"
          : "text-gray-500 border-transparent hover:text-orange-500"
      }`}
    >
      {label}
    </Link>
  );
}
