import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import PpobClient from "./PpobClient";

export default async function PpobPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const [{ data: services }, { data: pending }, { data: balance }] = await Promise.all([
    supabase.from("services").select("*").eq("status", "AKTIF").order("kategori"),
    supabase.from("ppob_transactions").select("*").eq("status", "PENDING").order("created_at", { ascending: false }),
    supabase.from("balances").select("saldo").eq("user_id", profile.id).maybeSingle(),
  ]);

  return (
    <div>
      <div className="top-blue" style={{ padding: "22px 22px 46px" }}>
        <div className="logo">
          Produk <span>Digital</span>
        </div>
        <p style={{ margin: "8px 0 0", color: "#dce8ff" }}>Pulsa, Transfer, E-wallet, Game, PLN</p>
        <div className="badge badge-blue" style={{ marginTop: 12, background: "rgba(255,255,255,.18)", color: "#fff" }}>
          Saldo digital: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(balance?.saldo ?? 0)}
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <PpobClient services={services || []} pending={pending || []} isOwner={profile.role === "owner"} />
      </div>
    </div>
  );
}
