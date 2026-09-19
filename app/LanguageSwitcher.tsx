import { localeDetails, locales, type Locale } from "./i18n/config";
import { getHomeCopy } from "./i18n/home";

export default function LanguageSwitcher({ locale, mobile = false }: { locale: Locale; mobile?: boolean }) {
  return (
    <nav className={mobile ? "languageSwitcher languageSwitcherMobile" : "languageSwitcher"} aria-label={getHomeCopy(locale).navigation.languageSelector}>
      {locales.map((item) => (
        <a
          aria-current={item === locale ? "page" : undefined}
          className={item === locale ? "isActive" : undefined}
          href={localeDetails[item].href}
          hrefLang={localeDetails[item].htmlLang}
          key={item}
          lang={localeDetails[item].htmlLang}
          title={localeDetails[item].label}
        >
          {localeDetails[item].shortLabel}
        </a>
      ))}
    </nav>
  );
}
