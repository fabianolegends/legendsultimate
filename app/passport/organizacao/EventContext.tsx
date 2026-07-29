"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type OrganizationEvent = {
  id: string;
  slug: string;
  name: string;
  status: "draft" | "published" | "archived";
  starts_on: string;
  ends_on: string;
  timezone: string;
  description?: string | null;
  location?: string | null;
  event_type?: string;
  scoring_mode?: string;
  registration_source?: string;
  access_mode?: string;
  participant_limit?: number | null;
  is_test?: boolean;
  registration_open?: boolean;
  registration_closes_at?: string | null;
  windfit_registration_url?: string | null;
  terms_url?: string | null;
  registration_fee_cents?: number | null;
  experience_fee_cents?: number | null;
  asaas_checkout_expires_minutes?: number;
  asaas_max_installments?: number;
  premium_kit_enabled?: boolean;
  premium_kit_fee_cents?: number | null;
  casual_shirt_required?: boolean;
  senior_discount_enabled?: boolean;
  senior_discount_percent?: number;
  regulation_version?: string | null;
  registration_lots?: OrganizationRegistrationLot[];
  stage_count?: number;
  registration_count?: number;
  stages?: OrganizationStage[];
};

export type OrganizationRegistrationLot = {
  id?: string;
  event_id?: string;
  name: string;
  starts_at: string;
  ends_at: string;
  registration_fee_cents: number;
  display_order: number;
};

export type OrganizationStage = {
  id: string;
  event_id: string;
  stage_number: number;
  name: string;
  route_label: string | null;
  stage_date: string;
  classification_weight: number;
  time_limit_s: number | null;
  results_published: boolean;
};

type EventContextValue = {
  events: OrganizationEvent[];
  activeEventId: string;
  activeEvent: OrganizationEvent | null;
  loading: boolean;
  moduleReady: boolean;
  setActiveEventId: (id: string) => void;
  reloadEvents: (preferredId?: string) => Promise<void>;
};

const EventContext = createContext<EventContextValue | null>(null);
const STORAGE_KEY = "legends-active-event-id";

export function OrganizationEventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<OrganizationEvent[]>([]);
  const [activeEventId, setActiveEventIdState] = useState("");
  const [loading, setLoading] = useState(true);
  const [moduleReady, setModuleReady] = useState(true);

  async function reloadEvents(preferredId?: string) {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/events", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar os eventos.");
      const nextEvents = (payload.events ?? []) as OrganizationEvent[];
      setEvents(nextEvents);
      setModuleReady(payload.module_ready !== false);
      setActiveEventIdState((current) => {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) ?? "" : "";
        const candidate = preferredId || current || stored;
        const selected = nextEvents.some((event) => event.id === candidate) ? candidate : nextEvents[0]?.id ?? "";
        if (selected && typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, selected);
        return selected;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reloadEvents().catch(() => setLoading(false)); }, []);

  function setActiveEventId(id: string) {
    setActiveEventIdState(id);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
  }

  const value = useMemo<EventContextValue>(() => ({
    events,
    activeEventId,
    activeEvent: events.find((event) => event.id === activeEventId) ?? null,
    loading,
    moduleReady,
    setActiveEventId,
    reloadEvents,
  }), [events, activeEventId, loading, moduleReady]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useOrganizationEvent() {
  const context = useContext(EventContext);
  if (!context) throw new Error("useOrganizationEvent deve ser usado dentro do painel da organização.");
  return context;
}
