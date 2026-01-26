'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useLogout } from '@/hooks/useAuth';

export function Header() {
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { logout } = useLogout();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: '/', label: '홈' },
    { href: '/posts', label: '게시글 목록' },
    { href: '/posts/new', label: '글쓰기', authRequired: true },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          게시판
        </Link>

        <div className="flex items-center gap-6">
          <nav className="flex gap-4">
            {navItems
              .filter((item) => !item.authRequired || (mounted && isAuthenticated))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
          </nav>

          {mounted && !isLoading && (
            <>
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{user?.name}</span>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-3 py-1.5"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1.5"
                >
                  로그인
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
