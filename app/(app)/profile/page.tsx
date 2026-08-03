import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { formatRupiah } from "@/lib/types";
import { logoutAction } from "../actions";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();
  const { data: balance } = await supabase.from("balances").select("saldo").eq("user_id", profile.id).maybeSingle();

  return (
    <div>
      <div className="top-blue">
        <div className="logo-row">
          <div className="logo">
            ACR<span>Store</span>
          </div>
          <form action={logoutAction}>
            <button className="top-btn" type="submit" style={{ border: 0, cursor: "pointer" }}>
              Logout
            </button>
          </form>
        </div>
      </div>

      <div className="card profile-card">
        <div className="avatar">
          {profile.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.foto} alt={profile.nama} />
          ) : (
            profile.nama.trim().charAt(0).toUpperCase() || "A"
          )}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{profile.nama}</h2>
          <div className="badge">{profile.role.toUpperCase()}</div>
          <p style={{ margin: "6px 0 0" }}>
            ID: <b>{profile.username}</b>
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Saldo Digital</h3>
        <h1 style={{ margin: 0 }}>{formatRupiah(balance?.saldo ?? 0)}</h1>
        <p style={{ color: "#7c8496" }}>
          {profile.role === "owner"
            ? "Owner full akses untuk stok barang, kasir, topup, transfer, saldo, laporan, dan user."
            : "Akun kasir/staff memiliki akses sesuai role dan saldo yang tersedia."}
        </p>
      </div>

      <div style={{ marginTop: 14 }}>
        <ProfileClient profile={profile} />
      </div>
    </div>
  );
}
