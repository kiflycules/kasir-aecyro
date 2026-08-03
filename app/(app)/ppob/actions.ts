"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireOwner } from "@/lib/auth";
import { generateKodeTrx } from "@/lib/types";
import { createSnapTransaction } from "@/lib/midtrans";
import { revalidatePath } from "next/cache";

export async function createPpobTransaction(input: {
  service_id: number;
  tujuan: string;
  metode_bayar: "SALDO" | "CASH" | "ONLINE";
}) {
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const { data: service } = await supabase.from("services").select("*").eq("id", input.service_id).single();
  if (!service || service.status !== "AKTIF") return { error: "Layanan tidak tersedia." };
  if (!input.tujuan.trim()) return { error: "Nomor/tujuan wajib diisi." };

  const komisi = service.harga_jual - service.harga_modal;
  const kode_trx = generateKodeTrx("PPOB");

  if (input.metode_bayar === "SALDO") {
    const { data: balance } = await supabase.from("balances").select("saldo").eq("user_id", profile.id).maybeSingle();
    const saldo = balance?.saldo ?? 0;
    if (saldo < service.harga_jual) return { error: "Saldo tidak cukup. Silakan topup dulu ke owner." };

    const { data: trx, error } = await supabase
      .from("ppob_transactions")
      .insert({
        kode_trx,
        user_id: profile.id,
        service_id: service.id,
        kategori: service.kategori,
        nama_layanan: service.nama_layanan,
        tujuan: input.tujuan,
        harga_modal: service.harga_modal,
        harga_jual: service.harga_jual,
        komisi,
        metode_bayar: "SALDO",
        status: "PENDING",
      })
      .select()
      .single();
    if (error || !trx) return { error: error?.message || "Gagal membuat transaksi." };

    await supabase.from("balances").update({ saldo: saldo - service.harga_jual, updated_at: new Date().toISOString() }).eq("user_id", profile.id);
    await supabase.from("balance_mutations").insert({ user_id: profile.id, type: "DEBIT", amount: service.harga_jual, note: `PPOB ${service.nama_layanan} (${kode_trx})` });

    revalidatePath("/ppob");
    revalidatePath("/dashboard");
    return { success: true, trxId: trx.id };
  }

  if (input.metode_bayar === "CASH") {
    const { data: trx, error } = await supabase
      .from("ppob_transactions")
      .insert({
        kode_trx,
        user_id: profile.id,
        service_id: service.id,
        kategori: service.kategori,
        nama_layanan: service.nama_layanan,
        tujuan: input.tujuan,
        harga_modal: service.harga_modal,
        harga_jual: service.harga_jual,
        komisi,
        metode_bayar: "CASH",
        status: "PENDING",
      })
      .select()
      .single();
    if (error || !trx) return { error: error?.message || "Gagal membuat transaksi." };
    revalidatePath("/ppob");
    return { success: true, trxId: trx.id };
  }

  // ONLINE via Midtrans - pelanggan bayar langsung, kasir tinggal proses setelah settlement
  const { data: trx, error } = await supabase
    .from("ppob_transactions")
    .insert({
      kode_trx,
      user_id: profile.id,
      service_id: service.id,
      kategori: service.kategori,
      nama_layanan: service.nama_layanan,
      tujuan: input.tujuan,
      harga_modal: service.harga_modal,
      harga_jual: service.harga_jual,
      komisi,
      metode_bayar: "ONLINE",
      status: "PENDING",
      midtrans_order_id: kode_trx,
    })
    .select()
    .single();
  if (error || !trx) return { error: error?.message || "Gagal membuat transaksi." };

  try {
    const snapRes = await createSnapTransaction({
      orderId: kode_trx,
      amount: service.harga_jual,
      itemName: service.nama_layanan,
      customerName: input.tujuan,
    });
    await supabase.from("payments").insert({
      order_id: kode_trx,
      ref_type: "PPOB",
      ref_id: trx.id,
      user_id: profile.id,
      amount: service.harga_jual,
      status: "PENDING",
      snap_token: snapRes.token,
    });
    revalidatePath("/ppob");
    return { success: true, trxId: trx.id, token: snapRes.token, redirectUrl: snapRes.redirect_url };
  } catch (e: any) {
    await supabase.from("ppob_transactions").update({ status: "FAILED" }).eq("id", trx.id);
    return { error: "Gagal membuat pembayaran online: " + (e?.message || "unknown") };
  }
}

export async function updatePpobStatus(id: number, status: "SUCCESS" | "FAILED", sn: string, catatan: string) {
  const profile = await getCurrentProfile();
  requireOwner(profile);
  const supabase = createClient();
  await supabase.from("ppob_transactions").update({ status, sn, catatan, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/ppob");
  revalidatePath("/riwayat");
}
