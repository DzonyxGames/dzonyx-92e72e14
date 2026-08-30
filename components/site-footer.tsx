import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link className="footer-wordmark" href="/" aria-label="Dzonyx home">
            <BrandMark className="footer-brand-mark" />
            <span>DZONYX</span>
          </Link>
          <p>Original digital comics, built panel by panel.</p>
        </div>
        <div className="footer-links">
          <Link href="/catalogue">Catalogue</Link>
          <Link href="/news">News</Link>
          <Link href="/pass">Universe Pass</Link>
          <Link href="/legal">Legal &amp; privacy</Link>
        </div>
        <p className="copyright">© 2026 Dzonyx. All rights reserved.</p>
      </div>
    </footer>
  );
}
