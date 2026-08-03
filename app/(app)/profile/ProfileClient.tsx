"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { updateProfile, updatePassword, uploadProfilePhoto } from "./actions";

export default function ProfileClient({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function handleProfile(fd: FormData) {
    const res = await updateProfile(fd);
    setMsg(res?.error || "Profil disimpan.");
    router.refresh();
  }

  async function handlePassword(fd: FormData) {
    const res = await updatePassword(fd);
    setMsg(res?.error || "Password diganti.");
  }

  async function handlePhoto(fd: FormData) {
    const res = await uploadProfilePhoto(fd);
    setMsg(res?.error || "Foto diperbarui.");
    router.refresh();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
      <div className="card p-5">
        <h2 className="font-display text-lg mb-4">Foto Profil</h2>
        {profile.foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.foto} alt="Foto profil" className="w-24 h-24 rounded-full object-cover mb-4" />
        )}
        <form action={handlePhoto}>
          <input type="file" name="file" accept="image/*" className="input mb-3" required />
          <button className="btn-primary">Upload</button>
        </form>
      </div>

      <div className="card p-5">
        <h2 className="font-display text-lg mb-4">Data Diri</h2>
        <form action={handleProfile} className="mb-6">
          <label className="block text-sm font-semibold mb-1">Nama</label>
          <input name="nama" defaultValue={profile.nama} className="input mb-3" required />
          <p className="text-xs text-ink/40 mb-3">Username: {profile.username} (tidak bisa diubah)</p>
          <button className="btn-primary">Simpan Nama</button>
        </form>

        <form action={handlePassword}>
          <label className="block text-sm font-semibold mb-1">Password Baru</label>
          <input name="password" type="password" className="input mb-3" minLength={6} required />
          <button className="btn-outline">Ganti Password</button>
        </form>

        {msg && <p className="text-sm text-moss mt-4">{msg}</p>}
      </div>
    </div>
  );
}
