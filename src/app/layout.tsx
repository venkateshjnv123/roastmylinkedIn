import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Roast My LinkedIn — Get Roasted by AI",
    template: "%s | Roast My LinkedIn",
  },
  description:
    "Upload your LinkedIn profile screenshot and get brutally roasted by AI. Find out if you're a Thought Leader Cosplay, Buzzword Salad, or Genuine Professional. Share the carnage.",
  keywords: [
    "linkedin roast",
    "ai roast linkedin",
    "linkedin profile roast",
    "roast my linkedin",
    "linkedin cringe",
    "linkedin humor",
    "linkedin ai tool",
  ],
  authors: [{ name: "Venky", url: "https://venkyverse.space" }],
  openGraph: {
    title: "Roast My LinkedIn — Get Roasted by AI",
    description:
      "Upload your LinkedIn profile screenshot and get brutally roasted by AI. Share the carnage.",
    siteName: "Roast My LinkedIn",
    url: baseUrl,
    type: "website",
    locale: "en_US",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Roast My LinkedIn" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roast My LinkedIn — Get Roasted by AI",
    description:
      "Upload your LinkedIn profile screenshot and get brutally roasted by AI. Share the carnage.",
    creator: "@venkyverse",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: baseUrl,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Roast My LinkedIn",
  description:
    "AI-powered LinkedIn profile roasting tool. Upload your screenshot, get roasted, share the carnage.",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Web",
  url: "https://venkyverse.space",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased flex flex-col">
        {children}
        <footer className="mt-auto py-5 text-center text-xs text-stone-400 border-t border-stone-100">
          Screenshots processed by AI and not stored permanently ·{" "}
          <a href="/leaderboard" className="underline hover:text-stone-600 transition-colors">
            Leaderboard
          </a>{" "}
          · Built by{" "}
          <a
            href="https://venkyverse.space"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-stone-600 transition-colors"
          >
            Venky
          </a>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
