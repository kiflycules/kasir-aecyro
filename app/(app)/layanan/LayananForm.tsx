"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LayananForm({ addService }: { addService: (fd: FormData) => Promise<{ error?: string; success?: boolean }> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(formData: FormData) {
    setErr("");
    const res = await addService(formData);
    if (res?.error) return setErr(res.error);
    setOpen(false);
    router.refresh();
  }

  if (!open) return <button className="btn-primary" onClick={() => setOpen(true)}>+ Tambah Layanan</button>;

  return (
    <form action={handleSubmit} className="card p-4 flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs font-semibold mb-1">Kategori</label>
        <select name="kategori" className="input" required>
          <option value="PULSA">PULSA</option>
          <option value="TRANSFER">TRANSFER</option>
          <option value="EWALLET">EWALLET</option>
          <option value="GAME">GAME</option>
          <option value="PLN">PLN</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Provider</label>
        <input name="provider" className="input" placeholder="TELKOMSEL / DANA / dst" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Nama Layanan</label>
        <input name="nama_layanan" className="input" required />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Harga Modal</label>
        <input name="harga_modal" type="number" className="input w-28" required />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Harga Jual</label>
        <input name="harga_jual" type="number" className="input w-28" required />
      </div>
      {err && <p className="text-clay text-sm w-full">{err}</p>}
      <button type="submit" className="btn-primary">Simpan</button>
      <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
    </form>
  );
}
