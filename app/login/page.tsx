import { loginAction } from "./actions";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <h1 style={{ margin: "0 0 6px" }}>
          ACR<span style={{ color: "#17c964" }}>Store</span>
        </h1>
        <p style={{ marginTop: 0, color: "#777" }}>Kasir • Stok Barang • Pulsa • Transfer • Topup</p>
        {searchParams?.error && <div className="alert">{searchParams.error}</div>}
        <form action={loginAction}>
          <label>ID ACR</label>
          <input className="input" style={{ marginTop: 6, marginBottom: 14 }} name="username" placeholder="ACR****" autoComplete="username" required />
          <label>Password</label>
          <input className="input" style={{ marginTop: 6, marginBottom: 18 }} name="password" type="password" autoComplete="current-password" required />
          <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
            LOGIN
          </button>
        </form>
      </div>
    </div>
  );
}
