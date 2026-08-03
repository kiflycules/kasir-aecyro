import { createClient } from "@/lib/supabase/server";
import KasirClient from "./KasirClient";

export default async function KasirPage() {
  const supabase = createClient();
  const { data: products } = await supabase.from("products").select("*").order("nama");

  return (
    <div>
      <div className="top-blue" style={{ padding: "26px 22px 88px" }}>
        <div className="logo">
          Kasir <span>Barang</span>
        </div>
        <p style={{ margin: "10px 0 0", color: "#dce8ff" }}>Pilih produk, atur jumlah, lalu selesaikan pembayaran.</p>
      </div>
      <KasirClient products={products || []} />
    </div>
  );
}
