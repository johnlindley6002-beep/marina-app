import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import AppChrome from "@/components/layout/AppChrome";
import SkipLink from "@/components/layout/SkipLink";
import { AuthProvider } from "@/components/providers/AuthProvider";
import DevPersonaSwitcher from "@/features/dev/components/DevPersonaSwitcher";
import { BoatProvider } from "@/components/providers/BoatProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import { UnitsProvider } from "@/components/providers/UnitsProvider";

// Latin covers English, Portuguese, Spanish and French, so the extended
// subset (about 170 KB more on the wire) is not loaded.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  // Absolute URLs for social previews. Set NEXT_PUBLIC_SITE_URL in production.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "aldock - Marina bookings, simplified",
  description: "Marina bookings, simplified.",
  applicationName: "aldock",
  appleWebApp: { capable: true, title: "aldock", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a1a2f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <LanguageProvider>
          <SkipLink />
          <UnitsProvider>
            <BoatProvider>
              <AuthProvider>
                <AppChrome>{children}</AppChrome>
                <ServiceWorkerRegister />
                <DevPersonaSwitcher />
              </AuthProvider>
            </BoatProvider>
          </UnitsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
