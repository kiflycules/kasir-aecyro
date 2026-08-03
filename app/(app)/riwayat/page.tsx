import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/types";

export default async function RiwayatPage() {
  const supabase = createClient();

  const [{ data: sales }, { data: ppob }] = await Promise.all([
    supabase.from("sales").select("*, profiles(nama)").order("created_at", { ascending: false }).limit(50),
    supabase.from("ppob_transactions").select("*, profiles(nama)").order("created_at", { ascending: false }).limit(50),
  ]);

  type Row = {
    id: string;
    waktu: string;
    jenis: string;
    keterangan: string;
    metode: string;
    status: string;
    total: number;
    kasir: string;
  };

  const rows: Row[] = [
    ...(sales || []).map((s: any) => ({
      id: `S${s.id}`,
      waktu: s.created_at,
      jenis: "Barang",
      keterangan: s.kode_trx,
      metode: s.metode_bayar,
      status: s.status_bayar,
      total: s.total,
      kasir: s.profiles?.nama || "-",
    })),
    ...(ppob || []).map((p: any) => ({
      id: `P${p.id}`,
      waktu: p.created_at,
      jenis: `PPOB · ${p.kategori}`,
      keterangan: `${p.nama_layanan} (${p.tujuan})`,
      metode: p.metode_bayar,
      status: p.status,
      total: p.harga_jual,
      kasir: p.profiles?.nama || "-",
    })),
  ].sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());

  return (
    <div>
      <div className="top-blue" style={{ padding: "22px 22px 46px" }}>
        <div className="logo">Riwayat Transaksi</div>
        <p style={{ margin: "8px 0 0", color: "#dce8ff" }}>Gabungan transaksi barang dan PPOB, 50 terbaru.</p>
      </div>
      <div style={{ marginTop: 14 }}>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-ink text-paper text-left">
            <tr>
              <th className="p-3">Waktu</th>
              <th className="p-3">Jenis</th>
              <th className="p-3">Keterangan</th>
              <th className="p-3">Kasir</th>
              <th className="p-3">Metode</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="p-3 whitespace-nowrap">{new Date(r.waktu).toLocaleString("id-ID")}</td>
                <td className="p-3">{r.jenis}</td>
                <td className="p-3">{r.keterangan}</td>
                <td className="p-3">{r.kasir}</td>
                <td className="p-3">{r.metode}</td>
                <td className="p-3">
                  <span className={`badge ${["PAID", "SUCCESS"].includes(r.status) ? "bg-moss/10 text-moss" : ["PENDING"].includes(r.status) ? "bg-brass/10 text-brass" : "bg-clay/10 text-clay"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-3 text-right font-medium">{formatRupiah(r.total)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-ink/50">Belum ada transaksi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
