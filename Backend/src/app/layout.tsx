import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ganesha SaaS - API Explorer",
  description: "Ganesha SaaS Enterprise - Backend API Explorer",
  keywords: ["ERP", "Contable", "Accounting", "API Explorer", "Next.js", "TypeScript"],
  authors: [{ name: "Ganesha Team" }],
  icons: {
    icon: "/logoBackend.png",
  },
  openGraph: {
    title: "ERP Contable - API Explorer",
    description: "ERP Contable Enterprise - Backend API Explorer",
    url: "https://chat.z.ai",
    siteName: "ERP Contable",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ERP Contable - API Explorer",
    description: "ERP Contable Enterprise - Backend API Explorer",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
