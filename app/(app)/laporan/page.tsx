import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatRupiah } from "@/lib/types";

export default async function LaporanPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const profile = await getCurrentProfile();
  if (!["owner", "admin"].includes(profile.role)) redirect("/dashboard");

  const from = searchParams.from || new Date(new Date().setDate(1)).toISOString().slice(0, 10);
  const to = searchParams.to || new Date().toISOString().slice(0, 10);
  const fromDate = new Date(from + "T00:00:00").toISOString();
  const toDate = new Date(to + "T23:59:59").toISOString();

  const supabase = createClient();
  const [{ data: sales }, { data: ppob }] = await Promise.all([
    supabase.from("sales").select("*").eq("status_bayar", "PAID").gte("created_at", fromDate).lte("created_at", toDate),
    supabase.from("ppob_transactions").select("*").eq("status", "SUCCESS").gte("created_at", fromDate).lte("created_at", toDate),
  ]);

  const omzetBarang = (sales || []).reduce((a, s) => a + s.total, 0);
  const omzetPpob = (ppob || []).reduce((a, p) => a + p.harga_jual, 0);
  const komisiPpob = (ppob || []).reduce((a, p) => a + p.komisi, 0);
  // Estimasi profit barang: butuh harga modal produk; skema sekarang tidak menyimpan HPP per item,
  // jadi kolom ini menampilkan omzet kotor barang (bisa dikembangkan dengan menambah kolom harga_modal di products).
  const totalPendapatan = omzetBarang + omzetPpob;
  const cashCount = (sales || []).filter((s) => s.metode_bayar === "CASH").length;
  const onlineCount = (sales || []).filter((s) => s.metode_bayar === "ONLINE").length;

  return (
    <div>
      <div className="top-blue" style={{ padding: "22px 22px 46px" }}>
        <div className="logo">Laporan</div>
        <p style={{ margin: "8px 0 0", color: "#dce8ff" }}>Ringkasan omzet dan komisi pada rentang tanggal.</p>
      </div>
      <div style={{ marginTop: 14 }}>

      <form className="card p-4 flex flex-wrap gap-3 items-end mb-6" method="get">
        <div>
          <label className="block text-xs font-semibold mb-1">Dari</label>
          <input type="date" name="from" defaultValue={from} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Sampai</label>
          <input type="date" name="to" defaultValue={to} className="input" />
        </div>
        <button className="btn-primary">Terapkan</button>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Omzet Barang" value={formatRupiah(omzetBarang)} />
        <Stat label="Omzet PPOB" value={formatRupiah(omzetPpob)} />
        <Stat label="Komisi PPOB" value={formatRupiah(komisiPpob)} accent />
        <Stat label="Total Pendapatan" value={formatRupiah(totalPendapatan)} />
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-display text-lg mb-3">Metode Pembayaran (Kasir Barang)</h2>
        <div className="flex gap-8 text-sm">
          <p>Cash: <strong>{cashCount}</strong> transaksi</p>
          <p>Online: <strong>{onlineCount}</strong> transaksi</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink text-paper text-left">
            <tr>
              <th className="p-3">Kode</th>
              <th className="p-3">Metode</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {(sales || []).map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="p-3">{s.kode_trx}</td>
                <td className="p-3">{s.metode_bayar}</td>
                <td className="p-3 text-right">{formatRupiah(s.total)}</td>
                <td className="p-3">{new Date(s.created_at).toLocaleString("id-ID")}</td>
              </tr>
            ))}
            {(sales || []).length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-ink/50">Tidak ada data pada rentang ini.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-ink/50 font-semibold mb-2">{label}</p>
      <p className={`font-display text-2xl ${accent ? "text-moss" : ""}`}>{value}</p>
    </div>
  );
}
