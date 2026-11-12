import type { Metadata } from "next";
import { Bodoni_Moda, Outfit } from "next/font/google";
import "../styles/globals.css";
import { AppProviders } from "@/providers/AppProviders";
import { Navbar } from "@/components/layout/Navbar";

// Font utama seluruh aplikasi
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

// Dipakai khusus untuk logo wordmark "Karcis"
const logoFont = Bodoni_Moda({
  variable: "--font-logo",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Karcis | Your ticket becomes a community passport",
  description:
    "Community event tickets that don't end up in the trash. Scan at the door, collect stamps, and unlock chat, voting, and community rewards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${logoFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-text-main">
        <AppProviders>
          <Navbar />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
