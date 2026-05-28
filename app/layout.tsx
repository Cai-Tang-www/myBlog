import type { Metadata } from "next";
import { Space_Grotesk, Source_Serif_4 } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CanvasNest } from "@/components/canvas-nest";
import { BackToTop } from "@/components/back-to-top";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const sans = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
  keywords: [
    "技术博客",
    "后端工程",
    "Agent",
    "Go",
    "系统设计",
    "内容系统",
    "产品设计",
  ],
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    locale: siteConfig.locale,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: siteConfig.title }],
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  other: {
    "baidu-site-verification":
      process.env.NEXT_PUBLIC_BAIDU_VERIFY ?? "",
    "applicable-device": "pc,mobile",
    renderer: "webkit",
    "360-site-verification":
      process.env.NEXT_PUBLIC_360_VERIFY ?? "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <CanvasNest />
        <div className="headband" />
        <div className="site-frame">
          <SiteHeader />
          <main className="page-enter">{children}</main>
          <SiteFooter />
        </div>
        <BackToTop />
      </body>
    </html>
  );
}
