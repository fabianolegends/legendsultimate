"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  formatBrazilianPostalCode,
  lookupBrazilianPostalCode,
  normalizeBrazilianPostalCode,
} from "@/lib/viacep";
import { useOrganizationEvent } from "../EventContext";

type EventRow = {
  id: string;
  name: string;
  status: string;
  starts_on: string | null;
  ends_on: string | null;
};
type Registration = {
  id: string;
  event_id: string;
  athlete_id: string | null;
  registration_code: string;
  bib_number: string | null;
  full_name: string;
  email: string;
  birth_date: string | null;
  gender: string | null;
  category: string | null;
  modality: string;
  country_code: string | null;
  city: string | null;
  status: string;
  claimed_at: string | null;
  source: "windfit" | "manual" | "online";
  external_registration_id: string | null;
  payment_status: string;
  phone?: string | null;
  location?: string | null;
  registered_at?: string | null;
  cpf_cnpj?: string | null;
  postal_code?: string | null;
  address?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  province?: string | null;
  payment_provider?: string | null;
  payment_amount_cents?: number | null;
  payment_checkout_id?: string | null;
  payment_checkout_url?: string | null;
  payment_checkout_status?: string | null;
  payment_expires_at?: string | null;
  payment_confirmed_at?: string | null;
  payment_refunded_at?: string | null;
  last_payment_event_at?: string | null;
  registration_lot_name?: string | null;
  registration_base_fee_cents?: number | null;
  senior_discount_applied?: boolean;
  senior_discount_cents?: number;
  premium_kit_selected?: boolean;
  premium_kit_fee_cents?: number;
  casual_shirt_size?: string | null;
  jersey_size?: string | null;
  regulation_version?: string | null;
  terms_accepted_at?: string | null;
  privacy_accepted_at?: string | null;
  created_at: string;
  imported_at: string | null;
  last_synced_at: string | null;
  athlete?: { ride_with_gps_user_id?: number } | null;
};
type Summary = {
  total: number;
  eligible: number;
  paid: number;
  payment_pending: number;
  refunded: number;
  cancelled: number;
  linked: number;
  last_sync: string | null;
};
type BibSequence = {
  id?: string;
  category: string;
  start_number: number;
  next_number?: number;
  padding: number;
};
type LinkAudit = {
  id: string;
  registration_id: string;
  ride_with_gps_user_id: number | null;
  action:
    | "linked"
    | "unlinked"
    | "transferred_in"
    | "transferred_out"
    | "migration_unlinked";
  actor_type: "athlete" | "admin" | "system";
  reason: string | null;
  created_at: string;
};
type FormState = {
  event_id: string;
  registration_code: string;
  bib_number: string;
  full_name: string;
  email: string;
  birth_date: string;
  gender: string;
  category: string;
  modality: string;
  country_code: string;
  city: string;
  status: string;
  payment_status: string;
  external_registration_id: string;
  phone: string;
  location: string;
  registered_at: string;
  cpf_cnpj: string;
  postal_code: string;
  address: string;
  address_number: string;
  address_complement: string;
  province: string;
  casual_shirt_size: string;
  jersey_size: string;
};
type RegistrationView = "registration" | "contact" | "financial";

const categories = [
  "Masculino Open 18–35",
  "Masculino Master 36–49",
  "Masculino Sênior 50+",
  "Feminino 18–40",
  "Feminino 41+",
  "Feminino única",
  "Experience",
];
const emptyForm: FormState = {
  event_id: "",
  registration_code: "",
  bib_number: "",
  full_name: "",
  email: "",
  birth_date: "",
  gender: "",
  category: "",
  modality: "gravel_race",
  country_code: "BR",
  city: "",
  status: "confirmed",
  payment_status: "courtesy",
  external_registration_id: "",
  phone: "",
  location: "",
  registered_at: "",
  cpf_cnpj: "",
  postal_code: "",
  address: "",
  address_number: "",
  address_complement: "",
  province: "",
  casual_shirt_size: "",
  jersey_size: "",
};

function csvLine(line: string, separator: string) {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === separator && !quoted) {
      cells.push(value.trim());
      value = "";
    } else value += char;
  }
  cells.push(value.trim());
  return cells;
}
function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_");
}
function parseCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2)
    throw new Error(
      "O CSV da Windfit precisa ter cabeçalho e ao menos um atleta.",
    );
  const separator =
    (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0)
      ? ";"
      : ",";
  const headers = csvLine(lines[0], separator).map(normalizeHeader);
  const aliases: Record<string, string[]> = {
    full_name: ["nome", "nome_completo", "atleta", "participante", "full_name"],
    email: ["email", "e_mail", "email_do_atleta"],
    bib_number: [
      "numero",
      "numero_atleta",
      "numero_do_atleta",
      "bib",
      "bib_number",
    ],
    birth_date: [
      "nascimento",
      "data_nascimento",
      "data_de_nascimento",
      "birth_date",
    ],
    gender: ["sexo", "genero", "gender"],
    category: ["categoria", "category"],
    modality: ["modalidade", "produto", "prova", "modality"],
    country_code: ["pais", "country", "country_code"],
    city: ["cidade", "city"],
    location: ["cidade_estado_pais", "localizacao", "location"],
    phone: ["telefone", "telefone_do_atleta", "celular", "phone", "whatsapp"],
    registered_at: [
      "data_da_inscricao",
      "data_inscricao",
      "inscrito_em",
      "registration_date",
      "registered_at",
    ],
    status: [
      "status",
      "status_da_inscricao",
      "situacao",
      "situacao_inscricao",
      "situacao_da_inscricao",
    ],
    registration_code: [
      "codigo",
      "codigo_inscricao",
      "codigo_de_inscricao",
      "registration_code",
    ],
    external_registration_id: [
      "id",
      "id_inscricao",
      "id_da_inscricao",
      "inscricao_id",
      "pedido",
      "numero_pedido",
    ],
    payment_status: [
      "pagamento",
      "status_pagamento",
      "status_do_pagamento",
      "situacao_pagamento",
      "situacao_do_pagamento",
      "payment_status",
      "financeiro",
    ],
  };
  const indexOf = (field: string) =>
    headers.findIndex((header) => aliases[field].includes(header));
  return lines
    .slice(1)
    .map((line) => {
      const values = csvLine(line, separator);
      const read = (field: string) => {
        const index = indexOf(field);
        return index >= 0 ? (values[index] ?? "") : "";
      };
      const modalityText = read("modality").toLowerCase();
      const registrationStatus = read("status");
      return {
        full_name: read("full_name"),
        email: read("email").toLowerCase(),
        bib_number: read("bib_number") || null,
        birth_date: read("birth_date") || null,
        gender: read("gender") || null,
        category: read("category") || null,
        modality:
          modalityText.includes("experience") ||
          modalityText.includes("turismo")
            ? "experience"
            : "gravel_race",
        country_code: read("country_code") || "BR",
        city: read("city") || null,
        status: registrationStatus || "confirmed",
        registration_code: read("registration_code") || undefined,
        external_registration_id: read("external_registration_id") || null,
        payment_status:
          read("payment_status") || registrationStatus || undefined,
        phone: read("phone") || null,
        location: read("location") || null,
        registered_at: read("registered_at") || null,
      };
    })
    .filter((row) => row.full_name && row.email);
}
function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString("pt-BR") : "—";
}
function formatDate(value?: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}
function formatMoney(value?: number | null) {
  return typeof value === "number"
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value / 100)
    : null;
}
function csvMoney(value?: number | null) {
  return typeof value === "number" ? (value / 100).toFixed(2).replace(".", ",") : "";
}
function genderLabel(value?: string | null) {
  return value === "male"
    ? "Masculino"
    : value === "female"
      ? "Feminino"
      : value === "other"
        ? "Outro"
        : "—";
}
function modalityLabel(value: string) {
  return value === "experience" ? "Experience" : "Gravel Race";
}
function countryLabel(value?: string | null) {
  return value === "BR" ? "Brasil" : value || "—";
}
function locationFields(item: Registration) {
  const parts = (item.location ?? "")
    .split("/")
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    city: item.city || parts[0] || "",
    state: parts.length > 1 ? parts[1] : "",
    country: parts.length > 2
      ? parts.slice(2).join(" / ")
      : countryLabel(item.country_code),
  };
}
function serviceFeeCents(item: Registration) {
  if (
    typeof item.payment_amount_cents !== "number" ||
    typeof item.registration_base_fee_cents !== "number"
  )
    return null;
  const subtotalCents = Math.max(
    0,
    item.registration_base_fee_cents -
      (item.senior_discount_cents ?? 0) +
      (item.premium_kit_fee_cents ?? 0),
  );
  return Math.max(0, item.payment_amount_cents - subtotalCents);
}
function formatDocument(value?: string | null) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 11)
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (digits.length === 14)
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  return value || "—";
}
function formatPostalCode(value?: string | null) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 8
    ? digits.replace(/(\d{5})(\d{3})/, "$1-$2")
    : value || "—";
}
function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
function paymentLabel(value: string) {
  return value === "paid"
    ? "Pago"
    : value === "pending"
      ? "Pendente"
      : value === "refunded"
        ? "Reembolsado"
        : value === "cancelled"
          ? "Cancelado"
          : value === "failed"
            ? "Falhou"
            : value === "chargeback"
              ? "Chargeback"
              : value === "risk_analysis"
                ? "Em análise"
                : "Cortesia";
}
function statusLabel(value: string) {
  return value === "confirmed"
    ? "Confirmado"
    : value === "pending"
      ? "Pendente"
      : value === "waitlist"
        ? "Lista de espera"
        : value === "cancelled"
          ? "Cancelado"
          : value;
}
function paymentOrigin(item: Registration) {
  if (item.payment_provider === "asaas")
    return { label: "Asaas", className: "asaas" };
  if (item.source === "windfit")
    return { label: "Windfit", className: "windfit" };
  if (item.source === "online") return { label: "Online", className: "online" };
  return { label: "Manual", className: "manual" };
}

export default function RegistrationsPage() {
  const { activeEventId } = useOrganizationEvent();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [items, setItems] = useState<Registration[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [eventId, setEventId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [registrationView, setRegistrationView] =
    useState<RegistrationView>("registration");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [postalCodeMessage, setPostalCodeMessage] = useState("");
  const [postalCodeLoading, setPostalCodeLoading] = useState(false);
  const lastPostalCode = useRef("");
  const postalCodeRequest = useRef(0);
  const [saving, setSaving] = useState(false);
  const [moduleReady, setModuleReady] = useState(true);
  const [windfitReady, setWindfitReady] = useState(true);
  const [detailsReady, setDetailsReady] = useState(true);
  const [paymentReady, setPaymentReady] = useState(true);
  const [billingReady, setBillingReady] = useState(true);
  const [numberingReady, setNumberingReady] = useState(true);
  const [identityReady, setIdentityReady] = useState(true);
  const [linkAudit, setLinkAudit] = useState<LinkAudit[]>([]);
  const [transferFromId, setTransferFromId] = useState("");
  const [drawer, setDrawer] = useState<"form" | "import" | "numbering" | null>(
    null,
  );
  const [sequenceRows, setSequenceRows] = useState<BibSequence[]>([]);
  const [copiedCode, setCopiedCode] = useState("");

  async function load(preferredEvent?: string) {
    const selected = preferredEvent ?? eventId;
    const response = await fetch(
      `/api/admin/registrations${selected ? `?eventId=${encodeURIComponent(selected)}` : ""}`,
      { cache: "no-store" },
    );
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.error ?? "Falha ao carregar inscritos.");
    setModuleReady(payload.module_ready !== false);
    setWindfitReady(payload.windfit_ready !== false);
    setDetailsReady(payload.details_ready !== false);
    setPaymentReady(payload.payment_ready !== false);
    setBillingReady(payload.billing_ready !== false);
    setEvents(payload.events ?? []);
    const nextEvent = selected || payload.events?.[0]?.id || "";
    if (!selected && nextEvent) setEventId(nextEvent);
    setItems(payload.registrations ?? []);
    setSummary(payload.summary ?? null);
    setNumberingReady(payload.numbering_ready !== false);
    setIdentityReady(payload.identity_ready !== false);
    setLinkAudit(payload.link_audit ?? []);
    setSequenceRows(payload.sequences ?? []);
    setForm((current) => ({
      ...current,
      event_id: current.event_id || nextEvent,
    }));
    if (payload.message) setMessage(payload.message);
  }
  useEffect(() => {
    if (activeEventId && activeEventId !== eventId) setEventId(activeEventId);
  }, [activeEventId]);
  useEffect(() => {
    if (eventId) load(eventId).catch((error) => setMessage(error.message));
  }, [eventId]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const term = search.trim().toLowerCase();
        const matches =
          !term ||
          [
            item.full_name,
            item.email,
            item.cpf_cnpj,
            item.bib_number,
            item.registration_code,
            item.external_registration_id,
            item.registration_lot_name,
            item.casual_shirt_size,
            item.jersey_size,
          ].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(term),
          );
        return (
          matches &&
          (statusFilter === "all" || item.status === statusFilter) &&
          (paymentFilter === "all" || item.payment_status === paymentFilter)
        );
      }),
    [items, search, statusFilter, paymentFilter],
  );
  const editingRegistration = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [items, editingId],
  );
  const linkedCandidates = useMemo(
    () =>
      items.filter(
        (item) =>
          item.id !== editingId &&
          item.athlete_id &&
          item.status !== "cancelled",
      ),
    [items, editingId],
  );
  const editingAudit = useMemo(
    () => linkAudit.filter((item) => item.registration_id === editingId),
    [linkAudit, editingId],
  );

  function startNew() {
    setEditingId("");
    setPostalCodeMessage("");
    lastPostalCode.current = "";
    setForm({ ...emptyForm, event_id: eventId });
    setDrawer("form");
  }
  function openNumbering() {
    const configured = new Map(sequenceRows.map((row) => [row.category, row]));
    const available = [
      ...new Set([
        ...categories,
        ...(items.map((item) => item.category).filter(Boolean) as string[]),
      ]),
    ];
    setSequenceRows(
      available.map(
        (category, index) =>
          configured.get(category) ?? {
            category,
            start_number: index * 100 + 1,
            padding: 3,
          },
      ),
    );
    setDrawer("numbering");
  }
  function closeDrawer() {
    setEditingId("");
    setTransferFromId("");
    setPostalCodeMessage("");
    setPostalCodeLoading(false);
    lastPostalCode.current = "";
    postalCodeRequest.current += 1;
    setForm({ ...emptyForm, event_id: eventId });
    setDrawer(null);
  }
  function edit(item: Registration) {
    setTransferFromId("");
    setEditingId(item.id);
    setPostalCodeMessage("");
    lastPostalCode.current = normalizeBrazilianPostalCode(
      item.postal_code ?? "",
    );
    setForm({
      event_id: item.event_id,
      registration_code: item.registration_code,
      bib_number: item.bib_number ?? "",
      full_name: item.full_name,
      email: item.email,
      birth_date: item.birth_date ?? "",
      gender: item.gender ?? "",
      category: item.category ?? "",
      modality: item.modality,
      country_code: item.country_code ?? "",
      city: item.city ?? "",
      status: item.status,
      payment_status: item.payment_status,
      external_registration_id: item.external_registration_id ?? "",
      phone: item.phone ?? "",
      location: item.location ?? "",
      registered_at: item.registered_at?.slice(0, 16) ?? "",
      cpf_cnpj: item.cpf_cnpj ?? "",
      postal_code: item.postal_code ?? "",
      address: item.address ?? "",
      address_number: item.address_number ?? "",
      address_complement: item.address_complement ?? "",
      province: item.province ?? "",
      casual_shirt_size: item.casual_shirt_size ?? "",
      jersey_size: item.jersey_size ?? "",
    });
    setDrawer("form");
  }
  async function fillAddressFromPostalCode(value: string) {
    const postalCode = normalizeBrazilianPostalCode(value);
    if (postalCode.length !== 8) {
      if (postalCode) setPostalCodeMessage("Informe os 8 números do CEP.");
      else setPostalCodeMessage("");
      return;
    }
    if (postalCode === lastPostalCode.current) return;
    lastPostalCode.current = postalCode;
    const requestId = ++postalCodeRequest.current;
    setPostalCodeLoading(true);
    setPostalCodeMessage("Buscando endereço...");
    try {
      const result = await lookupBrazilianPostalCode(postalCode);
      if (requestId !== postalCodeRequest.current) return;
      setForm((current) => ({
        ...current,
        postal_code: result.postalCode,
        address: result.street,
        province: result.neighborhood,
        city: result.city,
        country_code: "BR",
        location: `${result.city} / ${result.state} / ${result.country}`,
      }));
      setPostalCodeMessage(
        result.street
          ? "Endereço preenchido automaticamente."
          : "CEP localizado. Complete o endereço.",
      );
    } catch (lookupError) {
      if (requestId !== postalCodeRequest.current) return;
      lastPostalCode.current = "";
      setPostalCodeMessage(
        lookupError instanceof Error
          ? lookupError.message
          : "Não foi possível consultar o CEP.",
      );
    } finally {
      if (requestId === postalCodeRequest.current)
        setPostalCodeLoading(false);
    }
  }
  function updatePostalCode(value: string) {
    const formatted = formatBrazilianPostalCode(value);
    setForm((current) => ({ ...current, postal_code: formatted }));
    const postalCode = normalizeBrazilianPostalCode(formatted);
    if (postalCode !== lastPostalCode.current) {
      postalCodeRequest.current += 1;
      setPostalCodeLoading(false);
    }
    if (postalCode.length === 8) void fillAddressFromPostalCode(formatted);
    else
      setPostalCodeMessage(
        postalCode.length ? "Informe os 8 números do CEP." : "",
      );
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(
      editingId ? "Atualizando registro..." : "Criando exceção manual...",
    );
    try {
      const response = await fetch("/api/admin/registrations", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? { id: editingId, registration: form }
            : { registration: form },
        ),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error ?? "Falha ao salvar registro.");
      setMessage(
        editingId
          ? "Registro atualizado."
          : `Exceção manual criada. Código: ${payload.registration.registration_code}`,
      );
      closeDrawer();
      await load(eventId);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Falha ao salvar registro.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !eventId) return;
    setSaving(true);
    setMessage("Sincronizando lista exportada da Windfit...");
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length)
        throw new Error("Nenhum atleta válido foi encontrado no arquivo.");
      const response = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_windfit", eventId, rows }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error ?? "Falha na sincronização.");
      setMessage(
        `${payload.imported} registros Windfit importados ou atualizados.`,
      );
      setDrawer(null);
      await load(eventId);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Falha na sincronização.",
      );
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  }
  async function saveSequences(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("Salvando sequências por categoria...");
    try {
      const response = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "configure_bib_sequences",
          eventId,
          sequences: sequenceRows,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error ?? "Falha ao configurar a numeração.");
      setMessage(
        `${payload.configured} categorias configuradas. ${payload.assigned} atletas que estavam sem número foram numerados.`,
      );
      setDrawer(null);
      await load(eventId);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Falha ao configurar a numeração.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function unlinkRegistration() {
    if (
      !editingRegistration?.athlete_id ||
      !window.confirm(
        `Desvincular ${editingRegistration.full_name} da conta Ride with GPS?`,
      )
    )
      return;
    setSaving(true);
    setMessage("Removendo vínculo incorreto...");
    try {
      const response = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unlink_registration",
          id: editingRegistration.id,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error ?? "Falha ao remover o vínculo.");
      setMessage(
        `${editingRegistration.full_name} foi desvinculado da conta Ride with GPS.`,
      );
      closeDrawer();
      await load(eventId);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Falha ao remover o vínculo.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function transferRegistrationIdentity() {
    if (
      !editingRegistration ||
      editingRegistration.athlete_id ||
      !transferFromId
    )
      return;
    const source = items.find((item) => item.id === transferFromId);
    if (
      !source ||
      !window.confirm(
        `Transferir a conta Ride with GPS vinculada a ${source.full_name} para ${editingRegistration.full_name}?\n\nEssa ação ficará registrada no histórico.`,
      )
    )
      return;
    setSaving(true);
    setMessage("Transferindo identidade Ride with GPS...");
    try {
      const response = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transfer_registration_identity",
          fromId: source.id,
          toId: editingRegistration.id,
          reason: `Correção administrativa: ${source.full_name} → ${editingRegistration.full_name}`,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error ?? "Falha ao transferir o vínculo.");
      setMessage(
        `A conta Ride with GPS foi transferida para ${editingRegistration.full_name}.`,
      );
      closeDrawer();
      await load(eventId);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Falha ao transferir o vínculo.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(
        () => setCopiedCode((current) => (current === code ? "" : current)),
        1800,
      );
    } catch {
      setMessage(`Não foi possível copiar automaticamente. Código: ${code}`);
    }
  }

  function exportRegistrations() {
    if (!filtered.length) {
      setMessage("Não há inscrições na seleção atual para exportar.");
      return;
    }
    const headers = [
      "Código da inscrição",
      "Número do atleta",
      "Nome completo",
      "E-mail",
      "Telefone",
      "CPF/CNPJ",
      "Data de nascimento",
      "Gênero",
      "Categoria",
      "Modalidade",
      "Camiseta casual",
      "Kit Premium",
      "Jersey de ciclismo",
      "CEP",
      "Endereço",
      "Número",
      "Complemento",
      "Bairro",
      "Cidade",
      "Estado",
      "País",
      "Lote",
      "Valor-base da inscrição (R$)",
      "Benefício 60+ aplicado",
      "Desconto 60+ (R$)",
      "Valor Kit Premium (R$)",
      "Taxa de serviço 7,5% (R$)",
      "Valor total cobrado (R$)",
      "Status do pagamento",
      "Provedor do pagamento",
      "Status do checkout",
      "ID do checkout",
      "Link do checkout",
      "Pagamento confirmado em",
      "Pagamento reembolsado em",
      "Status da inscrição",
      "Origem",
      "ID externo",
      "Data da inscrição",
      "Versão do regulamento",
      "Aceite do regulamento em",
      "Aceite de privacidade em",
      "Ride with GPS vinculado",
      "Ride with GPS ID",
      "Vinculado em",
    ];
    const rows = filtered.map((item) => {
      const location = locationFields(item);
      const origin = paymentOrigin(item);
      return [
        item.registration_code,
        item.bib_number,
        item.full_name,
        item.email,
        item.phone,
        formatDocument(item.cpf_cnpj) === "—"
          ? ""
          : formatDocument(item.cpf_cnpj),
        formatDate(item.birth_date) === "—" ? "" : formatDate(item.birth_date),
        genderLabel(item.gender) === "—" ? "" : genderLabel(item.gender),
        item.category,
        modalityLabel(item.modality),
        item.casual_shirt_size,
        item.premium_kit_selected ? "Sim" : "Não",
        item.jersey_size,
        formatPostalCode(item.postal_code) === "—"
          ? ""
          : formatPostalCode(item.postal_code),
        item.address,
        item.address_number,
        item.address_complement,
        item.province,
        location.city,
        location.state,
        location.country === "—" ? "" : location.country,
        item.registration_lot_name,
        csvMoney(item.registration_base_fee_cents),
        item.senior_discount_applied ? "Sim" : "Não",
        csvMoney(item.senior_discount_cents),
        csvMoney(item.premium_kit_fee_cents),
        csvMoney(serviceFeeCents(item)),
        csvMoney(item.payment_amount_cents),
        paymentLabel(item.payment_status),
        origin.label,
        item.payment_checkout_status,
        item.payment_checkout_id,
        item.payment_checkout_url,
        item.payment_confirmed_at
          ? formatDateTime(item.payment_confirmed_at)
          : "",
        item.payment_refunded_at
          ? formatDateTime(item.payment_refunded_at)
          : "",
        statusLabel(item.status),
        item.source,
        item.external_registration_id,
        formatDateTime(item.registered_at ?? item.created_at),
        item.regulation_version,
        item.terms_accepted_at
          ? formatDateTime(item.terms_accepted_at)
          : "",
        item.privacy_accepted_at
          ? formatDateTime(item.privacy_accepted_at)
          : "",
        item.athlete_id ? "Sim" : "Não",
        item.athlete?.ride_with_gps_user_id,
        item.claimed_at ? formatDateTime(item.claimed_at) : "",
      ];
    });
    const csv = [
      headers.map(csvCell).join(";"),
      ...rows.map((row) => row.map(csvCell).join(";")),
    ].join("\r\n");
    const selectedEvent = events.find((event) => event.id === eventId);
    const eventName = (selectedEvent?.name ?? "evento")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `inscritos-${eventName || "evento"}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage(
      `${filtered.length} inscrições exportadas com os dados separados em colunas.`,
    );
  }

  return (
    <main className="registrations-page">
      <style>{`
    .registrations-page{min-height:calc(100vh - 72px);overflow-x:hidden;background:#0d100d;color:#f2eee5;padding:42px 3vw 80px;font-family:Arial,sans-serif;box-sizing:border-box}.shell{width:min(1480px,100%);margin:auto;min-width:0}.kicker{color:#d47b2d;letter-spacing:.2em;text-transform:uppercase;font-size:12px;font-weight:900}.head{display:flex;align-items:end;justify-content:space-between;gap:25px}.head h1{font-size:clamp(42px,5vw,70px);line-height:.9;text-transform:uppercase;margin:13px 0}.head p{color:#aeb3ab;max-width:720px;line-height:1.7}.sync{margin-top:16px;color:#efb078;font-size:13px}.metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border:1px solid #3c4138;margin:28px 0}.metric{padding:17px;border-right:1px solid #3c4138;min-width:0}.metric:last-child{border:0}.metric strong{display:block;font-size:28px}.metric span{font-size:11px;color:#9fa49c;text-transform:uppercase}.workspace{display:grid;grid-template-columns:minmax(320px,420px) minmax(0,1fr);gap:20px;align-items:start}.panel{min-width:0;border:1px solid #373c35;background:#151815;padding:24px;box-sizing:border-box}.panel.light{background:#eee5d8;color:#171917;min-height:0}.panel h2{margin:0 0 12px;text-transform:uppercase}.panel-intro{color:#9fa49c;font-size:13px;line-height:1.55}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{display:grid;gap:6px;min-width:0}.field.wide{grid-column:1/-1}.field label{font-size:12px;font-weight:800}.field input,.field select{width:100%;min-width:0;box-sizing:border-box;padding:12px;background:#0d100d;color:#fff;border:1px solid #50564c}.field-hint{min-height:16px;color:#efb078;font-size:11px;font-weight:400}.primary{width:100%;margin-top:16px;padding:14px;border:0;background:#e86619;color:#fff;font-weight:900;cursor:pointer}.secondary{width:100%;margin-top:10px;padding:12px;border:1px solid #555b51;background:transparent;color:#ddd8cf;font-weight:800;cursor:pointer}.import{margin-top:20px;padding-top:18px;border-top:1px solid #3c4138}.import input{width:100%;box-sizing:border-box;padding:12px;border:1px dashed #d47b2d;color:#ddd8cf}.filters{display:grid;grid-template-columns:minmax(220px,1.3fr) minmax(150px,.8fr) minmax(150px,.8fr);gap:10px;margin-bottom:15px}.filters input,.filters select{width:100%;min-width:0;box-sizing:border-box;padding:12px;border:1px solid #bcae9d;background:#fffaf2}.view-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 18px;padding-bottom:14px;border-bottom:1px solid #c6b9a9}.view-tab{border:1px solid #bcae9d;background:#f8f1e7;color:#3f413d;padding:10px 14px;font-size:11px;font-weight:900;letter-spacing:.06em;cursor:pointer}.view-tab.active{border-color:#b65c17;background:#b65c17;color:#fff}.table-wrap{max-width:100%;overflow:auto;border:1px solid #d3c8b9;background:#f8f1e7}.table{width:100%;border-collapse:collapse}.table.registration-table{min-width:1420px}.table.contact-table{min-width:2200px}.table.financial-table{min-width:2200px}.table th{position:sticky;top:0;z-index:2;text-align:left;white-space:nowrap;background:#eee5d8;color:#b65c17;font-size:10px;letter-spacing:.1em;padding:12px;border-bottom:1px solid #c6b9a9}.table td{padding:11px 12px;border-bottom:1px solid #d3c8b9;font-size:12px;vertical-align:middle;white-space:nowrap}.table td.name-cell{min-width:190px;white-space:normal;font-weight:800}.table td.address-cell{min-width:220px;white-space:normal}.table tr:hover td{background:#fffaf2}.table strong,.table span{display:block}.table span{color:#6a6e67}.table a{display:inline-block;color:#276e55;font-size:11px;font-weight:800}.empty-state{display:grid;place-items:center;min-height:260px;padding:34px;text-align:center;border:1px dashed #c4b7a6;background:#f8f1e7}.empty-state strong{display:block;font-size:24px;margin-bottom:10px}.empty-state p{max-width:520px;color:#686c66;line-height:1.6;margin:0}.edit{border:0;background:#171917;color:#fff;padding:9px 12px;cursor:pointer}.linked{color:#28734a!important;font-weight:800}.unlinked{color:#a45e24!important}.message{margin:16px 0;color:#efb078}.not-ready{padding:22px;border:1px solid #9c5a22;background:#261b10}.code{font-family:monospace;font-weight:800}.copy-code{display:grid;gap:2px;border:1px solid transparent;background:transparent;color:#171917;font:inherit;font-weight:900;text-align:left;padding:5px 7px;cursor:pointer}.copy-code:hover,.copy-code:focus-visible{border-color:#b65c17;outline:0}.copy-code small{color:#b65c17;font-family:Arial,sans-serif;font-size:9px;letter-spacing:.12em}.status{font-weight:800}.paid{color:#28734a;font-weight:800}.pending,.risk_analysis{color:#a45e24;font-weight:800}.refunded,.cancelled,.failed,.chargeback{color:#a23d35;font-weight:800}.source{font-size:11px;text-transform:uppercase;font-weight:900}.windfit{color:#255f87}.asaas{color:#168b66}.online{color:#5f4b8b}.manual{color:#7b5b2a}
    .actions-bar{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:18px 0}.actions-main{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}.action-button{border:1px solid #d47b2d;background:transparent;color:#f3eee5;padding:12px 16px;font-weight:900;cursor:pointer}.action-button.primary-action{background:#e86619;border-color:#e86619}.workspace{display:block}.panel.light{width:100%;box-sizing:border-box}.drawer-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.62);border:0;z-index:1190}.drawer-panel{position:fixed;right:0;top:0;width:min(600px,94vw);height:100vh;overflow:auto;z-index:1200;border:0;border-left:1px solid #4d5349;background:#151815;padding:28px;box-sizing:border-box;box-shadow:-18px 0 50px rgba(0,0,0,.4)}.drawer-head{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:18px}.drawer-head h2{margin:0}.drawer-close{border:1px solid #555b51;background:transparent;color:#fff;width:38px;height:38px;font-size:22px;cursor:pointer}.drawer-panel .import{margin-top:0;padding-top:0;border-top:0}.drawer-panel .import input{margin-top:14px}.drawer-panel:not(.import-only) .import{display:none}.drawer-panel.import-only .manual-fields{display:none}.drawer-panel.numbering .manual-fields,.drawer-panel.numbering .import{display:none}.numbering-intro{color:#aeb3ab;line-height:1.6;font-size:13px}.sequence-list{display:grid;gap:10px;margin-top:20px}.sequence-row{display:grid;grid-template-columns:minmax(0,1fr) 115px 82px;gap:8px;align-items:end;padding:14px;border:1px solid #3c4138}.sequence-row label{display:grid;gap:6px;font-size:11px;color:#aaa}.sequence-row strong{font-size:13px;line-height:1.25}.sequence-row input{width:100%;box-sizing:border-box;padding:11px;background:#0d100d;color:#fff;border:1px solid #50564c}.sequence-current{color:#efb078;font-size:10px;margin-top:4px}.records-count{color:#aeb3ab;font-size:13px}.identity-box,.identity-history{margin-top:18px;padding-top:16px;border-top:1px solid #3c4138}.identity-box select{width:100%;box-sizing:border-box;padding:12px;background:#0d100d;color:#fff;border:1px solid #50564c}.identity-history h3,.identity-box h3{margin:0 0 8px;font-size:14px;text-transform:uppercase;color:#efb078}.audit-item{padding:9px 0;border-top:1px solid #30352f;font-size:12px}.audit-item span{display:block;color:#9fa49c;margin-top:3px}
    @media(max-width:1180px){.metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){.registrations-page{padding:28px 14px 60px}.head{display:block}.metrics{grid-template-columns:1fr 1fr}.form-grid,.filters{grid-template-columns:1fr}.field.wide{grid-column:auto}.panel{padding:18px}.actions-bar{align-items:flex-start}.actions-main{width:100%;display:grid;grid-template-columns:1fr 1fr}.action-button{padding:11px 8px;font-size:11px}.drawer-panel{width:100vw;padding:22px 18px}.records-count{display:none}.view-tabs{display:grid;grid-template-columns:1fr}.view-tab{text-align:left}}
  `}</style>
      <div className="shell">
        <section className="head">
          <div>
            <p className="kicker">Inscrições → Legends Core</p>
            <h1>Inscritos</h1>
          </div>
          <div>
            <p>
              O Legends Engine reúne inscrições do Asaas, Windfit, convites e
              correções manuais. A elegibilidade esportiva só é liberada após
              pagamento confirmado ou cortesia autorizada.
            </p>
            <div className="sync">
              Última sincronização externa:{" "}
              <strong>{formatDateTime(summary?.last_sync)}</strong>
            </div>
          </div>
        </section>
        {!moduleReady ? (
          <div className="not-ready">
            Execute a migration 006_registrations_eligibility.sql no Supabase.
          </div>
        ) : null}
        {moduleReady && !windfitReady ? (
          <div className="not-ready">
            Execute a migration 007_windfit_source.sql para ativar pagamento e
            sincronização Windfit.
          </div>
        ) : null}
        {moduleReady && windfitReady && !detailsReady ? (
          <div className="not-ready">
            Execute a migration 010_windfit_registration_details.sql para
            importar telefone, localização e data da inscrição.
          </div>
        ) : null}
        {moduleReady && !paymentReady ? (
          <div className="not-ready">
            Execute a migration 022_asaas_checkout.sql para ativar checkout e
            confirmação automática do Asaas.
          </div>
        ) : null}
        {moduleReady && !billingReady ? (
          <div className="not-ready">
            Execute a migration 023_registration_billing_data.sql para armazenar
            CPF e endereço dos inscritos.
          </div>
        ) : null}
        {moduleReady && !numberingReady ? (
          <div className="not-ready">
            Execute a migration 014_category_bib_sequences.sql para ativar a
            numeração automática por categoria.
          </div>
        ) : null}
        {moduleReady && !identityReady ? (
          <div className="not-ready">
            Execute a migration 016_athlete_identity_integrity.sql para ativar a
            proteção de identidade Ride with GPS.
          </div>
        ) : null}
        <section className="metrics">
          {[
            [summary?.total, "registros"],
            [summary?.eligible, "elegíveis"],
            [summary?.paid, "pagos"],
            [summary?.linked, "Ride with GPS vinculado"],
            [summary?.payment_pending, "pagamento pendente"],
            [summary?.refunded, "reembolsados"],
          ].map(([value, label]) => (
            <div className="metric" key={String(label)}>
              <strong>{value ?? "—"}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>
        {message ? <p className="message">{message}</p> : null}
        <section className="actions-bar">
          <span className="records-count">
            {filtered.length} de {items.length} inscrições exibidas
          </span>
          <div className="actions-main">
            <button className="action-button" onClick={exportRegistrations}>
              EXPORTAR PLANILHA
            </button>
            <button className="action-button" onClick={openNumbering}>
              NUMERAÇÃO POR CATEGORIA
            </button>
            <button
              className="action-button"
              onClick={() => setDrawer("import")}
            >
              IMPORTAR WINDFIT
            </button>
            <button className="action-button primary-action" onClick={startNew}>
              NOVA INSCRIÇÃO
            </button>
          </div>
        </section>
        <section className="workspace">
          {drawer ? (
            <>
              <button
                type="button"
                className="drawer-backdrop"
                aria-label="Fechar painel"
                onClick={closeDrawer}
              />
              <form
                noValidate={drawer === "numbering"}
                className={`panel drawer-panel ${drawer === "import" ? "import-only" : drawer === "numbering" ? "numbering" : ""}`}
                onSubmit={drawer === "numbering" ? saveSequences : save}
              >
                <div className="drawer-head">
                  <h2>
                    {drawer === "import"
                      ? "Importar Windfit"
                      : drawer === "numbering"
                        ? "Numeração por categoria"
                        : editingId
                          ? "Editar registro"
                          : "Nova inscrição"}
                  </h2>
                  <button
                    type="button"
                    className="drawer-close"
                    aria-label="Fechar"
                    onClick={closeDrawer}
                  >
                    ×
                  </button>
                </div>
                <div className="manual-fields">
                  <p className="panel-intro">
                    Use o cadastro manual somente para cortesia, convidado ou
                    correção administrativa. As inscrições comerciais entram
                    pelo checkout Asaas ou pela importação Windfit, conforme a
                    configuração do evento.
                  </p>
                  <div className="form-grid">
                    <div className="field wide">
                      <label>Evento</label>
                      <select
                        value={form.event_id}
                        onChange={(e) =>
                          setForm({ ...form, event_id: e.target.value })
                        }
                      >
                        {events.map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field wide">
                      <label>Nome completo</label>
                      <input
                        required
                        value={form.full_name}
                        onChange={(e) =>
                          setForm({ ...form, full_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="field wide">
                      <label>E-mail da inscrição</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Telefone</label>
                      <input
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Data da inscrição</label>
                      <input
                        type="datetime-local"
                        value={form.registered_at}
                        onChange={(e) =>
                          setForm({ ...form, registered_at: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>CPF/CNPJ</label>
                      <input
                        inputMode="numeric"
                        value={form.cpf_cnpj}
                        onChange={(e) =>
                          setForm({ ...form, cpf_cnpj: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>CEP</label>
                      <input
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="00000-000"
                        maxLength={9}
                        value={form.postal_code}
                        onChange={(e) => updatePostalCode(e.target.value)}
                        onBlur={(e) =>
                          void fillAddressFromPostalCode(e.target.value)
                        }
                      />
                      <span className="field-hint" aria-live="polite">
                        {postalCodeLoading
                          ? "Buscando endereço..."
                          : postalCodeMessage}
                      </span>
                    </div>
                    <div className="field wide">
                      <label>Endereço</label>
                      <input
                        value={form.address}
                        onChange={(e) =>
                          setForm({ ...form, address: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Número</label>
                      <input
                        value={form.address_number}
                        onChange={(e) =>
                          setForm({ ...form, address_number: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Complemento</label>
                      <input
                        value={form.address_complement}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            address_complement: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="field wide">
                      <label>Bairro</label>
                      <input
                        value={form.province}
                        onChange={(e) =>
                          setForm({ ...form, province: e.target.value })
                        }
                      />
                    </div>
                    <div className="field wide">
                      <label>Cidade / Estado / País</label>
                      <input
                        value={form.location}
                        onChange={(e) =>
                          setForm({ ...form, location: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Número do atleta</label>
                      <input
                        value={form.bib_number}
                        onChange={(e) =>
                          setForm({ ...form, bib_number: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>ID Windfit</label>
                      <input
                        value={form.external_registration_id}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            external_registration_id: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Código de vínculo</label>
                      <input
                        placeholder="Gerado automaticamente"
                        value={form.registration_code}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            registration_code: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Nascimento</label>
                      <input
                        type="date"
                        value={form.birth_date}
                        onChange={(e) =>
                          setForm({ ...form, birth_date: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Gênero</label>
                      <select
                        value={form.gender}
                        onChange={(e) =>
                          setForm({ ...form, gender: e.target.value })
                        }
                      >
                        <option value="">Não informado</option>
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                    <div className="field wide">
                      <label>Categoria</label>
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                      >
                        <option value="">Selecione</option>
                        {categories.map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Modalidade</label>
                      <select
                        value={form.modality}
                        onChange={(e) =>
                          setForm({ ...form, modality: e.target.value })
                        }
                      >
                        <option value="gravel_race">Legends Gravel Race</option>
                        <option value="experience">Legends Experience</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Tamanho da camiseta casual</label>
                      <select
                        value={form.casual_shirt_size}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            casual_shirt_size: e.target.value,
                          })
                        }
                      >
                        <option value="">Não informado</option>
                        {["PP", "P", "M", "G", "GG"].map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Tamanho da jersey de ciclismo</label>
                      <select
                        value={form.jersey_size}
                        disabled={!editingRegistration?.premium_kit_selected}
                        onChange={(e) =>
                          setForm({ ...form, jersey_size: e.target.value })
                        }
                      >
                        <option value="">
                          {editingRegistration?.premium_kit_selected
                            ? "Selecione"
                            : "Sem Kit Premium"}
                        </option>
                        {["PP", "P", "M", "G", "GG"].map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Pagamento</label>
                      <select
                        value={form.payment_status}
                        onChange={(e) =>
                          setForm({ ...form, payment_status: e.target.value })
                        }
                      >
                        <option value="courtesy">Cortesia</option>
                        <option value="paid">Pago</option>
                        <option value="pending">Pendente</option>
                        <option value="refunded">Reembolsado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Status esportivo</label>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value })
                        }
                      >
                        <option value="confirmed">Confirmada</option>
                        <option value="pending">Pendente</option>
                        <option value="waitlist">Lista de espera</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>País</label>
                      <input
                        maxLength={2}
                        value={form.country_code}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            country_code: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Cidade</label>
                      <input
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <button className="primary" disabled={saving}>
                    {saving
                      ? "SALVANDO..."
                      : editingId
                        ? "ATUALIZAR REGISTRO"
                        : "CRIAR EXCEÇÃO MANUAL"}
                  </button>
                  {editingRegistration?.athlete_id ? (
                    <button
                      className="secondary"
                      type="button"
                      disabled={saving}
                      onClick={unlinkRegistration}
                    >
                      DESVINCULAR RIDE WITH GPS
                    </button>
                  ) : null}
                  {editingRegistration &&
                  !editingRegistration.athlete_id &&
                  linkedCandidates.length ? (
                    <div className="identity-box">
                      <h3>Corrigir vínculo</h3>
                      <p className="panel-intro">
                        Transfira para esta inscrição uma conta que foi
                        vinculada ao participante errado neste mesmo evento.
                      </p>
                      <select
                        value={transferFromId}
                        onChange={(event) =>
                          setTransferFromId(event.target.value)
                        }
                      >
                        <option value="">
                          Selecione a inscrição de origem
                        </option>
                        {linkedCandidates.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.full_name} · Ride{" "}
                            {item.athlete?.ride_with_gps_user_id ?? ""}
                          </option>
                        ))}
                      </select>
                      <button
                        className="secondary"
                        type="button"
                        disabled={saving || !transferFromId}
                        onClick={transferRegistrationIdentity}
                      >
                        TRANSFERIR CONTA PARA ESTA INSCRIÇÃO
                      </button>
                    </div>
                  ) : null}
                  {editingId && identityReady ? (
                    <div className="identity-history">
                      <h3>Histórico do vínculo</h3>
                      {editingAudit.length ? (
                        editingAudit.map((audit) => (
                          <div className="audit-item" key={audit.id}>
                            <strong>
                              {audit.action === "linked"
                                ? "Conta vinculada"
                                : audit.action === "unlinked"
                                  ? "Conta desvinculada"
                                  : audit.action === "transferred_in"
                                    ? "Conta recebida por transferência"
                                    : audit.action === "transferred_out"
                                      ? "Conta transferida"
                                      : "Duplicidade antiga corrigida"}
                            </strong>
                            <span>
                              {formatDateTime(audit.created_at)} ·{" "}
                              {audit.actor_type}
                            </span>
                            {audit.reason ? <span>{audit.reason}</span> : null}
                          </div>
                        ))
                      ) : (
                        <p className="panel-intro">
                          Nenhuma alteração de vínculo registrada.
                        </p>
                      )}
                    </div>
                  ) : null}
                  {editingId ? (
                    <button
                      className="secondary"
                      type="button"
                      onClick={closeDrawer}
                    >
                      CANCELAR EDIÇÃO
                    </button>
                  ) : null}
                </div>
                <div className="import">
                  <strong>Importar lista da Windfit</strong>
                  <p className="panel-intro">
                    Exporte o CSV na Windfit e envie aqui. A sincronização
                    atualiza o mesmo atleta pelo e-mail e preserva o código de
                    vínculo existente.
                  </p>
                  <p className="panel-intro">
                    Campos reconhecidos: ID, nome, categoria, nascimento,
                    gênero, e-mail, telefone, localização, data e status da
                    inscrição.
                  </p>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={importCsv}
                  />
                </div>
                {drawer === "numbering" ? (
                  <div className="numbering-fields">
                    <p className="numbering-intro">
                      Defina o primeiro número de cada categoria. Novas
                      inscrições e importações receberão o próximo número livre
                      automaticamente. Números já atribuídos são preservados.
                    </p>
                    <div className="sequence-list">
                      {sequenceRows.map((row, index) => (
                        <div className="sequence-row" key={row.category}>
                          <div>
                            <strong>{row.category}</strong>
                            {row.next_number ? (
                              <div className="sequence-current">
                                Próximo disponível:{" "}
                                {String(row.next_number).padStart(
                                  row.padding,
                                  "0",
                                )}
                              </div>
                            ) : null}
                          </div>
                          <label>
                            Primeiro número
                            <input
                              type="number"
                              min="1"
                              required
                              value={row.start_number}
                              onChange={(event) =>
                                setSequenceRows((current) =>
                                  current.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          start_number: Number(
                                            event.target.value,
                                          ),
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </label>
                          <label>
                            Dígitos
                            <input
                              type="number"
                              min="1"
                              max="8"
                              required
                              value={row.padding}
                              onChange={(event) =>
                                setSequenceRows((current) =>
                                  current.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          padding: Number(event.target.value),
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                    <button className="primary" disabled={saving}>
                      {saving ? "SALVANDO..." : "SALVAR E NUMERAR INSCRITOS"}
                    </button>
                  </div>
                ) : null}
              </form>
            </>
          ) : null}
          <section className="panel light">
            <div className="filters">
              <input
                placeholder="Buscar nome, e-mail, CPF, número, código ou ID externo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos os status</option>
                <option value="confirmed">Confirmados</option>
                <option value="pending">Pendentes</option>
                <option value="waitlist">Lista de espera</option>
                <option value="cancelled">Cancelados</option>
              </select>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">Todos os pagamentos</option>
                <option value="paid">Pagos</option>
                <option value="pending">Pendentes</option>
                <option value="risk_analysis">Em análise</option>
                <option value="refunded">Reembolsados</option>
                <option value="cancelled">Cancelados</option>
                <option value="failed">Falharam</option>
                <option value="chargeback">Chargeback</option>
                <option value="courtesy">Cortesias</option>
              </select>
            </div>
            <div className="view-tabs" aria-label="Visões da lista de inscritos">
              <button
                type="button"
                className={`view-tab ${registrationView === "registration" ? "active" : ""}`}
                onClick={() => setRegistrationView("registration")}
              >
                INSCRIÇÃO E KIT
              </button>
              <button
                type="button"
                className={`view-tab ${registrationView === "contact" ? "active" : ""}`}
                onClick={() => setRegistrationView("contact")}
              >
                CADASTRO E ENDEREÇO
              </button>
              <button
                type="button"
                className={`view-tab ${registrationView === "financial" ? "active" : ""}`}
                onClick={() => setRegistrationView("financial")}
              >
                FINANCEIRO E INTEGRAÇÕES
              </button>
            </div>
            {filtered.length ? (
              <div className="table-wrap">
                {registrationView === "registration" ? (
                  <table className="table registration-table">
                    <thead>
                      <tr>
                        <th>Nº</th>
                        <th>Nome completo</th>
                        <th>Categoria</th>
                        <th>Modalidade</th>
                        <th>Camiseta casual</th>
                        <th>Kit Premium</th>
                        <th>Jersey ciclismo</th>
                        <th>Lote</th>
                        <th>Data da inscrição</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr key={item.id}>
                          <td>{item.bib_number ?? "—"}</td>
                          <td className="name-cell">{item.full_name}</td>
                          <td>{item.category ?? "—"}</td>
                          <td>{modalityLabel(item.modality)}</td>
                          <td>{item.casual_shirt_size ?? "—"}</td>
                          <td>{item.premium_kit_selected ? "Sim" : "Não"}</td>
                          <td>{item.jersey_size ?? "—"}</td>
                          <td>{item.registration_lot_name ?? "—"}</td>
                          <td>
                            {formatDateTime(
                              item.registered_at ?? item.created_at,
                            )}
                          </td>
                          <td>
                            <span className={`status ${item.status}`}>
                              {statusLabel(item.status)}
                            </span>
                          </td>
                          <td>
                            <button className="edit" onClick={() => edit(item)}>
                              EDITAR
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
                {registrationView === "contact" ? (
                  <table className="table contact-table">
                    <thead>
                      <tr>
                        <th>Nº</th>
                        <th>Nome completo</th>
                        <th>E-mail</th>
                        <th>Telefone</th>
                        <th>CPF/CNPJ</th>
                        <th>Nascimento</th>
                        <th>Gênero</th>
                        <th>CEP</th>
                        <th>Endereço</th>
                        <th>Número</th>
                        <th>Complemento</th>
                        <th>Bairro</th>
                        <th>Cidade</th>
                        <th>Estado</th>
                        <th>País</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => {
                        const location = locationFields(item);
                        return (
                          <tr key={item.id}>
                            <td>{item.bib_number ?? "—"}</td>
                            <td className="name-cell">{item.full_name}</td>
                            <td>{item.email}</td>
                            <td>{item.phone ?? "—"}</td>
                            <td>{formatDocument(item.cpf_cnpj)}</td>
                            <td>{formatDate(item.birth_date)}</td>
                            <td>{genderLabel(item.gender)}</td>
                            <td>{formatPostalCode(item.postal_code)}</td>
                            <td className="address-cell">
                              {item.address ?? "—"}
                            </td>
                            <td>{item.address_number ?? "—"}</td>
                            <td>{item.address_complement ?? "—"}</td>
                            <td>{item.province ?? "—"}</td>
                            <td>{location.city || "—"}</td>
                            <td>{location.state || "—"}</td>
                            <td>{location.country || "—"}</td>
                            <td>
                              <button
                                className="edit"
                                onClick={() => edit(item)}
                              >
                                EDITAR
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : null}
                {registrationView === "financial" ? (
                  <table className="table financial-table">
                    <thead>
                      <tr>
                        <th>Nº</th>
                        <th>Nome completo</th>
                        <th>Pagamento</th>
                        <th>Valor-base</th>
                        <th>Benefício 60+</th>
                        <th>Desconto 60+</th>
                        <th>Valor do kit</th>
                        <th>Taxa de serviço</th>
                        <th>Total cobrado</th>
                        <th>Origem</th>
                        <th>Status checkout</th>
                        <th>Confirmado em</th>
                        <th>ID externo</th>
                        <th>Código</th>
                        <th>Ride with GPS</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => {
                        const origin = paymentOrigin(item);
                        return (
                          <tr key={item.id}>
                            <td>{item.bib_number ?? "—"}</td>
                            <td className="name-cell">{item.full_name}</td>
                            <td>
                              <span className={item.payment_status}>
                                {paymentLabel(item.payment_status)}
                              </span>
                            </td>
                            <td>
                              {formatMoney(
                                item.registration_base_fee_cents,
                              ) ?? "—"}
                            </td>
                            <td>
                              {item.senior_discount_applied ? "Sim" : "Não"}
                            </td>
                            <td>
                              {formatMoney(item.senior_discount_cents) ?? "—"}
                            </td>
                            <td>
                              {formatMoney(item.premium_kit_fee_cents) ?? "—"}
                            </td>
                            <td>
                              {formatMoney(serviceFeeCents(item)) ?? "—"}
                            </td>
                            <td>
                              {formatMoney(item.payment_amount_cents) ?? "—"}
                            </td>
                            <td>
                              <span className={`source ${origin.className}`}>
                                {origin.label}
                              </span>
                            </td>
                            <td>
                              {item.payment_checkout_status ?? "—"}
                              {item.payment_checkout_url &&
                              item.payment_status === "pending" ? (
                                <a
                                  href={item.payment_checkout_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  ABRIR CHECKOUT ↗
                                </a>
                              ) : null}
                            </td>
                            <td>
                              {item.payment_confirmed_at
                                ? formatDateTime(item.payment_confirmed_at)
                                : "—"}
                            </td>
                            <td>{item.external_registration_id ?? "—"}</td>
                            <td className="code">
                              <button
                                type="button"
                                className="copy-code"
                                title="Copiar código de vínculo"
                                onClick={() =>
                                  copyCode(item.registration_code)
                                }
                              >
                                {item.registration_code}
                                <small>
                                  {copiedCode === item.registration_code
                                    ? "COPIADO ✓"
                                    : "COPIAR"}
                                </small>
                              </button>
                            </td>
                            <td>
                              <span
                                className={
                                  item.athlete_id ? "linked" : "unlinked"
                                }
                              >
                                {item.athlete_id
                                  ? `✓ ${item.athlete?.ride_with_gps_user_id ?? ""}`
                                  : "Aguardando vínculo"}
                              </span>
                            </td>
                            <td>
                              <span className={`status ${item.status}`}>
                                {statusLabel(item.status)}
                              </span>
                            </td>
                            <td>
                              <button
                                className="edit"
                                onClick={() => edit(item)}
                              >
                                EDITAR
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : null}
              </div>
            ) : (
              <div className="empty-state">
                <div>
                  <strong>Nenhum inscrito encontrado</strong>
                  <p>
                    As inscrições confirmadas pelo Asaas, os participantes
                    importados da Windfit e as exceções manuais aparecerão aqui
                    com pagamento, categoria, elegibilidade e vínculo com o Ride
                    with GPS.
                  </p>
                </div>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
