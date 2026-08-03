import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProdukClient from "./ProdukClient";

export default async function ProdukPage() {
  const profile = await getCurrentProfile();
  if (!["owner", "admin"].includes(profile.role)) redirect("/dashboard");

  const supabase = createClient();
  const { data: products } = await supabase.from("products").select("*").order("nama");

  return (
    <div>
      <div className="top-blue" style={{ padding: "22px 22px 46px" }}>
        <div className="logo">Produk</div>
        <p style={{ margin: "8px 0 0", color: "#dce8ff" }}>Kelola stok dan harga barang di toko.</p>
      </div>
      <div style={{ marginTop: 14 }}>
        <ProdukClient products={products || []} />
      </div>
    </div>
  );
}
