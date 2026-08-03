import Script from "next/script";
import { getCurrentProfile } from "@/lib/auth";
import BottomNav from "./BottomNav";

const snapUrl =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Memastikan user login; profil dipakai lagi di masing-masing halaman lewat getCurrentProfile()
  await getCurrentProfile();

  return (
    <div className="container-app">
      <Script src={snapUrl} data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} strategy="afterInteractive" />
      {children}
      <BottomNav />
    </div>
  );
}
