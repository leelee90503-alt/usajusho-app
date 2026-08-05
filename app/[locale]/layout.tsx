import type { Metadata } from "next";
import { Geist_Mono, M_PLUS_1, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/header";
import Footer from "@/components/footer";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-latin",
  subsets: ["latin"],
});

const mPlus1 = M_PLUS_1({
  variable: "--font-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "USAJUSHO",
  description: "米国から日本への転送サービス",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "ja" | "en")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${plusJakartaSans.variable} ${mPlus1.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#1F2328]">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
