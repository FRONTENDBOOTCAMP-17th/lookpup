import Image from "next/image";
import Link from "next/link";
import NavLink from "./NavLink";
import HeaderAuth from "./HeaderAuth";
import HeaderMobileMenu from "./HeaderMobileMenu";

const NAV_ITEMS = [
  { href: "/petsitters", label: "펫시터 찾기" },
  { href: "/board", label: "구인게시판" },
  { href: "/about", label: "서비스 소개" },
] as const;

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-orange-100 shadow-[0px_1px_8px_0px_rgba(232,116,42,0.08)]">
      {/* 데스크톱 헤더 — 서버 렌더링 */}
      <div className="hidden md:flex h-16 w-full justify-center">
        <div className="relative w-full max-w-[1280px] px-10 flex items-center justify-between gap-6">
          <Link href="/" className="shrink-0" aria-label="봐주개 홈으로 이동">
            <Image
              src="/logo.png"
              alt="봐주개"
              width={120}
              height={36}
              preload
              fetchPriority="high"
              className="w-24 h-auto object-contain"
            />
          </Link>

          <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8">
            {NAV_ITEMS.map(({ href, label }) => (
              <NavLink key={href} href={href} label={label} />
            ))}
          </nav>

          <HeaderAuth />
        </div>
      </div>

      <HeaderMobileMenu navItems={NAV_ITEMS} />
    </header>
  );
}
