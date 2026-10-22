import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppProviders } from "@/components/providers";

// The font file is vendored in the repo (src/app/fonts) instead of being pulled
// from Google Fonts at build time. next/font/google downloads the CSS and the
// woff2 files during `next build`, which makes the build fail on a machine
// with no internet access. next/font/local is fully offline.
const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Altrox AI — Enterprise Inventory Management",
  description: "Modern inventory management platform for enterprises.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
