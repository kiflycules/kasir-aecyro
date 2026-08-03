"use server";

import { createClient } from "@/lib/supabase/server";
import { generateKodeTrx } from "@/lib/types";
import { createSnapTransaction } from "@/lib/midtrans";
import { revalidatePath } from "next/cache";

type CartItem = { product_id: number; nama: string; harga: number; qty: number };

async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");
  return { supabase, userId: user.id };
}

export async function createCashSale(items: CartItem[], bayar: number) {
  if (!items.length) return { error: "Keranjang masih kosong." };
  const { supabase, userId } = await getUser();

  const total = items.reduce((a, i) => a + i.harga * i.qty, 0);
  if (bayar < total) return { error: "Uang bayar kurang dari total." };

  const kode_trx = generateKodeTrx("TRX");
  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .insert({
      kode_trx,
      user_id: userId,
      total,
      metode_bayar: "CASH",
      status_bayar: "PAID",
      bayar,
      kembali: bayar - total,
    })
    .select()
    .single();
  if (saleErr || !sale) return { error: saleErr?.message || "Gagal menyimpan transaksi." };

  await supabase.from("sale_items").insert(
    items.map((i) => ({
      sale_id: sale.id,
      product_id: i.product_id,
      nama_produk: i.nama,
      harga: i.harga,
      qty: i.qty,
      subtotal: i.harga * i.qty,
    }))
  );

  for (const i of items) {
    await supabase.rpc("decrement_stock", { p_id: i.product_id, qty: i.qty });
  }

  revalidatePath("/kasir");
  revalidatePath("/riwayat");
  return { success: true, saleId: sale.id, kembali: bayar - total };
}

export async function createOnlineSale(items: CartItem[]) {
  if (!items.length) return { error: "Keranjang masih kosong." };
  const { supabase, userId } = await getUser();

  const total = items.reduce((a, i) => a + i.harga * i.qty, 0);
  const kode_trx = generateKodeTrx("TRXOL");

  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .insert({
      kode_trx,
      user_id: userId,
      total,
      metode_bayar: "ONLINE",
      status_bayar: "PENDING",
      bayar: 0,
      kembali: 0,
      midtrans_order_id: kode_trx,
    })
    .select()
    .single();
  if (saleErr || !sale) return { error: saleErr?.message || "Gagal menyimpan transaksi." };

  await supabase.from("sale_items").insert(
    items.map((i) => ({
      sale_id: sale.id,
      product_id: i.product_id,
      nama_produk: i.nama,
      harga: i.harga,
      qty: i.qty,
      subtotal: i.harga * i.qty,
    }))
  );

  try {
    const snapRes = await createSnapTransaction({
      orderId: kode_trx,
      amount: total,
      itemName: `Belanja ${items.length} item`,
      customerName: "Pelanggan ACR Store",
    });

    await supabase.from("payments").insert({
      order_id: kode_trx,
      ref_type: "SALE",
      ref_id: sale.id,
      user_id: userId,
      amount: total,
      status: "PENDING",
      snap_token: snapRes.token,
    });

    revalidatePath("/kasir");
    return { success: true, saleId: sale.id, redirectUrl: snapRes.redirect_url, token: snapRes.token };
  } catch (e: any) {
    await supabase.from("sales").update({ status_bayar: "FAILED" }).eq("id", sale.id);
    return { error: "Gagal membuat pembayaran online: " + (e?.message || "unknown") };
  }
}

export async function checkSaleStatus(saleId: number) {
  const { supabase } = await getUser();
  const { data } = await supabase.from("sales").select("status_bayar").eq("id", saleId).single();
  return data?.status_bayar || "PENDING";
}
