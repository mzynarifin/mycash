import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register"],
        disallow: ["/admin/", "/dashboard", "/expenses", "/categories", "/bills", "/payments", "/settings"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}