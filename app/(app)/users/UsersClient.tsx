"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { createUser, updateUserRole, deleteUser } from "./actions";

export default function UsersClient({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");

  async function handleCreate(formData: FormData) {
    setErr("");
    const res = await createUser(formData);
    if (res?.error) return setErr(res.error);
    setAdding(false);
    router.refresh();
  }

  async function handleRoleChange(id: string, role: string) {
    await updateUserRole(id, role);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus user ini? Akses login akan dicabut.")) return;
    const res = await deleteUser(id);
    if (res?.error) alert(res.error);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4">
        {!adding ? (
          <button className="btn-primary" onClick={() => setAdding(true)}>+ Tambah User</button>
        ) : (
          <form action={handleCreate} className="card p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold mb-1">Nama</label>
              <input name="nama" className="input" required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Username</label>
              <input name="username" className="input" placeholder="ACR1234" required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Password</label>
              <input name="password" type="password" className="input" required minLength={6} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Role</label>
              <select name="role" className="input">
                <option value="kasir">Kasir</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            {err && <p className="text-clay text-sm w-full">{err}</p>}
            <button type="submit" className="btn-primary">Simpan</button>
            <button type="button" className="btn-outline" onClick={() => setAdding(false)}>Batal</button>
          </form>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink text-paper text-left">
            <tr>
              <th className="p-3">Nama</th>
              <th className="p-3">Username</th>
              <th className="p-3">Role</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="p-3 font-medium">{u.nama}</td>
                <td className="p-3">{u.username}</td>
                <td className="p-3">
                  <select
                    className="input"
                    defaultValue={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={u.id === currentUserId}
                  >
                    <option value="kasir">Kasir</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="owner">Owner</option>
                  </select>
                </td>
                <td className="p-3 text-right">
                  {u.id !== currentUserId && (
                    <button className="text-clay font-semibold" onClick={() => handleDelete(u.id)}>Hapus</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
