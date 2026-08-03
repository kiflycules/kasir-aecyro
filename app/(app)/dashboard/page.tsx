import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { formatRupiah } from "@/lib/types";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ count: produkCount }, { data: salesToday }, { data: ppobToday }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("sales").select("total").gte("created_at", todayStart.toISOString()).eq("status_bayar", "PAID"),
    supabase.from("ppob_transactions").select("harga_jual,komisi").gte("created_at", todayStart.toISOString()).eq("status", "SUCCESS"),
  ]);

  const omzetBarang = (salesToday || []).reduce((a, s) => a + s.total, 0);
  const omzetDigital = (ppobToday || []).reduce((a, p) => a + p.harga_jual, 0);
  const trxCount = (salesToday || []).length + (ppobToday || []).length;

  const initial = profile.nama.trim().charAt(0).toUpperCase() || "A";

  return (
    <div>
      <div className="top-blue">
        <div className="logo-row">
          <div>
            <div className="logo">
              ACR<span>Store</span>
            </div>
            <p style={{ margin: "9px 0 0", color: "#dce8ff" }}>
              Dashboard operasional · {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          <Link className="top-btn" href="/profile">
            Profil Saya
          </Link>
        </div>
      </div>

      <div className="card profile-card">
        <div className="avatar">
          {profile.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.foto} alt={profile.nama} />
          ) : (
            initial
          )}
        </div>
        <div>
          <small style={{ color: "#7b8799" }}>SELAMAT DATANG</small>
          <h2 style={{ margin: "3px 0 6px" }}>{profile.nama}</h2>
          <div>
            <span className="badge">{profile.role.toUpperCase()}</span> <small>{profile.username}</small>
          </div>
        </div>
        <Link className="btn btn-primary" href="/kasir" style={{ whiteSpace: "nowrap", padding: "11px 14px", fontSize: 14 }}>
          + Transaksi
        </Link>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <small style={{ color: "#7b8799" }}>PERFORMA HARI INI</small>
            <h2 style={{ margin: "5px 0 0" }}>Ringkasan Penjualan</h2>
          </div>
          <span className="badge badge-blue">LIVE</span>
        </div>
        <div className="stats" style={{ marginTop: 18 }}>
          <div className="stat">
            <small>OMZET BARANG</small>
            <h3>{formatRupiah(omzetBarang)}</h3>
          </div>
          <div className="stat">
            <small>OMZET DIGITAL</small>
            <h3>{formatRupiah(omzetDigital)}</h3>
          </div>
          <div className="stat">
            <small>TRANSAKSI SUKSES</small>
            <h3>{trxCount}</h3>
          </div>
          <div className="stat">
            <small>PRODUK AKTIF</small>
            <h3>{produkCount ?? 0}</h3>
          </div>
        </div>
      </div>

      <div className="section-title">AKSI CEPAT</div>
      <div className="card">
        <div className="menu-grid">
          <Link className="menu-item" href="/kasir">
            <div className="circle">🧾</div>
            <small>Kasir Barang</small>
          </Link>
          <Link className="menu-item" href="/produk">
            <div className="circle">📦</div>
            <small>Produk &amp; Stok</small>
          </Link>
          <Link className="menu-item" href="/ppob">
            <div className="circle">◉</div>
            <small>Produk Digital</small>
          </Link>
          <Link className="menu-item" href="/kasir">
            <div className="circle">💳</div>
            <small>Bayar Online</small>
          </Link>
        </div>
      </div>

      <div className="section-title">LAYANAN DIGITAL</div>
      <div className="card">
        <div className="menu-grid">
          <Link className="menu-item" href="/ppob">
            <div className="circle">📱</div>
            <small>Pulsa</small>
          </Link>
          <Link className="menu-item" href="/ppob">
            <div className="circle">💳</div>
            <small>E-Wallet</small>
          </Link>
          <Link className="menu-item" href="/ppob">
            <div className="circle">🎮</div>
            <small>Game</small>
          </Link>
          <Link className="menu-item" href="/ppob">
            <div className="circle">⚡</div>
            <small>PLN</small>
          </Link>
        </div>
      </div>

      <div className="card list-menu" style={{ marginTop: 14 }}>
        <Link className="left-line" href="/riwayat">
          <div>
            <b>Riwayat Semua Transaksi</b>
            <br />
            <small>Kasir barang + layanan digital</small>
          </div>
          <b>›</b>
        </Link>
        {["owner", "admin"].includes(profile.role) && (
          <Link className="left-line" href="/laporan">
            <div>
              <b>Laporan Gabungan</b>
              <br />
              <small>Omzet barang, digital, dan komisi</small>
            </div>
            <b>›</b>
          </Link>
        )}
        {profile.role === "owner" && (
          <>
            <Link className="left-line" href="/saldo">
              <div>
                <b>Kelola Saldo Agen</b>
                <br />
                <small>Topup saldo kasir/staff</small>
              </div>
              <b>›</b>
            </Link>
            <Link className="left-line" href="/layanan">
              <div>
                <b>Data Layanan Digital</b>
                <br />
                <small>Harga pulsa, transfer, topup</small>
              </div>
              <b>›</b>
            </Link>
            <Link className="left-line" href="/users">
              <div>
                <b>Manajemen User</b>
                <br />
                <small>Tambah owner, kasir, staff</small>
              </div>
              <b>›</b>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
