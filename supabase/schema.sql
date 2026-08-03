-- ACR STORE GABUNGAN - versi Supabase (Postgres)
-- Jalankan di Supabase Dashboard > SQL Editor.

-- ============ PROFILES (nempel ke auth.users) ============
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  username text not null unique,
  role text not null default 'staff' check (role in ('owner','admin','kasir','staff')),
  foto text,
  created_at timestamptz default now()
);

-- Helper: cek apakah user yang login adalah owner
create or replace function is_owner()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'owner'
  );
$$;

-- ============ BALANCES (saldo digital per user) ============
create table if not exists balances (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  saldo bigint not null default 0,
  updated_at timestamptz default now(),
  unique(user_id)
);

-- ============ PRODUCTS ============
create table if not exists products (
  id bigint generated always as identity primary key,
  nama text not null,
  harga bigint not null default 0,
  stok integer not null default 0,
  foto text,
  created_at timestamptz default now()
);

-- ============ SALES (kasir barang) ============
create table if not exists sales (
  id bigint generated always as identity primary key,
  kode_trx text,
  user_id uuid references profiles(id),
  total bigint not null default 0,
  metode_bayar text not null default 'CASH' check (metode_bayar in ('CASH','ONLINE')),
  status_bayar text not null default 'PAID' check (status_bayar in ('PENDING','PAID','FAILED','EXPIRED')),
  bayar bigint not null default 0,
  kembali bigint not null default 0,
  midtrans_order_id text unique,
  created_at timestamptz default now()
);

create table if not exists sale_items (
  id bigint generated always as identity primary key,
  sale_id bigint not null references sales(id) on delete cascade,
  product_id bigint references products(id),
  nama_produk text,
  harga bigint not null default 0,
  qty integer not null default 0,
  subtotal bigint not null default 0
);

-- ============ SERVICES (katalog PPOB) ============
create table if not exists services (
  id bigint generated always as identity primary key,
  kategori text not null check (kategori in ('PULSA','TRANSFER','EWALLET','GAME','PLN')),
  provider text,
  nama_layanan text not null,
  harga_modal bigint not null default 0,
  harga_jual bigint not null default 0,
  status text not null default 'AKTIF' check (status in ('AKTIF','NONAKTIF'))
);

-- ============ PPOB TRANSACTIONS ============
create table if not exists ppob_transactions (
  id bigint generated always as identity primary key,
  kode_trx text not null,
  user_id uuid not null references profiles(id),
  service_id bigint not null references services(id),
  kategori text,
  nama_layanan text,
  tujuan text,
  harga_modal bigint default 0,
  harga_jual bigint default 0,
  komisi bigint default 0,
  metode_bayar text not null default 'SALDO' check (metode_bayar in ('SALDO','CASH','ONLINE')),
  status text not null default 'PENDING' check (status in ('PENDING','SUCCESS','FAILED')),
  sn text,
  catatan text,
  midtrans_order_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- ============ BALANCE MUTATIONS ============
create table if not exists balance_mutations (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id),
  type text not null check (type in ('TOPUP','DEBIT','KREDIT','ADJUSTMENT')),
  amount bigint not null,
  note text,
  created_at timestamptz default now()
);

-- ============ PAYMENTS (log semua transaksi Midtrans, cash & online) ============
create table if not exists payments (
  id bigint generated always as identity primary key,
  order_id text not null unique,
  ref_type text not null check (ref_type in ('SALE','PPOB','TOPUP_SALDO')),
  ref_id bigint not null,
  user_id uuid references profiles(id),
  amount bigint not null,
  payment_type text,
  status text not null default 'PENDING' check (status in ('PENDING','SETTLEMENT','EXPIRE','FAILED','CANCEL')),
  snap_token text,
  raw_response jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ TRIGGER: buat profile otomatis saat user baru dibuat ============
-- (dipakai saat owner menambah kasir lewat Supabase Admin API di app/(app)/users)
create or replace function handle_new_user_profile()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, nama, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', 'User Baru'),
    coalesce(new.raw_user_meta_data->>'username', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  );
  insert into balances (user_id, saldo) values (new.id, 0);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user_profile();

-- ============ RPC: kurangi stok secara atomik ============
create or replace function decrement_stock(p_id bigint, qty integer)
returns void
language sql
security definer
as $$
  update products set stok = greatest(0, stok - qty) where id = p_id;
$$;

grant execute on function decrement_stock(bigint, integer) to authenticated;

-- ============ RLS ============
alter table profiles enable row level security;
alter table balances enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table services enable row level security;
alter table ppob_transactions enable row level security;
alter table balance_mutations enable row level security;
alter table payments enable row level security;

-- Semua staff yang login boleh baca (aplikasi internal toko)
create policy "read all - profiles" on profiles for select using (auth.uid() is not null);
create policy "read all - balances" on balances for select using (auth.uid() is not null);
create policy "read all - products" on products for select using (auth.uid() is not null);
create policy "read all - sales" on sales for select using (auth.uid() is not null);
create policy "read all - sale_items" on sale_items for select using (auth.uid() is not null);
create policy "read all - services" on services for select using (auth.uid() is not null);
create policy "read all - ppob" on ppob_transactions for select using (auth.uid() is not null);
create policy "read all - mutations" on balance_mutations for select using (auth.uid() is not null);
create policy "read all - payments" on payments for select using (auth.uid() is not null);

-- Produk & layanan: hanya owner yang bisa ubah/tambah/hapus
create policy "owner write - products" on products for all using (is_owner()) with check (is_owner());
create policy "owner write - services" on services for all using (is_owner()) with check (is_owner());
create policy "owner write - profiles" on profiles for update using (is_owner() or id = auth.uid());
create policy "owner write - balances" on balances for all using (is_owner()) with check (is_owner());
create policy "owner write - mutations" on balance_mutations for insert with check (is_owner());

-- Kasir & owner boleh input transaksi
create policy "staff insert - sales" on sales for insert with check (auth.uid() is not null);
create policy "staff insert - sale_items" on sale_items for insert with check (auth.uid() is not null);
create policy "staff insert - ppob" on ppob_transactions for insert with check (auth.uid() is not null);
create policy "owner update - ppob" on ppob_transactions for update using (is_owner());
create policy "staff insert - payments" on payments for insert with check (auth.uid() is not null);

-- ============ SEED DATA ============
insert into products (nama, harga, stok) values
  ('Air Mineral', 5000, 50),
  ('Kopi Sachet', 3000, 80),
  ('Roti', 7000, 30)
on conflict do nothing;

insert into services (kategori, provider, nama_layanan, harga_modal, harga_jual, status) values
  ('PULSA','TELKOMSEL','Telkomsel 10.000',10500,12000,'AKTIF'),
  ('PULSA','TELKOMSEL','Telkomsel 25.000',25500,28000,'AKTIF'),
  ('PULSA','XL','XL 10.000',10400,12000,'AKTIF'),
  ('PULSA','INDOSAT','Indosat 20.000',20300,23000,'AKTIF'),
  ('TRANSFER','BANK','Transfer Bank Manual',6500,10000,'AKTIF'),
  ('EWALLET','DANA','Topup DANA',1000,3000,'AKTIF'),
  ('EWALLET','OVO','Topup OVO',1000,3000,'AKTIF'),
  ('EWALLET','GOPAY','Topup GoPay',1000,3000,'AKTIF'),
  ('GAME','MOBILE LEGENDS','86 Diamond ML',19000,22000,'AKTIF'),
  ('GAME','FREE FIRE','70 Diamond FF',9500,12000,'AKTIF'),
  ('PLN','PLN','Token PLN 20.000',20500,23000,'AKTIF')
on conflict do nothing;

-- CATATAN: user pertama (owner) dibuat lewat Supabase Auth (lihat README.md langkah 3),
-- bukan lewat INSERT SQL biasa, karena password dikelola oleh Supabase Auth (bukan tabel ini).
