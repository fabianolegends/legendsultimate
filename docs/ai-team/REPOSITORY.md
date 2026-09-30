# Mapa do projeto

Base examinada: `legendsbikerace` em `af038ea`. O checkout de desenvolvimento anterior estava em outra branch; este piloto parte da branch padrão para evitar misturar alterações pendentes.

| Área | Arquivos | Uso no piloto |
|---|---|---|
| Home | `app/page.tsx` | Oferta, visual, CTAs e jornada |
| Idiomas | `app/i18n/home.ts`, `app/i18n/config.ts`, `app/es/`, `app/en/` | Equivalência da home e destinos dos links |
| Comércio | `app/lib/launch.ts`, `app/inscricoes/` | Formatos, lotes, kit, limite e Windfit |
| Navegação | `app/MobileMenu.tsx`, `app/LanguageSwitcher.tsx` | Mobile e idioma |
| Identidade | `app/globals.css`, `app/layout.tsx`, `public/` | Fontes, paleta e assets |
| Regras | `app/regulamento/`, `app/manual-do-atleta/`, `app/percursos/` | Promessas e coerência operacional |
| Operação | `app/api/`, `lib/`, `supabase/migrations/` | Fora do escopo de uma auditoria comercial da home |

Stack do snapshot: Next.js 16.2.6, React 19.2.6, TypeScript 5.9.3, Tailwind 4.2.1; Supabase e Ride with GPS. Reconfirmar em `package.json` antes de implementar.

Verificações disponíveis: `npm run build`, `npm run test:registrations`, `npm run test:classification-engine`, `npm run test:race-engine`. Rodar somente as relevantes ao diff. O script `lint` usa `next lint`; verificar compatibilidade antes de usá-lo como critério de aceite. Não alterar dependências neste piloto.
