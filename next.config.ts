import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, which is far too small for admin photo uploads
      // (a single phone photo is often 2-5MB). Vercel's own Serverless
      // Function request body limit is ~4.5MB, so we raise this close to
      // that ceiling without exceeding it.
      bodySizeLimit: "4mb",
    },
  },
  async redirects() {
    // /how-it-works was renamed to /forwarding and expanded into a full
    // forwarding-service hub page. Redirect both locale-prefixed forms
    // (localePrefix is "always", so every URL is /ja/... or /en/...) to
    // preserve any inbound links / SEO equity.
    return [
      {
        source: "/how-it-works",
        destination: "/forwarding",
        permanent: true,
      },
      {
        source: "/:locale(ja|en)/how-it-works",
        destination: "/:locale/forwarding",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
