import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { GoogleAnalytics } from "@next/third-parties/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CineVilla — Discover Movies & TV Shows",
  description:
    "CineVilla is your premium destination for discovering the world's finest films and television series.",
  keywords: ["movies", "tv shows", "streaming", "cinema", "discover"],
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5410643778743575"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>

      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white antialiased">
        <Navbar />

        <div className="flex-1">{children}</div>

        <Footer />

        <GoogleAnalytics gaId="G-96HHKW0PST" />
      </body>
    </html>
  );
}
