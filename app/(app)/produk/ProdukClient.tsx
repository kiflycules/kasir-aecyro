"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { formatRupiah } from "@/lib/types";
import { addProduct, updateProduct, deleteProduct } from "./actions";

export default function ProdukClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");

  async function handleAdd(formData: FormData) {
    setErr("");
    const res = await addProduct(formData);
    if (res?.error) return setErr(res.error);
    setAdding(false);
    router.refresh();
  }

  async function handleUpdate(id: number, formData: FormData) {
    setErr("");
    const res = await updateProduct(id, formData);
    if (res?.error) return setErr(res.error);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus produk ini?")) return;
    await deleteProduct(id);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4">
        {!adding ? (
          <button className="btn-primary" onClick={() => setAdding(true)}>+ Tambah Produk</button>
        ) : (
          <form action={handleAdd} className="card p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold mb-1">Nama</label>
              <input name="nama" className="input" required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Harga</label>
              <input name="harga" type="number" className="input w-32" required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Stok</label>
              <input name="stok" type="number" className="input w-24" required />
            </div>
            <button type="submit" className="btn-primary">Simpan</button>
            <button type="button" className="btn-outline" onClick={() => setAdding(false)}>Batal</button>
          </form>
        )}
      </div>

      {err && <p className="text-clay text-sm mb-3">{err}</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink text-paper text-left">
            <tr>
              <th className="p-3">Nama</th>
              <th className="p-3">Harga</th>
              <th className="p-3">Stok</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) =>
              editing === p.id ? (
                <tr key={p.id} className="border-t border-line">
                  <td colSpan={4} className="p-3">
                    <form
                      action={(fd) => handleUpdate(p.id, fd)}
                      className="flex flex-wrap gap-3 items-end"
                    >
                      <input name="nama" defaultValue={p.nama} className="input" required />
                      <input name="harga" type="number" defaultValue={p.harga} className="input w-32" required />
                      <input name="stok" type="number" defaultValue={p.stok} className="input w-24" required />
                      <button type="submit" className="btn-primary">Simpan</button>
                      <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Batal</button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-3 font-medium">{p.nama}</td>
                  <td className="p-3">{formatRupiah(p.harga)}</td>
                  <td className="p-3">{p.stok}</td>
                  <td className="p-3 text-right space-x-3">
                    <button className="text-moss font-semibold" onClick={() => setEditing(p.id)}>Ubah</button>
                    <button className="text-clay font-semibold" onClick={() => handleDelete(p.id)}>Hapus</button>
                  </td>
                </tr>
              )
            )}
            {products.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-ink/50">Belum ada produk.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
