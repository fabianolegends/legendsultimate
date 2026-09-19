"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { localeDetails, localeFromPathname } from "./i18n/config";

export default function DocumentLanguage() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = localeDetails[localeFromPathname(pathname)].htmlLang;
  }, [pathname]);

  return null;
}
