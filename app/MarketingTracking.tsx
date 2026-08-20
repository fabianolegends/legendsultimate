"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const CONSENT_KEY = "legends_cookie_consent";

function hasMarketingConsent() {
  return window.localStorage.getItem(CONSENT_KEY) === "accepted";
}

function selectedFormat(url: URL) {
  return url.searchParams.get("formato") === "short" ? "short" : "ultimate";
}

function track(name: string, parameters: Record<string, string> = {}) {
  if (!hasMarketingConsent()) return;

  window.gtag?.("event", name, parameters);
  window.fbq?.("trackCustom", name, parameters);
}

export default function MarketingTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    if (!hasMarketingConsent()) return;

    const pageLocation = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
    window.gtag?.("event", "page_view", {
      page_location: pageLocation,
      page_path: `${pathname}${query ? `?${query}` : ""}`,
      page_title: document.title,
    });

    if (pathname === "/inscricoes") {
      track("view_registration", {
        journey_format: selectedFormat(new URL(window.location.href)),
      });
    }
  }, [pathname, query]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.href);
      const label = anchor.textContent?.replace(/\s+/g, " ").trim().slice(0, 80) || "";

      if (url.pathname === "/inscricoes" && url.searchParams.has("formato")) {
        track("select_journey", {
          journey_format: selectedFormat(url),
          link_text: label,
        });
      }

      const isRegistrationCta =
        anchor.classList.contains("mainCta") ||
        /me inscrever|inscriç(?:ão|ões)/i.test(label);

      if (isRegistrationCta) {
        track("click_registration", {
          journey_format: selectedFormat(url),
          link_text: label,
          link_url: url.href,
        });
      }

      if (url.pathname === "/lista-prioritaria") {
        track("click_priority_list", { link_text: label });
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
