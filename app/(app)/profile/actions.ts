"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const profile = await getCurrentProfile();
  const nama = String(formData.get("nama") || "").trim();
  if (!nama) return { error: "Nama tidak boleh kosong." };

  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ nama }).eq("id", profile.id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const newPassword = String(formData.get("password") || "");
  if (newPassword.length < 6) return { error: "Password minimal 6 karakter." };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: true };
}

export async function uploadProfilePhoto(formData: FormData) {
  const profile = await getCurrentProfile();
  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "Pilih file dulu." };

  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${profile.id}/${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
  if (upErr) return { error: upErr.message };

  const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
  await supabase.from("profiles").update({ foto: pub.publicUrl }).eq("id", profile.id);

  revalidatePath("/profile");
  return { success: true };
}
