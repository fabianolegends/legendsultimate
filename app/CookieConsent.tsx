"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./CookieConsent.module.css";
import { localeFromPathname } from "./i18n/config";
import { getHomeCopy } from "./i18n/home";

type Consent = "accepted" | "rejected" | null;

const STORAGE_KEY = "legends_cookie_consent";

export default function CookieConsent() {
  const pathname = usePathname();
  const copy = getHomeCopy(localeFromPathname(pathname)).cookies;
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Consent;
    setConsent(saved === "accepted" || saved === "rejected" ? saved : null);
    setIsOpen(saved !== "accepted" && saved !== "rejected");
    setReady(true);
  }, []);

  useEffect(() => {
    function openPreferences() {
      setIsOpen(true);
    }
    window.addEventListener("legends:open-privacy", openPreferences);
    return () => window.removeEventListener("legends:open-privacy", openPreferences);
  }, []);

  function saveConsent(value: Exclude<Consent, null>) {
    window.localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
    setIsOpen(false);
  }

  if (!ready) return null;

  return (
    <>
      {consent === "accepted" && (
        <>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-HD7JY3MSNR"
            strategy="afterInteractive"
          />
          <Script id="google-analytics-consented" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', 'G-HD7JY3MSNR', { anonymize_ip: true });
            `}
          </Script>
          <Script id="meta-pixel-consented" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '856173094039395');
              fbq('track', 'PageView');
            `}
          </Script>
        </>
      )}

      {isOpen ? (
        <section className={styles.banner} aria-label={copy.aria}>
          <div className={styles.copy}>
            <strong>{copy.title}</strong>
            <p>
              {copy.text} <Link href="/politica-de-privacidade">{copy.privacy}</Link>.
            </p>
          </div>
          <div className={styles.actions}>
            <button className={styles.secondary} type="button" onClick={() => saveConsent("rejected")}>
              {copy.essentials}
            </button>
            <button className={styles.primary} type="button" onClick={() => saveConsent("accepted")}>
              {copy.accept}
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}
