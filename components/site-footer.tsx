import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <div className="footer-wordmark">DZONYX</div>
          <p>Original digital comics, built panel by panel.</p>
        </div>
        <div className="footer-links">
          <Link href="/catalogue">Catalogue</Link>
          <Link href="/pass">Universe Pass</Link>
          <Link href="/legal">Legal &amp; privacy</Link>
        </div>
        <p className="copyright">© 2026 Dzonyx. All rights reserved.</p>
      </div>
    </footer>
  );
}
