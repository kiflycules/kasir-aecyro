"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  const profile = await getCurrentProfile();
  requireOwner(profile);

  const nama = String(formData.get("nama") || "").trim();
  const username = String(formData.get("username") || "").trim().toUpperCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "staff");

  if (!nama || !username || password.length < 6) {
    return { error: "Lengkapi data. Password minimal 6 karakter." };
  }

  const admin = createAdminClient();
  const email = `${username.toLowerCase()}@acrstore.local`;

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama, username, role },
  });

  if (error) return { error: error.message };
  revalidatePath("/users");
  return { success: true };
}

export async function updateUserRole(userId: string, role: string) {
  const profile = await getCurrentProfile();
  requireOwner(profile);
  const admin = createAdminClient();
  await admin.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/users");
}

export async function deleteUser(userId: string) {
  const profile = await getCurrentProfile();
  requireOwner(profile);
  if (userId === profile.id) return { error: "Tidak bisa menghapus akun sendiri." };
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
  revalidatePath("/users");
  return { success: true };
}
