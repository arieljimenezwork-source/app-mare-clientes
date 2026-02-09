import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import IOSInstallPrompt from "@/components/IOSInstallPrompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

import { Fredoka, DM_Serif_Display, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* ─── Mare Café — Fuentes Premium ─── */
const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

import { getShopConfig } from "@/lib/shop-service";
import { ClientConfigProvider } from "@/context/ClientConfigContext";

const CLIENT_CODE = process.env.NEXT_PUBLIC_CLIENT_CODE || 'mare_cafe';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getShopConfig(CLIENT_CODE);

  if (!config) return { title: 'Loyalty App' };

  const icon = config.assets.favicon || config.assets.logo;

  return {
    title: `${config.name} Loyalty`,
    description: config.texts.welcomeSubtitle || "Tu tarjeta de fidelidad digital",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: icon,
      apple: icon,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getShopConfig(CLIENT_CODE);

  // If config fails to load, we should probably show a critical error or fallback
  // For now, we'll let it pass as null to context (which throws) or handle it gracefully?
  // The service returns a default config on error, so it should be fine.

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${fredoka.variable} ${dmSerif.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased`}
        style={{
          '--brand-primary': config?.theme.primaryColor || '#000000',
          '--brand-secondary': config?.theme.secondaryColor || '#ffffff',
          '--font-brand': config?.theme.fontFamily || 'sans-serif',
        } as React.CSSProperties}
      >
        {config ? (
          <ClientConfigProvider config={config}>
            {children}
            <IOSInstallPrompt />
          </ClientConfigProvider>
        ) : (
          <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-800 font-bold">
            Error loading shop configuration.
          </div>
        )}

      </body>
    </html>
  );
}
