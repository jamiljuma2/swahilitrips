'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Anchor, User, LogOut } from 'lucide-react';
import { api, User as UserType } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    api.get<UserType>('/api/users/me').then(setUser).catch(() => setUser(null));
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setMenuOpen(false);
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/explore', label: 'Explore' },
  ];

  if (user) {
    if (user.role === 'tourist') navLinks.push({ href: '/dashboard/tourist', label: 'My Trips' });
    else if (user.role === 'boat_owner') navLinks.push({ href: '/dashboard/owner', label: 'Dashboard' });
    else if (user.role === 'admin') navLinks.push({ href: '/dashboard/admin', label: 'Admin' });
  }

  return (
    <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 text-ocean font-bold text-xl">
          <Anchor className="w-8 h-8" />
          SwahiliTrips
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`font-medium transition ${pathname === href ? 'text-ocean' : 'text-gray-600 hover:text-ocean'}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ocean/10 text-ocean hover:bg-ocean/20"
              >
                <User className="w-5 h-5" />
                {user.name}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 glass-card p-2 animate-fade-in">
                    <p className="px-3 py-1 text-sm text-gray-500">{user.email}</p>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-coral/10 text-coral"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="font-medium text-gray-600 hover:text-ocean">
                Log in
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/50 px-4 py-4 flex flex-col gap-2 animate-slide-up">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="font-medium py-2">
              {label}
            </Link>
          ))}
          {user ? (
            <button onClick={logout} className="text-left font-medium py-2 text-coral">
              Log out
            </button>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setOpen(false)} className="font-medium py-2">
                Log in
              </Link>
              <Link href="/auth/register" onClick={() => setOpen(false)} className="btn-primary inline-block text-center">
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
