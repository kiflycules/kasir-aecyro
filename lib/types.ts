export type Role = "owner" | "admin" | "kasir" | "staff";

export type Profile = {
  id: string;
  nama: string;
  username: string;
  role: Role;
  foto: string | null;
  created_at: string;
};

export type Product = {
  id: number;
  nama: string;
  harga: number;
  stok: number;
  foto: string | null;
};

export type Service = {
  id: number;
  kategori: "PULSA" | "TRANSFER" | "EWALLET" | "GAME" | "PLN";
  provider: string | null;
  nama_layanan: string;
  harga_modal: number;
  harga_jual: number;
  status: "AKTIF" | "NONAKTIF";
};

export type Sale = {
  id: number;
  kode_trx: string;
  user_id: string;
  total: number;
  metode_bayar: "CASH" | "ONLINE";
  status_bayar: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  bayar: number;
  kembali: number;
  midtrans_order_id: string | null;
  created_at: string;
};

export type PpobTransaction = {
  id: number;
  kode_trx: string;
  user_id: string;
  service_id: number;
  kategori: string;
  nama_layanan: string;
  tujuan: string;
  harga_modal: number;
  harga_jual: number;
  komisi: number;
  metode_bayar: "SALDO" | "CASH" | "ONLINE";
  status: "PENDING" | "SUCCESS" | "FAILED";
  sn: string | null;
  catatan: string | null;
  midtrans_order_id: string | null;
  created_at: string;
};

export function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function generateKodeTrx(prefix: string) {
  const now = new Date();
  const stamp = now.getTime().toString().slice(-8);
  return `${prefix}${stamp}`;
}
