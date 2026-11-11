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
  title: "Karcis | Tiketmu jadi paspor komunitas",
  description:
    "Tiket event komunitas yang tidak berakhir di tempat sampah. Scan di pintu masuk, kumpulkan stempel, buka akses ke obrolan, voting, dan reward komunitas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${outfit.variable} ${logoFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-text-main">
        <AppProviders>
          <Navbar />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
