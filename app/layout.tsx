import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { Titillium_Web } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";
import { LanguageProvider } from "./components/LanguageProvider";

const Navbar = dynamic(() => import("./components/Navbar"));

const titillium = Titillium_Web({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
  variable: "--font-titillium",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "aldock — Marina bookings, simplified",
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
    <html lang="en" className={`${titillium.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <LanguageProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
