"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/types";
import { ownerTopupSaldo } from "./actions";

type UserRow = { id: string; nama: string; username: string; role: string; saldo: number };

export default function SaldoClient({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<UserRow | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!target) return;
    setErr("");
    setLoading(true);
    const res = await ownerTopupSaldo(target.id, Number(amount), note);
    setLoading(false);
    if (res?.error) return setErr(res.error);
    setTarget(null);
    setAmount("");
    setNote("");
    router.refresh();
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink text-paper text-left">
          <tr>
            <th className="p-3">Nama</th>
            <th className="p-3">Username</th>
            <th className="p-3">Role</th>
            <th className="p-3 text-right">Saldo</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-line">
              <td className="p-3 font-medium">{u.nama}</td>
              <td className="p-3">{u.username}</td>
              <td className="p-3 uppercase text-xs">{u.role}</td>
              <td className="p-3 text-right">{formatRupiah(u.saldo)}</td>
              <td className="p-3 text-right">
                <button className="text-moss font-semibold" onClick={() => setTarget(u)}>Topup</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {target && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50" onClick={() => setTarget(null)}>
          <div className="card p-6 w-full max-w-sm bg-paper" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl mb-4">Topup Saldo — {target.nama}</h3>
            <label className="block text-sm font-semibold mb-1">Nominal</label>
            <input type="number" className="input mb-3" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <label className="block text-sm font-semibold mb-1">Catatan (opsional)</label>
            <input className="input mb-4" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sudah transfer via BCA" />
            {err && <p className="text-clay text-sm mb-3">{err}</p>}
            <div className="flex gap-2">
              <button className="btn-primary flex-1" disabled={loading || !amount} onClick={submit}>Simpan</button>
              <button className="btn-outline flex-1" onClick={() => setTarget(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
