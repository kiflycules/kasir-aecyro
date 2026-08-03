import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatRupiah } from "@/lib/types";
import { addService, toggleService, deleteService } from "./actions";
import LayananForm from "./LayananForm";

export default async function LayananPage() {
  const profile = await getCurrentProfile();
  if (!["owner", "admin"].includes(profile.role)) redirect("/dashboard");

  const supabase = createClient();
  const { data: services } = await supabase.from("services").select("*").order("kategori").order("nama_layanan");

  return (
    <div>
      <div className="top-blue" style={{ padding: "22px 22px 46px" }}>
        <div className="logo">Layanan PPOB</div>
        <p style={{ margin: "8px 0 0", color: "#dce8ff" }}>Katalog pulsa, transfer, e-wallet, game, dan token PLN.</p>
      </div>
      <div style={{ marginTop: 14 }}>

      <LayananForm addService={addService} />

      <div className="card overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-ink text-paper text-left">
            <tr>
              <th className="p-3">Kategori</th>
              <th className="p-3">Layanan</th>
              <th className="p-3">Modal</th>
              <th className="p-3">Jual</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(services || []).map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="p-3">{s.kategori}</td>
                <td className="p-3 font-medium">{s.nama_layanan}<div className="text-xs text-ink/40">{s.provider}</div></td>
                <td className="p-3">{formatRupiah(s.harga_modal)}</td>
                <td className="p-3">{formatRupiah(s.harga_jual)}</td>
                <td className="p-3">
                  <span className={`badge ${s.status === "AKTIF" ? "bg-moss/10 text-moss" : "bg-clay/10 text-clay"}`}>{s.status}</span>
                </td>
                <td className="p-3 text-right space-x-3">
                  <form action={toggleService.bind(null, s.id, s.status === "AKTIF" ? "NONAKTIF" : "AKTIF")} className="inline">
                    <button className="text-moss font-semibold">{s.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"}</button>
                  </form>
                  <form action={deleteService.bind(null, s.id)} className="inline">
                    <button className="text-clay font-semibold">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
            {(services || []).length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-ink/50">Belum ada layanan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
