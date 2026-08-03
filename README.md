# ACR Store — Kasir Barang + PPOB (Supabase + Vercel + Midtrans)

Ini adalah hasil migrasi dari versi PHP/MySQL ke stack modern:
**Next.js (React/TypeScript)** + **Supabase** (database, auth, storage) + **Vercel** (hosting) + **Midtrans** (pembayaran online: QRIS, transfer VA, e-wallet, dll — plus pembayaran cash tetap didukung).

Kenapa tidak PHP langsung diupload ke Vercel? Vercel tidak menjalankan PHP, dan Supabase adalah database Postgres (bukan MySQL) — jadi aplikasinya ditulis ulang total memakai stack yang memang didesain untuk kombinasi Supabase + Vercel.

---

## 1. Setup Supabase

1. Buka [supabase.com](https://supabase.com) → buat project baru (kalau belum punya).
2. Masuk ke **SQL Editor** → buka file `supabase/schema.sql` di project ini → copy semua isinya → paste ke SQL Editor → **Run**.
   Ini akan membuat semua tabel, keamanan (Row Level Security), function, dan data awal (produk & layanan contoh).
3. Masuk ke **Storage** → buat bucket baru bernama `profile-photos` → set **Public bucket** = ON (supaya foto profil bisa tampil).
4. Masuk ke **Authentication → Providers** → pastikan **Email** provider aktif (default sudah aktif). Matikan "Confirm email" di **Authentication → Settings** (supaya akun yang dibuat owner lewat menu "Kelola User" langsung bisa login tanpa verifikasi email, karena aplikasi ini pakai email dummy internal, bukan email asli staff).
5. Buat akun **owner pertama** secara manual:
   - Masuk ke **Authentication → Users → Add user → Create new user**.
   - Email: `acr6040@acrstore.local` (format: `[username-lowercase]@acrstore.local`)
   - Password: bebas, minimal 6 karakter.
   - Centang "Auto Confirm User".
   - Setelah user dibuat, buka **Table Editor → profiles** → cari baris yang otomatis dibuat untuk user ini (dari trigger) → edit kolom `role` jadi `owner`, `nama` dan `username` sesuai keinginan (username harus **UPPERCASE**, misal `ACR6040`, karena dipakai untuk login).
   - Setelah owner pertama ini bisa login, staff/kasir lainnya bisa dibuat langsung dari menu **Kelola User** di aplikasi — tidak perlu lagi masuk ke Supabase Dashboard.
6. Ambil kredensial API: **Project Settings → API**
   - `Project URL` → jadi `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → jadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (klik "reveal") → jadi `SUPABASE_SERVICE_ROLE_KEY` — **JANGAN pernah expose ini ke browser/klien, hanya dipakai di server.**

---

## 2. Setup Midtrans (pembayaran online)

1. Daftar akun di [midtrans.com](https://midtrans.com) (mode **Sandbox** dulu untuk uji coba, gratis).
2. Masuk **Settings → Access Keys** → salin:
   - `Server Key` → jadi `MIDTRANS_SERVER_KEY`
   - `Client Key` → jadi `MIDTRANS_CLIENT_KEY` dan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
3. Aktifkan channel pembayaran yang mau dipakai di **Settings → Snap Preferences** (QRIS, GoPay, transfer VA BCA/BNI/BRI/Permata, dll).
4. **Setelah deploy ke Vercel** (langkah di bawah), kembali ke Midtrans Dashboard → **Settings → Configuration**:
   - Payment Notification URL: `https://<domain-vercel-kamu>/api/midtrans/webhook`
   - Finish/Unfinish/Error redirect URL (opsional): `https://<domain-vercel-kamu>/kasir`
5. Kalau sudah siap terima transaksi asli, ajukan **go-live** di Midtrans dan ganti `MIDTRANS_IS_PRODUCTION` / `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` jadi `true`, lalu ganti Server/Client Key ke yang versi production.

---

## 3. Push ke GitHub

Dari folder project ini:

```bash
git init
git add .
git commit -m "Initial commit - ACR Store kasir + PPOB"
git branch -M main
git remote add origin https://github.com/<username-kamu>/kasir-aecyro.git
git push -u origin main
```

(Buat dulu repo kosong bernama `kasir-aecyro` di GitHub kalau belum ada.)

---

## 4. Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) → **Add New → Project** → import repo GitHub yang baru saja kamu push.
2. Framework Preset akan otomatis terdeteksi sebagai **Next.js** — tidak perlu diubah.
3. Di bagian **Environment Variables**, isi semua variabel berikut (nilainya dari langkah 1 & 2 di atas):

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   MIDTRANS_SERVER_KEY
   MIDTRANS_CLIENT_KEY
   MIDTRANS_IS_PRODUCTION        (isi: false, ganti true saat sudah go-live)
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
   NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION   (isi: false)
   NEXT_PUBLIC_APP_URL           (isi setelah tahu domain vercel-nya, boleh diisi belakangan)
   ```

4. Klik **Deploy**. Tunggu sampai selesai — Vercel akan kasih URL seperti `kasir-aecyro.vercel.app`.
5. Kembali ke Midtrans Dashboard, isi **Payment Notification URL** dengan `https://kasir-aecyro.vercel.app/api/midtrans/webhook` (langkah 2.4 di atas).
6. Setiap kali kamu `git push` ke branch `main`, Vercel otomatis build & deploy ulang.

---

## 5. Login pertama kali

Gunakan username & password akun owner yang kamu buat di langkah 1.5 (di Supabase Dashboard). Setelah masuk, buka menu **Kelola User** untuk menambah akun kasir/staff lain — tidak perlu lagi menyentuh Supabase Dashboard untuk ini.

---

## Ringkasan fitur

- **Kasir barang**: keranjang belanja, stok otomatis berkurang, bayar **cash** (hitung kembalian otomatis) atau **online** (popup Midtrans: QRIS/VA/e-wallet/kartu).
- **PPOB**: pulsa, transfer bank manual, e-wallet (DANA/OVO/GoPay), top-up game, token PLN. Bisa dibayar pakai **saldo digital**, **cash**, atau **online**. Owner menandai transaksi sukses/gagal + input SN.
- **Saldo digital per user**: owner bisa topup manual (misal staff sudah setor cash/transfer ke owner).
- **Riwayat & Laporan** gabungan barang + PPOB, filter tanggal.
- **Role**: `owner`, `admin`, `kasir`, `staff` — menu di sidebar otomatis menyesuaikan.
- Semua transaksi Midtrans (status pending/settlement/gagal/kedaluwarsa) diperbarui otomatis lewat webhook `/api/midtrans/webhook`, jadi status pembayaran online selalu akurat walau kasir menutup browser.

## Struktur proyek penting

```
supabase/schema.sql          -> jalankan sekali di Supabase SQL Editor
app/(app)/...                -> halaman-halaman aplikasi (perlu login)
app/login/                   -> halaman login
app/api/midtrans/webhook/    -> endpoint notifikasi Midtrans
lib/supabase/                -> koneksi Supabase (browser, server, middleware)
lib/midtrans.ts              -> helper bikin transaksi Snap Midtrans
```

## Menjalankan di lokal (opsional, untuk uji coba sebelum deploy)

```bash
npm install
cp .env.example .env.local   # lalu isi sesuai kredensial Supabase & Midtrans kamu
npm run dev
```

Buka `http://localhost:3000`.
