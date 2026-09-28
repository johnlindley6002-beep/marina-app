import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import AppChrome from "./components/AppChrome";
import { AuthProvider } from "./components/AuthProvider";
import DevPersonaSwitcher from "./components/DevPersonaSwitcher";
import { BoatProvider } from "./components/BoatProvider";
import { LanguageProvider } from "./components/LanguageProvider";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import { UnitsProvider } from "./components/UnitsProvider";

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
  title: "aldock - Marina bookings, simplified",
  description: "Marina bookings, simplified.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a1a2f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <LanguageProvider>
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
