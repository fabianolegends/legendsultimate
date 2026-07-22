"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import styles from "./CookieConsent.module.css";

type Consent = "accepted" | "rejected" | null;

const STORAGE_KEY = "legends_cookie_consent";

export default function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Consent;
    setConsent(saved === "accepted" || saved === "rejected" ? saved : null);
    setIsOpen(saved !== "accepted" && saved !== "rejected");
    setReady(true);
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
        <section className={styles.banner} aria-label="Preferências de privacidade">
          <div className={styles.copy}>
            <strong>Sua privacidade importa.</strong>
            <p>
              Usamos cookies de análise e marketing para entender a navegação e melhorar a
              experiência. Você pode aceitar ou continuar apenas com os cookies essenciais. Leia
              nossa <Link href="/politica-de-privacidade">Política de Privacidade</Link>.
            </p>
          </div>
          <div className={styles.actions}>
            <button className={styles.secondary} type="button" onClick={() => saveConsent("rejected")}>
              Apenas essenciais
            </button>
            <button className={styles.primary} type="button" onClick={() => saveConsent("accepted")}>
              Aceitar cookies
            </button>
          </div>
        </section>
      ) : (
        <button className={styles.settings} type="button" onClick={() => setIsOpen(true)}>
          Privacidade
        </button>
      )}
    </>
  );
}
