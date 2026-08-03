"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addService(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!["owner", "admin"].includes(profile.role)) return { error: "Tidak diizinkan." };

  const kategori = String(formData.get("kategori"));
  const provider = String(formData.get("provider") || "");
  const nama_layanan = String(formData.get("nama_layanan") || "").trim();
  const harga_modal = Number(formData.get("harga_modal"));
  const harga_jual = Number(formData.get("harga_jual"));
  if (!nama_layanan) return { error: "Nama layanan wajib diisi." };

  const supabase = createClient();
  const { error } = await supabase.from("services").insert({ kategori, provider, nama_layanan, harga_modal, harga_jual, status: "AKTIF" });
  if (error) return { error: error.message };
  revalidatePath("/layanan");
  revalidatePath("/ppob");
  return { success: true };
}

export async function toggleService(id: number, status: "AKTIF" | "NONAKTIF") {
  const profile = await getCurrentProfile();
  if (!["owner", "admin"].includes(profile.role)) return;
  const supabase = createClient();
  await supabase.from("services").update({ status }).eq("id", id);
  revalidatePath("/layanan");
  revalidatePath("/ppob");
}

export async function deleteService(id: number) {
  const profile = await getCurrentProfile();
  if (!["owner", "admin"].includes(profile.role)) return;
  const supabase = createClient();
  await supabase.from("services").delete().eq("id", id);
  revalidatePath("/layanan");
  revalidatePath("/ppob");
}
