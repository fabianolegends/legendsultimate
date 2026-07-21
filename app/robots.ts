import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/acesso",
        "/passport/",
        "/organizacao/",
      ],
    },
    sitemap: "https://www.legendsbikerace.com.br/sitemap.xml",
    host: "https://www.legendsbikerace.com.br",
  };
}
