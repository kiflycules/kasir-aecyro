import midtransClient from "midtrans-client";

export function getSnapClient() {
  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.MIDTRANS_CLIENT_KEY!,
  });
}

export function getCoreApiClient() {
  return new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.MIDTRANS_CLIENT_KEY!,
  });
}

// Buat transaksi Snap (QRIS, VA, e-wallet, dll - Midtrans yang tampilkan pilihan metode)
export async function createSnapTransaction(params: {
  orderId: string;
  amount: number;
  itemName: string;
  customerName: string;
}) {
  const snap = getSnapClient();
  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    item_details: [
      { id: params.orderId, price: params.amount, quantity: 1, name: params.itemName.slice(0, 50) },
    ],
    customer_details: { first_name: params.customerName },
    credit_card: { secure: true },
  };
  return snap.createTransaction(parameter);
}
