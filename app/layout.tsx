import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACR Store - Kasir",
  description: "Kasir barang + PPOB (pulsa, transfer, e-wallet, game, PLN)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-sans">{children}</body>
    </html>
  );
}
