import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";
import { LanguageProvider } from "./components/LanguageProvider";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import { UnitsProvider } from "./components/UnitsProvider";

const Navbar = dynamic(() => import("./components/Navbar"));

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
            <Navbar />
            <main id="main" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <Footer />
            <ServiceWorkerRegister />
          </UnitsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
