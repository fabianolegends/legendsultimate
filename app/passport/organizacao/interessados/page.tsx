"use client";

import { useEffect, useMemo, useState } from "react";

type LeadStatus = "new" | "contacted" | "archived";

type Lead = {
  id: string;
  full_name: string;
  email: string;
  city: string;
  phone: string;
  expectations: string;
  status: LeadStatus;
  source: string;
  created_at: string;
  updated_at: string;
};

const statusLabel: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  archived: "Arquivado",
};

function csvCell(value: string) {
  const normalized = value.replace(/\r?\n/g, " ").trim();
  const safeValue = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

export default function PriorityListAdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLeads() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/priority-list", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Falha ao carregar.");
      setLeads(payload.leads ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLeads();
  }, []);

  async function updateStatus(id: string, status: LeadStatus) {
    const previous = leads;
    setLeads((current) =>
      current.map((lead) => (lead.id === id ? { ...lead, status } : lead)),
    );

    const response = await fetch("/api/admin/priority-list", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setLeads(previous);
      setError(payload.error || "Não foi possível atualizar o contato.");
    }
  }

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return leads;
    return leads.filter((lead) =>
      [lead.full_name, lead.email, lead.city, lead.phone, lead.expectations]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(term),
    );
  }, [leads, query]);

  const newCount = leads.filter((lead) => lead.status === "new").length;
  const contactedCount = leads.filter((lead) => lead.status === "contacted").length;

  function exportCsv() {
    const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
    const header = [
      "Nome completo",
      "E-mail",
      "Telefone",
      "Cidade",
      "O que espera da prova",
      "Situação",
      "Origem",
      "Data do cadastro",
      "Última atualização",
    ];
    const rows = filtered.map((lead) => [
      lead.full_name,
      lead.email,
      lead.phone,
      lead.city,
      lead.expectations,
      statusLabel[lead.status],
      lead.source,
      dateFormatter.format(new Date(lead.created_at)),
      dateFormatter.format(new Date(lead.updated_at)),
    ]);
    const content = [header, ...rows]
      .map((row) => row.map((value) => csvCell(String(value ?? ""))).join(";"))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${content}`], {
      type: "text/csv;charset=utf-8",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `legends-lista-prioritaria-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  }

  return (
    <main className="leadPage">
      <style>{`
        .leadPage{padding:56px 58px 90px;color:#eee9df}.leadKicker{margin:0 0 12px;color:#d17a2e;font:700 12px 'Barlow Condensed';letter-spacing:.2em;text-transform:uppercase}.leadTitle{margin:0;font:500 clamp(48px,6vw,84px)/.9 'Barlow Condensed';text-transform:uppercase}.leadIntro{max-width:760px;color:#a9ada7;font-size:17px;line-height:1.65;margin:22px 0 36px}
        .leadStats{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #343932;margin-bottom:28px}.leadStat{padding:22px;border-right:1px solid #343932}.leadStat:last-child{border:0}.leadStat strong{display:block;font:700 34px 'Barlow Condensed'}.leadStat span{color:#949992;font-size:12px;text-transform:uppercase;letter-spacing:.1em}
        .leadToolbar{display:flex;gap:14px;margin-bottom:20px}.leadSearch{flex:1;background:#111511;border:1px solid #454b43;color:#eee9df;padding:16px 18px;font:inherit}.leadAction{border:0;color:#fff;padding:0 24px;font:700 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.08em;cursor:pointer;white-space:nowrap}.leadRefresh{background:#282e27}.leadExport{background:#d8660a}.leadAction:disabled{cursor:not-allowed;opacity:.45}
        .leadError{border:1px solid #8f592a;background:#2a1b10;color:#e7a96f;padding:16px;margin:0 0 20px}.leadTableWrap{overflow:auto;border:1px solid #343932}.leadTable{width:100%;border-collapse:collapse;min-width:1020px}.leadTable th{text-align:left;color:#d17a2e;font:700 12px 'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase;padding:16px;border-bottom:1px solid #343932}.leadTable td{vertical-align:top;padding:18px 16px;border-bottom:1px solid #292e28;color:#c8cbc5}.leadTable tr:last-child td{border-bottom:0}.leadName{display:block;color:#f1ece3;font-weight:700;margin-bottom:5px}.leadContact{display:block;color:#a6aaa3;font-size:13px;line-height:1.6}.leadExpectation{max-width:420px;line-height:1.55}.leadDate{white-space:nowrap;color:#969b94}.leadStatus{background:#111511;border:1px solid #454b43;color:#eee9df;padding:10px;min-width:125px}.leadEmpty{padding:45px;text-align:center;color:#9ca099}
        @media(max-width:800px){.leadPage{padding:38px 20px 70px}.leadStats{grid-template-columns:1fr}.leadStat{border-right:0;border-bottom:1px solid #343932}.leadToolbar{flex-direction:column}.leadAction{padding:16px}}
      `}</style>

      <p className="leadKicker">Relacionamento · Pré-lançamento</p>
      <h1 className="leadTitle">Lista prioritária</h1>
      <p className="leadIntro">
        Pessoas interessadas na Legends antes da abertura oficial. Consulte o que cada
        contato espera da prova e acompanhe o relacionamento sem perder o histórico.
      </p>

      <section className="leadStats" aria-label="Resumo da lista">
        <div className="leadStat"><strong>{leads.length}</strong><span>Total de interessados</span></div>
        <div className="leadStat"><strong>{newCount}</strong><span>Novos contatos</span></div>
        <div className="leadStat"><strong>{contactedCount}</strong><span>Já contatados</span></div>
      </section>

      <div className="leadToolbar">
        <input
          className="leadSearch"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, cidade, e-mail, telefone ou expectativa"
          aria-label="Buscar interessados"
        />
        <button className="leadAction leadRefresh" type="button" onClick={() => void loadLeads()}>
          Atualizar lista
        </button>
        <button
          className="leadAction leadExport"
          type="button"
          onClick={exportCsv}
          disabled={loading || filtered.length === 0}
        >
          Exportar CSV ({filtered.length})
        </button>
      </div>

      {error ? <p className="leadError">{error}</p> : null}

      <div className="leadTableWrap">
        {loading ? (
          <p className="leadEmpty">Carregando interessados…</p>
        ) : filtered.length === 0 ? (
          <p className="leadEmpty">Nenhum interessado encontrado.</p>
        ) : (
          <table className="leadTable">
            <thead>
              <tr>
                <th>Interessado</th>
                <th>Cidade</th>
                <th>O que espera da prova</th>
                <th>Cadastro</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong className="leadName">{lead.full_name}</strong>
                    <a className="leadContact" href={`mailto:${lead.email}`}>{lead.email}</a>
                    <a className="leadContact" href={`tel:${lead.phone}`}>{lead.phone}</a>
                  </td>
                  <td>{lead.city}</td>
                  <td className="leadExpectation">{lead.expectations}</td>
                  <td className="leadDate">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(lead.created_at))}
                  </td>
                  <td>
                    <select
                      className="leadStatus"
                      value={lead.status}
                      onChange={(event) =>
                        void updateStatus(lead.id, event.target.value as LeadStatus)
                      }
                      aria-label={`Situação de ${lead.full_name}`}
                    >
                      {(Object.keys(statusLabel) as LeadStatus[]).map((status) => (
                        <option key={status} value={status}>{statusLabel[status]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
