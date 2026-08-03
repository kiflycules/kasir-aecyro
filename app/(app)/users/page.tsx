import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const profile = await getCurrentProfile();
  if (profile.role !== "owner") redirect("/dashboard");

  const supabase = createClient();
  const { data: users } = await supabase.from("profiles").select("*").order("created_at");

  return (
    <div>
      <div className="top-blue" style={{ padding: "22px 22px 46px" }}>
        <div className="logo">Kelola User</div>
        <p style={{ margin: "8px 0 0", color: "#dce8ff" }}>Tambah akun kasir/staff baru, atau ubah role.</p>
      </div>
      <div style={{ marginTop: 14 }}>
        <UsersClient users={users || []} currentUserId={profile.id} />
      </div>
    </div>
  );
}
