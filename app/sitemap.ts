import type { MetadataRoute } from "next";

const baseUrl = "https://www.legendsbikerace.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "", lastModified: "2026-07-29", priority: 1, changeFrequency: "weekly" as const },
    { path: "/a-prova", lastModified: "2026-07-29", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/percursos", lastModified: "2026-07-29", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/race-engine", lastModified: "2026-07-29", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/percursos/stage-1", lastModified: "2026-07-29", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/percursos/stage-2", lastModified: "2026-07-29", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/percursos/stage-3", lastModified: "2026-07-29", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/percursos/stage-4", lastModified: "2026-07-29", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/faq", lastModified: "2026-07-29", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/lista-prioritaria", lastModified: "2026-07-29", priority: 0.7, changeFrequency: "monthly" as const },
  ];

  return pages.map(({ path, lastModified, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(`${lastModified}T00:00:00-03:00`),
    changeFrequency,
    priority,
  }));
}
