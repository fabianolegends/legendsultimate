import type { MetadataRoute } from "next";

const baseUrl = "https://www.legendsbikerace.com.br";
const lastContentUpdate = new Date("2026-07-21T00:00:00-03:00");

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/a-prova", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/race-engine", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/percursos/stage-1", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/percursos/stage-2", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/percursos/stage-3", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/percursos/stage-4", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/lista-prioritaria", priority: 0.7, changeFrequency: "monthly" as const },
  ];

  return pages.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: lastContentUpdate,
    changeFrequency,
    priority,
  }));
}
