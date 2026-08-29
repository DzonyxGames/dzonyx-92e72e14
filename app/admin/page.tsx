import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main id="main-content">
      <section className="page-hero admin-hero">
        <div className="shell">
          <p className="eyebrow plain">Creator control room</p>
          <h1>ADMIN STUDIO</h1>
          <p>
            Create issues, upload pages, set independent EUR and USD prices,
            control Universe Pass access and publish when ready.
          </p>
        </div>
      </section>
      <section className="page-body shell">
        <AdminDashboard />
      </section>
    </main>
  );
}
