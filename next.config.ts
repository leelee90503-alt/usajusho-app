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
};

export default withNextIntl(nextConfig);
