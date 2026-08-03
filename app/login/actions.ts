"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    redirect("/login?error=" + encodeURIComponent("Username dan password wajib diisi."));
  }

  // Username disimpan di tabel profiles, tapi Supabase Auth login pakai email.
  // Jadi kita cari dulu email dari username lewat admin client (aman, di server saja).
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    redirect("/login?error=" + encodeURIComponent("Username tidak ditemukan."));
  }

  const { data: userRes } = await admin.auth.admin.getUserById(profile.id);
  const email = userRes?.user?.email;
  if (!email) {
    redirect("/login?error=" + encodeURIComponent("Akun bermasalah, hubungi owner."));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email!, password });
  if (error) {
    redirect("/login?error=" + encodeURIComponent("Password salah."));
  }

  redirect("/dashboard");
}
