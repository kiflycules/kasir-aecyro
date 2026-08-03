import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

// Midtrans mengirim notifikasi POST setiap ada perubahan status pembayaran.
// Set URL ini di Dashboard Midtrans > Settings > Configuration > Payment Notification URL:
//   https://<domain-vercel-kamu>/api/midtrans/webhook

export async function POST(req: Request) {
  const body = await req.json();
  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status, payment_type } = body;

  const expectedSignature = crypto
    .createHash("sha512")
    .update(order_id + status_code + gross_amount + process.env.MIDTRANS_SERVER_KEY)
    .digest("hex");

  if (signature_key !== expectedSignature) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
  }

  const supabase = createAdminClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", order_id)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  let newStatus: string = payment.status;
  if (transaction_status === "capture" || transaction_status === "settlement") {
    newStatus = fraud_status === "challenge" ? "PENDING" : "SETTLEMENT";
  } else if (transaction_status === "pending") {
    newStatus = "PENDING";
  } else if (["deny", "cancel"].includes(transaction_status)) {
    newStatus = "CANCEL";
  } else if (transaction_status === "expire") {
    newStatus = "EXPIRE";
  } else if (transaction_status === "failure") {
    newStatus = "FAILED";
  }

  await supabase
    .from("payments")
    .update({ status: newStatus, payment_type, raw_response: body, updated_at: new Date().toISOString() })
    .eq("order_id", order_id);

  const paid = newStatus === "SETTLEMENT";

  if (payment.ref_type === "SALE") {
    await supabase
      .from("sales")
      .update({
        status_bayar: paid ? "PAID" : newStatus === "EXPIRE" ? "EXPIRED" : newStatus === "PENDING" ? "PENDING" : "FAILED",
        bayar: paid ? payment.amount : 0,
        kembali: 0,
      })
      .eq("id", payment.ref_id);

    if (paid) {
      const { data: items } = await supabase.from("sale_items").select("product_id, qty").eq("sale_id", payment.ref_id);
      for (const it of items || []) {
        if (it.product_id) await supabase.rpc("decrement_stock", { p_id: it.product_id, qty: it.qty });
      }
    }
  }

  if (payment.ref_type === "PPOB") {
    await supabase
      .from("ppob_transactions")
      .update({
        status: paid ? "SUCCESS" : ["EXPIRE", "CANCEL", "FAILED"].includes(newStatus) ? "FAILED" : "PENDING",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.ref_id);
  }

  if (payment.ref_type === "TOPUP_SALDO" && paid) {
    const { data: bal } = await supabase.from("balances").select("saldo").eq("user_id", payment.user_id).maybeSingle();
    const current = bal?.saldo ?? 0;
    await supabase
      .from("balances")
      .upsert({ user_id: payment.user_id, saldo: current + payment.amount, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    await supabase.from("balance_mutations").insert({
      user_id: payment.user_id,
      type: "TOPUP",
      amount: payment.amount,
      note: `Topup online via Midtrans (${order_id})`,
    });
  }

  return NextResponse.json({ message: "OK" });
}
