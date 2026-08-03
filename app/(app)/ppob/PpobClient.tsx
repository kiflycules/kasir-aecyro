"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Service, PpobTransaction } from "@/lib/types";
import { formatRupiah } from "@/lib/types";
import { createPpobTransaction, updatePpobStatus } from "./actions";

declare global {
  interface Window {
    snap?: { pay: (token: string, opts: Record<string, any>) => void };
  }
}

export default function PpobClient({
  services,
  pending,
  isOwner,
}: {
  services: Service[];
  pending: PpobTransaction[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState<number | "">("");
  const [tujuan, setTujuan] = useState("");
  const [metode, setMetode] = useState<"SALDO" | "CASH" | "ONLINE">("SALDO");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const selected = services.find((s) => s.id === serviceId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId) return;
    setLoading(true);
    setMsg(null);
    const res = await createPpobTransaction({ service_id: Number(serviceId), tujuan, metode_bayar: metode });
    setLoading(false);
    if ("error" in res && res.error) {
      setMsg({ type: "err", text: res.error });
      return;
    }
    if (res.token && window.snap) {
      window.snap.pay(res.token, {
        onSuccess: () => setMsg({ type: "ok", text: "Pembayaran online berhasil. Menunggu diproses owner." }),
        onPending: () => setMsg({ type: "ok", text: "Menunggu pembayaran pelanggan." }),
        onError: () => setMsg({ type: "err", text: "Pembayaran gagal." }),
        onClose: () => setMsg({ type: "err", text: "Popup ditutup sebelum bayar." }),
      });
    } else {
      setMsg({ type: "ok", text: `Transaksi dibuat. Status: menunggu diproses.` });
    }
    setTujuan("");
    setServiceId("");
    router.refresh();
  }

  async function handleUpdateStatus(id: number, status: "SUCCESS" | "FAILED") {
    const sn = status === "SUCCESS" ? prompt("Masukkan Serial Number / referensi (opsional):") || "" : "";
    await updatePpobStatus(id, status, sn, "");
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card p-5">
        <h2 className="font-display text-xl mb-4">Buat Transaksi</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Layanan</label>
            <select className="input" value={serviceId} onChange={(e) => setServiceId(Number(e.target.value))} required>
              <option value="">Pilih layanan...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.kategori}] {s.nama_layanan} — {formatRupiah(s.harga_jual)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Nomor / Tujuan</label>
            <input className="input" value={tujuan} onChange={(e) => setTujuan(e.target.value)} placeholder="08xxxxxxxxxx / ID Pelanggan" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Metode Bayar</label>
            <div className="flex gap-2">
              {(["SALDO", "CASH", "ONLINE"] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMetode(m)}
                  className={`px-3 py-2 rounded-sm text-sm font-semibold border ${metode === m ? "bg-ink text-paper border-ink" : "border-line"}`}
                >
                  {m === "SALDO" ? "Saldo Digital" : m === "CASH" ? "Cash" : "Online (QRIS/VA)"}
                </button>
              ))}
            </div>
          </div>
          {selected && (
            <p className="text-sm text-ink/60">Harga jual: <strong>{formatRupiah(selected.harga_jual)}</strong></p>
          )}
          {msg && <p className={`text-sm ${msg.type === "err" ? "text-clay" : "text-moss"}`}>{msg.text}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Memproses..." : "Buat Transaksi"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-xl mb-4">Transaksi Menunggu Diproses</h2>
        <div className="space-y-3">
          {pending.map((t) => (
            <div key={t.id} className="card p-4">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <p className="font-semibold">{t.nama_layanan}</p>
                  <p className="text-xs text-ink/50">{t.tujuan} · {t.kode_trx}</p>
                </div>
                <span className="badge bg-brass/10 text-brass">{t.metode_bayar}</span>
              </div>
              <p className="text-sm text-ink/60 mb-2">{formatRupiah(t.harga_jual)}</p>
              {isOwner && (
                <div className="flex gap-2">
                  <button className="btn-outline text-xs py-1.5" onClick={() => handleUpdateStatus(t.id, "SUCCESS")}>Tandai Sukses</button>
                  <button className="text-clay text-xs font-semibold" onClick={() => handleUpdateStatus(t.id, "FAILED")}>Tandai Gagal</button>
                </div>
              )}
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm text-ink/50">Tidak ada transaksi tertunda.</p>}
        </div>
      </div>
    </div>
  );
}
