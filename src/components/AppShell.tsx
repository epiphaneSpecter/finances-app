'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/app/login/actions';

const NAV = [
  { href: '/finances', label: 'Tableau' },
  { href: '/finances/revenus', label: 'Revenus' },
  { href: '/finances/depenses', label: 'Dépenses' },
  { href: '/finances/dettes', label: 'Dettes' },
  { href: '/finances/suivi', label: 'Suivi' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Finances</h1>
        <form action={signOut}>
          <button type="submit" className="btn ghost">
            Déconnexion
          </button>
        </form>
      </header>

      <main className="app-main">{children}</main>

      <nav className="app-nav">
        {NAV.map((item) => {
          const active =
            item.href === '/finances'
              ? pathname === '/finances'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'active' : ''}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
