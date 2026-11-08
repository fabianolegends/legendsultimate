import type { MetadataRoute } from "next";

const baseUrl = "https://www.legendsbikerace.com.br";
const contentUpdatedAt = "2026-11-08";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/es", priority: 1, changeFrequency: "weekly" as const },
    { path: "/en", priority: 1, changeFrequency: "weekly" as const },
    { path: "/a-prova", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/percursos", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/race-engine", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/regulamento", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/documentos-medicos", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/percursos/stage-1", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/percursos/stage-2", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/percursos/stage-3", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/percursos/stage-4", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.8, changeFrequency: "monthly" as const },
  ];

  return pages.map(({ path, priority, changeFrequency }) => {
    const isLocalizedHome = path === "" || path === "/es" || path === "/en";
    return {
      url: `${baseUrl}${path}`,
      lastModified: new Date(`${contentUpdatedAt}T00:00:00-03:00`),
      changeFrequency,
      priority,
      ...(isLocalizedHome ? {
        alternates: {
          languages: {
            "pt-BR": `${baseUrl}/`,
            es: `${baseUrl}/es`,
            en: `${baseUrl}/en`,
            "x-default": `${baseUrl}/`,
          },
        },
      } : {}),
    };
  });
}
