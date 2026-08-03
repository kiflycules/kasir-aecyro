"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { formatRupiah } from "@/lib/types";
import { createCashSale, createOnlineSale } from "./actions";

declare global {
  interface Window {
    snap?: { pay: (token: string, opts: Record<string, any>) => void };
  }
}

type CartLine = { product_id: number; nama: string; harga: number; qty: number; stok: number };

export default function KasirClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [bayar, setBayar] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "err" | "ok"; text: string } | null>(null);
  const [struk, setStruk] = useState<{ total: number; kembali: number } | null>(null);

  const filtered = products.filter((p) => p.nama.toLowerCase().includes(query.toLowerCase()));
  const total = useMemo(() => cart.reduce((a, i) => a + i.harga * i.qty, 0), [cart]);
  const bayarNum = Number(bayar) || 0;

  function addToCart(p: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === p.id);
      if (existing) {
        if (existing.qty >= p.stok) return prev;
        return prev.map((i) => (i.product_id === p.id ? { ...i, qty: i.qty + 1 } : i));
      }
      if (p.stok < 1) return prev;
      return [...prev, { product_id: p.id, nama: p.nama, harga: p.harga, qty: 1, stok: p.stok }];
    });
  }

  function setQty(id: number, qty: number) {
    setCart((prev) =>
      prev.map((i) => (i.product_id === id ? { ...i, qty: Math.max(0, Math.min(qty, i.stok)) } : i)).filter((i) => i.qty > 0)
    );
  }

  function resetCart() {
    setCart([]);
    setBayar("");
    setStruk(null);
  }

  async function payCash() {
    setMsg(null);
    if (bayarNum < total) {
      setMsg({ type: "err", text: "Uang bayar kurang dari total belanja." });
      return;
    }
    setLoading(true);
    const res = await createCashSale(
      cart.map(({ product_id, nama, harga, qty }) => ({ product_id, nama, harga, qty })),
      bayarNum
    );
    setLoading(false);
    if ("error" in res && res.error) {
      setMsg({ type: "err", text: res.error });
      return;
    }
    setStruk({ total, kembali: res.kembali! });
    setCart([]);
    setBayar("");
    router.refresh();
  }

  async function payOnline() {
    setMsg(null);
    setLoading(true);
    const res = await createOnlineSale(cart.map(({ product_id, nama, harga, qty }) => ({ product_id, nama, harga, qty })));
    setLoading(false);
    if ("error" in res && res.error) {
      setMsg({ type: "err", text: res.error });
      return;
    }
    if (res.token && window.snap) {
      window.snap.pay(res.token, {
        onSuccess: () => {
          setMsg({ type: "ok", text: "Pembayaran online berhasil! Struk tercatat otomatis." });
          resetCart();
          router.refresh();
        },
        onPending: () => {
          setMsg({ type: "ok", text: "Menunggu pembayaran pelanggan. Cek status di menu Riwayat." });
          resetCart();
          router.refresh();
        },
        onError: () => setMsg({ type: "err", text: "Pembayaran online gagal." }),
        onClose: () => setMsg({ type: "err", text: "Popup pembayaran ditutup sebelum selesai." }),
      });
    } else if (res.redirectUrl) {
      window.open(res.redirectUrl, "_blank");
      resetCart();
    }
  }

  if (struk) {
    return (
      <div className="card" style={{ marginTop: -60, textAlign: "center", maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
        <span className="badge">Transaksi Berhasil</span>
        <p style={{ color: "#7c8496", margin: "16px 0 2px" }}>Total</p>
        <h1 style={{ margin: "0 0 16px" }}>{formatRupiah(struk.total)}</h1>
        <p style={{ color: "#7c8496", margin: "0 0 2px" }}>Kembalian</p>
        <h2 style={{ margin: "0 0 20px", color: "#0ea66b" }}>{formatRupiah(struk.kembali)}</h2>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setStruk(null)}>
          Transaksi Baru
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14, margin: "-60px 0 20px", position: "relative" }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Pilih Produk</h2>
        <input className="input" placeholder="Cari produk..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 10 }}>
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stok < 1}
              className="card"
              style={{ textAlign: "left", cursor: p.stok < 1 ? "not-allowed" : "pointer", opacity: p.stok < 1 ? 0.4 : 1, padding: 12 }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>{p.nama}</p>
              <p style={{ margin: "4px 0 0", color: "#7c8496", fontSize: 13 }}>{formatRupiah(p.harga)}</p>
              <p style={{ margin: "2px 0 0", color: "#a7adba", fontSize: 11 }}>Stok: {p.stok}</p>
            </button>
          ))}
          {filtered.length === 0 && <p style={{ color: "#7c8496" }}>Produk tidak ditemukan.</p>}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Keranjang</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {cart.map((i) => (
              <div key={i.product_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{i.nama}</p>
                  <p style={{ margin: 0, color: "#7c8496", fontSize: 13 }}>{formatRupiah(i.harga)}</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={i.stok}
                  value={i.qty}
                  onChange={(e) => setQty(i.product_id, Number(e.target.value))}
                  className="input"
                  style={{ width: 70, textAlign: "center" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card checkout-panel">
        <small>RINGKASAN PEMBAYARAN</small>
        <div className="checkout-row">
          <span>Subtotal</span>
          <b>{formatRupiah(total)}</b>
        </div>
        <div className="checkout-row">
          <span>Uang diterima</span>
          <b>{formatRupiah(bayarNum)}</b>
        </div>
        <div style={{ paddingTop: 20 }}>
          <small>KEMBALIAN</small>
          <div className="checkout-total">{formatRupiah(Math.max(0, bayarNum - total))}</div>
        </div>

        <label style={{ display: "block", marginTop: 18, marginBottom: 4, fontSize: 13, fontWeight: 700 }}>Uang diterima (cash)</label>
        <input
          type="number"
          className="input"
          placeholder="0"
          value={bayar}
          onChange={(e) => setBayar(e.target.value)}
          style={{ background: "#1d2939", color: "#fff", border: "1px solid #475467" }}
        />
        <div className="pay-shortcuts">
          <button type="button" onClick={() => setBayar("20000")}>20K</button>
          <button type="button" onClick={() => setBayar("50000")}>50K</button>
          <button type="button" onClick={() => setBayar("100000")}>100K</button>
        </div>

        {msg && (
          <p style={{ color: msg.type === "err" ? "#ff9d9d" : "#6ce9b8", fontSize: 14, marginBottom: 12 }}>{msg.text}</p>
        )}

        <button className="btn btn-primary" style={{ width: "100%", marginBottom: 10 }} disabled={loading || cart.length === 0} onClick={payCash}>
          Bayar Cash & Cetak Struk →
        </button>
        <button className="btn btn-light" style={{ width: "100%" }} disabled={loading || cart.length === 0} onClick={payOnline}>
          Bayar Online (QRIS / VA / E-Wallet)
        </button>
      </div>
    </div>
  );
}
