"use client";

import Link from "next/link";
import { useAuth, useClerk, useUser } from "@clerk/react";
import { BookOpen, LogOut, Shield, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { authenticatedFetch } from "@/lib/auth-fetch";

const links = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/news", label: "News" },
  { href: "/pass", label: "Universe Pass" },
  { href: "/library", label: "My Library" },
];

export function SiteHeader() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    if (!isSignedIn) {
      return;
    }
    authenticatedFetch(getToken, "/api/me")
      .then(async (response) => {
        const data = (await response.json()) as { isAdmin?: boolean };
        if (active) setIsAdmin(Boolean(data.isAdmin));
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });
    return () => {
      active = false;
    };
  }, [getToken, isSignedIn]);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="shell header-main">
        <Link href="/" className="wordmark" aria-label="Dzonyx home">
          <BrandMark className="wordmark-avatar" />
          <span>DZONYX</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          {isSignedIn && isAdmin ? (
            <Link href="/admin" className="admin-nav">
              <Shield aria-hidden="true" />
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="account-actions">
          {!isLoaded ? (
            <span className="account-loading" aria-label="Loading account" />
          ) : isSignedIn ? (
            <>
              <span className="account-name">
                {user?.firstName ?? user?.primaryEmailAddress?.emailAddress}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => clerk.signOut({ redirectUrl: "/" })}
              >
                <LogOut aria-hidden="true" />
                <span className="desktop-only">Sign out</span>
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/sign-in">
                <UserRound aria-hidden="true" />
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </div>
      <nav className="mobile-nav shell" aria-label="Mobile navigation">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.href === "/library" ? <BookOpen aria-hidden="true" /> : null}
            {link.label}
          </Link>
        ))}
        {isSignedIn && isAdmin ? <Link href="/admin">Admin</Link> : null}
      </nav>
    </header>
  );
}
