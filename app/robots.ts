import type { MetadataRoute } from "next";

const BASE_URL = "https://www.usajusho.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/ja/admin",
          "/ja/admin/*",
          "/en/admin",
          "/en/admin/*",
          "/ja/dashboard",
          "/ja/dashboard/*",
          "/en/dashboard",
          "/en/dashboard/*",
          "/api",
          "/api/*",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
