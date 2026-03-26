import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, Shield } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/games', label: 'Games' },
    { to: '/news', label: 'News' },
    { to: '/donations', label: 'Donate' },
    { to: '/socials', label: 'Socials' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold tracking-wider horror-glow" style={{ fontFamily: 'Creepster, cursive' }}>
            DZONYX
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(l.to) ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                isActive('/admin') ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}>
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut} className="ml-2">
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm" className="ml-2">Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border pb-4 px-4 space-y-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 text-sm font-medium rounded-md ${
                isActive(l.to) ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-muted-foreground">
              <Shield className="w-4 h-4 inline mr-1" /> Admin
            </Link>
          )}
          {user ? (
            <button onClick={() => { signOut(); setMobileOpen(false); }} className="block px-3 py-2 text-sm text-muted-foreground">
              Logout
            </button>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-primary">
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
