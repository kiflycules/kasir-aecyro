import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import SaldoClient from "./SaldoClient";

export default async function SaldoPage() {
  const profile = await getCurrentProfile();
  if (profile.role !== "owner") redirect("/dashboard");

  const supabase = createClient();
  const { data: profiles } = await supabase.from("profiles").select("*").order("nama");
  const { data: balances } = await supabase.from("balances").select("*");

  const users = (profiles || []).map((p) => ({
    ...p,
    saldo: balances?.find((b) => b.user_id === p.id)?.saldo ?? 0,
  }));

  return (
    <div>
      <div className="top-blue" style={{ padding: "22px 22px 46px" }}>
        <div className="logo">Saldo Digital User</div>
        <p style={{ margin: "8px 0 0", color: "#dce8ff" }}>Owner bisa topup saldo user secara manual.</p>
      </div>
      <div style={{ marginTop: 14 }}>
        <SaldoClient users={users} />
      </div>
    </div>
  );
}
