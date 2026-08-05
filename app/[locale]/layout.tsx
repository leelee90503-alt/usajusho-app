import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import LanguageSwitcher from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";
import Footer from "@/components/footer";
import "./globals.css";

const geistSans = Geist({
variable: "--font-geist-sans",
subsets: ["latin"],
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
const t = await getTranslations("nav");

return (
<html
lang={locale}
className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
>
<body className="min-h-full flex flex-col bg-white text-[#1F2328]">
<NextIntlClientProvider messages={messages}>
<header className="border-b border-slate-200">
<div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
<span className="font-bold text-[#1B2A4A]">USAJUSHO</span>
<nav className="flex items-center gap-4">
<Link
href="/purchase-agency"
className="text-sm font-medium text-slate-600 hover:text-[var(--usj-primary)]"
>
{t("purchaseAgency")}
</Link>
<LanguageSwitcher />
</nav>
</div>
</header>
<div className="flex-1 flex flex-col">{children}</div>
<Footer />
</NextIntlClientProvider>
</body>
</html>
);
}
