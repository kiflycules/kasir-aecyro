"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireOwner } from "@/lib/auth";
import { generateKodeTrx } from "@/lib/types";
import { createSnapTransaction } from "@/lib/midtrans";
import { revalidatePath } from "next/cache";

export async function ownerTopupSaldo(userId: string, amount: number, note: string) {
  const profile = await getCurrentProfile();
  requireOwner(profile);
  if (amount <= 0) return { error: "Nominal harus lebih dari 0." };

  const supabase = createClient();
  const { data: bal } = await supabase.from("balances").select("saldo").eq("user_id", userId).maybeSingle();
  const current = bal?.saldo ?? 0;

  await supabase.from("balances").upsert({ user_id: userId, saldo: current + amount, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  await supabase.from("balance_mutations").insert({ user_id: userId, type: "TOPUP", amount, note: note || "Topup manual oleh owner" });

  revalidatePath("/saldo");
  return { success: true };
}

export async function selfTopupOnline(amount: number) {
  const profile = await getCurrentProfile();
  if (amount < 10000) return { error: "Minimal topup Rp10.000." };

  const supabase = createClient();
  const kode_trx = generateKodeTrx("SALDO");

  try {
    const snapRes = await createSnapTransaction({
      orderId: kode_trx,
      amount,
      itemName: "Topup Saldo Digital",
      customerName: profile.nama,
    });
    await supabase.from("payments").insert({
      order_id: kode_trx,
      ref_type: "TOPUP_SALDO",
      ref_id: 0,
      user_id: profile.id,
      amount,
      status: "PENDING",
      snap_token: snapRes.token,
    });
    return { success: true, token: snapRes.token, redirectUrl: snapRes.redirect_url };
  } catch (e: any) {
    return { error: "Gagal membuat pembayaran: " + (e?.message || "unknown") };
  }
}
