import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/header";
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

return (
<html
lang={locale}
className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
