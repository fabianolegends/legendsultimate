"use client";

import { FormEvent, useState } from "react";

export default function OrganizationAccessPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("Validando acesso...");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível autenticar.");
      window.location.href = "/passport/organizacao/validacao";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível autenticar.");
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0d100d", color: "#f4eee4", display: "grid", placeItems: "center", padding: 20 }}>
      <form onSubmit={submit} style={{ width: "min(460px, 100%)", border: "1px solid #3a3d35", background: "#171a16", padding: 34 }}>
        <p style={{ color: "#d47b2d", letterSpacing: 3, textTransform: "uppercase", fontWeight: 800, marginTop: 0 }}>Legends Core</p>
        <h1 style={{ fontSize: 42, lineHeight: 1, margin: "12px 0 16px" }}>Acesso da organização</h1>
        <p style={{ color: "#b8b5ad", lineHeight: 1.6 }}>Área restrita para percursos oficiais, homologações e administração do evento.</p>
        <label htmlFor="admin-password" style={{ display: "block", margin: "24px 0 8px", fontWeight: 800 }}>Senha administrativa</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          style={{ width: "100%", boxSizing: "border-box", padding: 15, background: "#0d100d", color: "white", border: "1px solid #5a5f54" }}
        />
        <button
          type="submit"
          disabled={submitting || !password}
          style={{ width: "100%", marginTop: 18, padding: 16, border: 0, background: "#e86619", color: "white", fontWeight: 900, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "ENTRANDO..." : "ENTRAR NO PAINEL"}
        </button>
        {message && <p style={{ color: "#efb078", marginBottom: 0, lineHeight: 1.5 }}>{message}</p>}
      </form>
    </main>
  );
}
