"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addProduct(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!["owner", "admin"].includes(profile.role)) return { error: "Tidak diizinkan." };

  const nama = String(formData.get("nama") || "").trim();
  const harga = Number(formData.get("harga"));
  const stok = Number(formData.get("stok"));
  if (!nama || harga < 0 || stok < 0) return { error: "Data tidak valid." };

  const supabase = createClient();
  const { error } = await supabase.from("products").insert({ nama, harga, stok });
  if (error) return { error: error.message };
  revalidatePath("/produk");
  revalidatePath("/kasir");
  return { success: true };
}

export async function updateProduct(id: number, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!["owner", "admin"].includes(profile.role)) return { error: "Tidak diizinkan." };

  const nama = String(formData.get("nama") || "").trim();
  const harga = Number(formData.get("harga"));
  const stok = Number(formData.get("stok"));

  const supabase = createClient();
  const { error } = await supabase.from("products").update({ nama, harga, stok }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/produk");
  revalidatePath("/kasir");
  return { success: true };
}

export async function deleteProduct(id: number) {
  const profile = await getCurrentProfile();
  if (!["owner", "admin"].includes(profile.role)) return { error: "Tidak diizinkan." };
  const supabase = createClient();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/produk");
  revalidatePath("/kasir");
}
